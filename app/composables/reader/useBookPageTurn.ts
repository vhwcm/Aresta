import { computed, onMounted, onUnmounted, readonly, ref, watch, type Ref } from 'vue'
import * as THREE from 'three'
import { useReaderStore } from '~/stores/readerStore'
import type { IBookDocument, PageData } from '~/interfaces/reader/IBookDocument'

export type PageTurnDirection = 'next' | 'previous'

interface PageRaster {
  pageNumber: number
  canvas: HTMLCanvasElement
  texture: THREE.CanvasTexture
  backTexture: THREE.CanvasTexture
  aspectRatio: number
}

interface Point {
  x: number
  y: number
  time: number
}

const MAX_CACHED_PAGES = 5
const MAX_TEXTURE_EDGE = 2048
const TURN_DURATION_MS = 520
const TURN_THRESHOLD = 0.32

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value))
}

function smoothstep(value: number): number {
  const t = clamp(value)
  return t * t * (3 - 2 * t)
}

function easeOutCubic(value: number): number {
  return 1 - Math.pow(1 - clamp(value), 3)
}

export function shouldCommitPageTurn(progress: number, velocity: number): boolean {
  return clamp(progress) >= TURN_THRESHOLD || velocity > 0.002
}

function createRasterCanvas(page: PageData): HTMLCanvasElement {
  const source = document.createElement('canvas')
  source.width = Math.ceil(page.width)
  source.height = Math.ceil(page.height)

  const context = source.getContext('2d')
  if (!context) throw new Error('Não foi possível criar o contexto para a página.')

  return source
}

export function useBookPageTurn(hostRef: Ref<HTMLElement | null>) {
  const store = useReaderStore()
  const isTransitioning = ref(false)
  const isPreparing = ref(false)
  const errorMessage = ref<string | null>(null)
  const reducedMotion = ref(false)
  const webglAvailable = ref(true)

  const rasterCache = new Map<number, PageRaster>()
  const pendingRasters = new Map<number, Promise<PageRaster>>()
  let renderedPage = 0
  let activeDocument: IBookDocument | null = null
  let turnDirection: PageTurnDirection = 'next'
  let turnSource: PageRaster | null = null
  let turnTarget: PageRaster | null = null
  let dragStart: Point | null = null
  let dragLast: Point | null = null
  let pendingDragPoint: Point | null = null
  let dragEndedWhilePreparing = false
  let dragCancelledWhilePreparing = false
  let isDragging = false
  let turnProgress = 0
  let animationFrame: number | null = null
  let resolveAnimation: ((completed: boolean) => void) | null = null
  let resizeObserver: ResizeObserver | null = null
  let motionQuery: MediaQueryList | null = null

  let renderer: THREE.WebGLRenderer | null = null
  let scene: THREE.Scene | null = null
  let camera: THREE.OrthographicCamera | null = null
  let pageGeometry: THREE.PlaneGeometry | null = null
  let staticGeometry: THREE.PlaneGeometry | null = null
  let staticPage: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> | null = null
  let turningFront: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial> | null = null
  let turningBack: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial> | null = null
  let shadowPage: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> | null = null
  let fallbackCanvas: HTMLCanvasElement | null = null

  const canTurnNext = computed(() => store.canGoNext && !isTransitioning.value)
  const canTurnPrevious = computed(() => store.canGoPrev && !isTransitioning.value)

  function updateMotionPreference() {
    reducedMotion.value = motionQuery?.matches ?? false
  }

  function configureTexture(texture: THREE.CanvasTexture) {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.generateMipmaps = false
    texture.needsUpdate = true
  }

  async function createRaster(pageNumber: number, bookDocument: IBookDocument): Promise<PageRaster> {
    const page = await bookDocument.getPage(pageNumber)
    const source = createRasterCanvas(page)
    const sourceContext = source.getContext('2d')
    if (!sourceContext) throw new Error('Não foi possível renderizar a página.')

    await page.render(sourceContext)

    const scale = Math.min(1, MAX_TEXTURE_EDGE / Math.max(source.width, source.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(source.width * scale))
    canvas.height = Math.max(1, Math.round(source.height * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Não foi possível preparar a textura da página.')
    context.drawImage(source, 0, 0, canvas.width, canvas.height)

    const texture = new THREE.CanvasTexture(canvas)
    configureTexture(texture)
    const backTexture = texture.clone()
    backTexture.repeat.x = -1
    backTexture.offset.x = 1
    configureTexture(backTexture)

    return {
      pageNumber,
      canvas,
      texture,
      backTexture,
      aspectRatio: canvas.width / canvas.height,
    }
  }

  function disposeRaster(raster: PageRaster) {
    raster.texture.dispose()
    raster.backTexture.dispose()
    raster.canvas.width = 1
    raster.canvas.height = 1
  }

  function retainRasters() {
    const retainedPages = new Set([
      renderedPage,
      turnSource?.pageNumber,
      turnTarget?.pageNumber,
      store.currentPage - 1,
      store.currentPage,
      store.currentPage + 1,
    ])

    for (const [pageNumber, raster] of rasterCache) {
      if (rasterCache.size <= MAX_CACHED_PAGES || retainedPages.has(pageNumber)) continue
      rasterCache.delete(pageNumber)
      disposeRaster(raster)
    }

    while (rasterCache.size > MAX_CACHED_PAGES) {
      const oldest = rasterCache.entries().next().value as [number, PageRaster] | undefined
      if (!oldest) break
      rasterCache.delete(oldest[0])
      disposeRaster(oldest[1])
    }
  }

  async function getRaster(pageNumber: number, document = activeDocument): Promise<PageRaster> {
    if (!document) throw new Error('Nenhum documento está aberto.')
    const cached = rasterCache.get(pageNumber)
    if (cached) {
      rasterCache.delete(pageNumber)
      rasterCache.set(pageNumber, cached)
      return cached
    }

    const pending = pendingRasters.get(pageNumber)
    if (pending) return pending

    const request = createRaster(pageNumber, document)
      .then((raster) => {
        if (document !== activeDocument) {
          disposeRaster(raster)
          throw new Error('O documento foi alterado durante o carregamento da página.')
        }
        rasterCache.set(pageNumber, raster)
        retainRasters()
        return raster
      })
      .finally(() => pendingRasters.delete(pageNumber))

    pendingRasters.set(pageNumber, request)
    return request
  }

  function disposePageGeometry() {
    pageGeometry?.dispose()
    staticGeometry?.dispose()
    pageGeometry = null
    staticGeometry = null
  }

  function ensurePageGeometry(aspectRatio: number) {
    if (!scene || !staticPage || !turningFront || !turningBack || !shadowPage) return

    disposePageGeometry()
    const pageHeight = 2
    const pageWidth = pageHeight * aspectRatio
    staticGeometry = new THREE.PlaneGeometry(pageWidth, pageHeight)
    pageGeometry = new THREE.PlaneGeometry(pageWidth, pageHeight, 40, 18)
    pageGeometry.userData.basePositions = Float32Array.from(pageGeometry.attributes.position.array)
    staticPage.geometry = staticGeometry
    turningFront.geometry = pageGeometry
    turningBack.geometry = pageGeometry
    shadowPage.geometry.dispose()
    shadowPage.geometry = new THREE.PlaneGeometry(pageWidth * 1.04, pageHeight * 1.04)
    resizeScene(aspectRatio)
  }

  function resizeScene(aspectRatio = turnTarget?.aspectRatio ?? turnSource?.aspectRatio ?? 0.72) {
    const host = hostRef.value
    if (!host) return

    const width = Math.max(host.clientWidth, 1)
    const height = Math.max(host.clientHeight, 1)

    if (renderer) {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      renderer.setSize(width, height, false)
    }

    if (!camera) return
    const viewportAspect = width / height
    const pageWidth = aspectRatio * 2
    const visibleHeight = Math.max(2.3, (pageWidth * 1.12) / viewportAspect)
    const visibleWidth = visibleHeight * viewportAspect
    camera.left = -visibleWidth / 2
    camera.right = visibleWidth / 2
    camera.top = visibleHeight / 2
    camera.bottom = -visibleHeight / 2
    camera.updateProjectionMatrix()
    renderScene()
  }

  function createScene() {
    const host = hostRef.value
    if (!host || renderer || fallbackCanvas) return

    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
      renderer.setClearColor(0x000000, 0)
      renderer.domElement.className = 'page-curl-canvas'
      renderer.domElement.setAttribute('aria-hidden', 'true')
      host.appendChild(renderer.domElement)

      scene = new THREE.Scene()
      camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 20)
      camera.position.set(0, 0, 4)

      const ambient = new THREE.HemisphereLight(0xffffff, 0x202030, 2.2)
      scene.add(ambient)
      const light = new THREE.DirectionalLight(0xffffff, 2.4)
      light.position.set(-2, 3, 4)
      scene.add(light)

      const staticMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff })
      const frontMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.78, metalness: 0, side: THREE.FrontSide })
      const backMaterial = new THREE.MeshStandardMaterial({ color: 0xf3eee8, roughness: 0.9, metalness: 0, side: THREE.BackSide })
      const shadowMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthWrite: false })

      staticGeometry = new THREE.PlaneGeometry(1, 1)
      pageGeometry = new THREE.PlaneGeometry(1, 1, 40, 18)
      pageGeometry.userData.basePositions = Float32Array.from(pageGeometry.attributes.position.array)
      staticPage = new THREE.Mesh(staticGeometry, staticMaterial)
      turningFront = new THREE.Mesh(pageGeometry, frontMaterial)
      turningBack = new THREE.Mesh(pageGeometry, backMaterial)
      shadowPage = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), shadowMaterial)
      staticPage.position.z = -0.03
      shadowPage.position.z = -0.015
      turningFront.visible = false
      turningBack.visible = false
      scene.add(staticPage, shadowPage, turningFront, turningBack)
      resizeScene()
    } catch (error) {
      console.warn('[Reader] WebGL indisponível; usando renderer 2D.', error)
      webglAvailable.value = false
      renderer?.dispose()
      renderer = null
      scene = null
      camera = null
      fallbackCanvas = document.createElement('canvas')
      fallbackCanvas.className = 'page-curl-canvas'
      fallbackCanvas.setAttribute('aria-hidden', 'true')
      host.appendChild(fallbackCanvas)
    }
  }

  function renderScene() {
    if (renderer && scene && camera) renderer.render(scene, camera)
  }

  function renderFallback() {
    if (!fallbackCanvas || !turnTarget) return
    const host = hostRef.value
    if (!host) return
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
    fallbackCanvas.width = Math.max(1, Math.round(host.clientWidth * pixelRatio))
    fallbackCanvas.height = Math.max(1, Math.round(host.clientHeight * pixelRatio))
    const context = fallbackCanvas.getContext('2d')
    if (!context) return
    const width = fallbackCanvas.width
    const height = fallbackCanvas.height
    const targetRatio = turnTarget.aspectRatio
    const targetHeight = Math.min(height * 0.94, width / targetRatio)
    const targetWidth = targetHeight * targetRatio
    const x = (width - targetWidth) / 2
    const y = (height - targetHeight) / 2

    context.clearRect(0, 0, width, height)
    context.drawImage(turnTarget.canvas, x, y, targetWidth, targetHeight)
    if (!turnSource || turnProgress >= 1) return

    context.save()
    context.globalAlpha = 1 - turnProgress
    const inset = targetWidth * turnProgress * 0.06
    context.drawImage(turnSource.canvas, x + inset, y, targetWidth - inset, targetHeight)
    context.restore()
  }

  function setStaticRaster(raster: PageRaster) {
    if (staticPage) {
      staticPage.material.map = raster.texture
      staticPage.material.needsUpdate = true
      ensurePageGeometry(raster.aspectRatio)
      staticPage.visible = true
      shadowPage!.visible = false
      turningFront!.visible = false
      turningBack!.visible = false
      renderScene()
    } else {
      turnTarget = raster
      turnSource = null
      turnProgress = 1
      renderFallback()
    }
  }

  function applyTurnTextures() {
    if (!turnSource || !turnTarget) return
    if (!staticPage || !turningFront || !turningBack || !shadowPage) {
      renderFallback()
      return
    }

    staticPage.material.map = turnTarget.texture
    staticPage.material.needsUpdate = true
    turningFront.material.map = turnSource.texture
    turningFront.material.needsUpdate = true
    turningBack.material.map = turnSource.backTexture
    turningBack.material.needsUpdate = true
    ensurePageGeometry(turnTarget.aspectRatio)
    staticPage.visible = true
    turningFront.visible = true
    turningBack.visible = true
    shadowPage.visible = true
  }

  function updateCurlGeometry() {
    if (!pageGeometry || !turningFront || !turningBack || !shadowPage) return
    const position = pageGeometry.attributes.position
    const basePositions = pageGeometry.userData.basePositions as Float32Array
    const width = pageGeometry.parameters.width
    const halfWidth = width / 2
    const progress = turnProgress
    const curlStart = Math.max(0, 1 - progress * 1.12)
    const curlWidth = Math.max(progress * 1.12, 0.001)
    const settle = smoothstep((progress - 0.82) / 0.18)
    const forward = turnDirection === 'next'

    for (let index = 0; index < position.count; index += 1) {
      const originalX = basePositions[index * 3]
      const originalY = basePositions[index * 3 + 1]
      const unitX = forward
        ? (originalX + halfWidth) / width
        : (halfWidth - originalX) / width
      const folded = clamp((unitX - curlStart) / curlWidth)
      const angle = folded * Math.PI * (0.72 + progress * 0.28)
      const radius = Math.max(width * Math.max(progress, 0.12) / Math.PI, 0.02)
      const hinge = forward
        ? -halfWidth + curlStart * width
        : halfWidth - curlStart * width
      const curveX = forward
        ? hinge + radius * Math.sin(angle)
        : hinge - radius * Math.sin(angle)
      const curveZ = radius * (1 - Math.cos(angle)) * 0.58
      const flatX = forward ? -originalX : -originalX

      position.setXYZ(
        index,
        THREE.MathUtils.lerp(originalX, THREE.MathUtils.lerp(curveX, flatX, settle), folded),
        originalY,
        THREE.MathUtils.lerp(0, -0.02, settle),
      )
      if (folded > 0) position.setZ(index, THREE.MathUtils.lerp(curveZ, -0.02, settle))
    }

    position.needsUpdate = true
    pageGeometry.computeVertexNormals()
    shadowPage.material.opacity = 0.12 + Math.sin(progress * Math.PI) * 0.2
  }

  function drawTurn() {
    if (renderer) {
      updateCurlGeometry()
      renderScene()
      return
    }
    renderFallback()
  }

  function setTurnProgress(progress: number) {
    turnProgress = clamp(progress)
    drawTurn()
  }

  function cancelAnimation() {
    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame)
      animationFrame = null
    }
    resolveAnimation?.(false)
    resolveAnimation = null
  }

  function animateTo(target: number): Promise<boolean> {
    cancelAnimation()
    const start = turnProgress
    const distance = Math.abs(target - start)
    const duration = Math.max(120, TURN_DURATION_MS * distance)

    return new Promise((resolve) => {
      resolveAnimation = resolve
      let startedAt: number | null = null
      const tick = (timestamp: number) => {
        if (startedAt === null) startedAt = timestamp
        const elapsed = (timestamp - startedAt) / duration
        const amount = easeOutCubic(elapsed)
        setTurnProgress(start + (target - start) * amount)
        if (elapsed < 1) {
          animationFrame = requestAnimationFrame(tick)
          return
        }
        animationFrame = null
        resolveAnimation = null
        resolve(true)
      }
      animationFrame = requestAnimationFrame(tick)
    })
  }

  function targetFor(direction: PageTurnDirection): number | null {
    const target = direction === 'next' ? store.currentPage + 1 : store.currentPage - 1
    if (target < 1 || target > store.totalPages) return null
    return target
  }

  async function prepareTurn(direction: PageTurnDirection): Promise<boolean> {
    const targetPage = targetFor(direction)
    if (!targetPage || !activeDocument) return false

    isPreparing.value = true
    errorMessage.value = null
    try {
      const [source, target] = await Promise.all([
        getRaster(store.currentPage),
        getRaster(targetPage),
      ])
      if (activeDocument !== store.document) return false
      turnDirection = direction
      turnSource = source
      turnTarget = target
      turnProgress = 0
      applyTurnTextures()
      drawTurn()
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      errorMessage.value = `Não foi possível preparar a virada: ${message}`
      store.setError(errorMessage.value)
      return false
    } finally {
      isPreparing.value = false
    }
  }

  function settleTurn(committed: boolean) {
    if (committed && turnTarget) {
      renderedPage = turnTarget.pageNumber
      store.goToPage(renderedPage)
      setStaticRaster(turnTarget)
      prefetchNeighbors(renderedPage)
    } else if (turnSource) {
      setStaticRaster(turnSource)
    }

    turnSource = null
    turnTarget = null
    turnProgress = 0
    isDragging = false
    dragStart = null
    dragLast = null
    pendingDragPoint = null
    dragEndedWhilePreparing = false
    dragCancelledWhilePreparing = false
    isTransitioning.value = false
  }

  async function requestTurn(direction: PageTurnDirection): Promise<void> {
    if (isTransitioning.value) return
    const target = targetFor(direction)
    if (!target) return

    isTransitioning.value = true
    const prepared = await prepareTurn(direction)
    if (!prepared) {
      isTransitioning.value = false
      return
    }

    if (reducedMotion.value) {
      setTurnProgress(1)
      settleTurn(true)
      return
    }

    const completed = await animateTo(1)
    if (completed) settleTurn(true)
  }

  function pointerProgress(point: Point): number {
    if (!dragStart || !hostRef.value) return 0
    const width = Math.max(hostRef.value.clientWidth, 1)
    const distance = turnDirection === 'next'
      ? dragStart.x - point.x
      : point.x - dragStart.x
    return clamp(distance / (width * 0.48))
  }

  async function beginDrag(direction: PageTurnDirection, point: Point): Promise<void> {
    if (isTransitioning.value) return
    const target = targetFor(direction)
    if (!target) return

    isTransitioning.value = true
    pendingDragPoint = point
    dragEndedWhilePreparing = false
    dragCancelledWhilePreparing = false
    const prepared = await prepareTurn(direction)
    if (!prepared) {
      isTransitioning.value = false
      return
    }

    dragStart = point
    dragLast = pendingDragPoint ?? point
    pendingDragPoint = null
    isDragging = true
    setTurnProgress(pointerProgress(dragLast))

    if (dragEndedWhilePreparing) {
      const wasCancelled = dragCancelledWhilePreparing
      dragEndedWhilePreparing = false
      dragCancelledWhilePreparing = false
      if (wasCancelled) void cancelDrag(dragLast)
      else void endDrag(dragLast)
    }
  }

  function updateDrag(point: Point) {
    if (!isTransitioning.value) return
    if (!isDragging) {
      pendingDragPoint = point
      return
    }
    dragLast = point
    setTurnProgress(pointerProgress(point))
  }

  async function endDrag(point: Point): Promise<void> {
    if (!isTransitioning.value) return
    if (!isDragging) {
      pendingDragPoint = point
      dragEndedWhilePreparing = true
      dragCancelledWhilePreparing = false
      return
    }

    updateDrag(point)
    const previous = dragLast
    const velocity = previous && dragStart
      ? (pointerProgress(previous) - pointerProgress(dragStart)) / Math.max(previous.time - dragStart.time, 1)
      : 0
    const shouldCommit = shouldCommitPageTurn(turnProgress, velocity)
    isDragging = false

    if (reducedMotion.value) {
      setTurnProgress(shouldCommit ? 1 : 0)
      settleTurn(shouldCommit)
      return
    }

    const completed = await animateTo(shouldCommit ? 1 : 0)
    if (completed) settleTurn(shouldCommit)
  }

  async function cancelDrag(point: Point): Promise<void> {
    if (!isTransitioning.value) return
    if (!isDragging) {
      pendingDragPoint = point
      dragEndedWhilePreparing = true
      dragCancelledWhilePreparing = true
      return
    }

    isDragging = false
    const completed = reducedMotion.value ? true : await animateTo(0)
    if (completed) settleTurn(false)
  }

  function prefetchNeighbors(pageNumber: number) {
    if (!activeDocument) return
    for (const candidate of [pageNumber - 1, pageNumber + 1]) {
      if (candidate >= 1 && candidate <= store.totalPages) {
        void getRaster(candidate).catch(() => undefined)
      }
    }
  }

  async function displayPage(pageNumber: number) {
    if (!activeDocument || isTransitioning.value) return
    isPreparing.value = true
    try {
      const raster = await getRaster(pageNumber)
      if (activeDocument !== store.document) return
      renderedPage = pageNumber
      setStaticRaster(raster)
      prefetchNeighbors(pageNumber)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      errorMessage.value = `Não foi possível renderizar a página: ${message}`
      store.setError(errorMessage.value)
    } finally {
      isPreparing.value = false
    }
  }

  function clearRasters() {
    pendingRasters.clear()
    for (const raster of rasterCache.values()) disposeRaster(raster)
    rasterCache.clear()
  }

  async function syncDocument(document: IBookDocument | null) {
    cancelAnimation()
    isTransitioning.value = false
    isDragging = false
    dragEndedWhilePreparing = false
    dragCancelledWhilePreparing = false
    turnSource = null
    turnTarget = null
    activeDocument = document
    renderedPage = 0
    clearRasters()
    if (!document) return
    await displayPage(store.currentPage)
  }

  function destroyScene() {
    disposePageGeometry()
    staticPage?.material.dispose()
    turningFront?.material.dispose()
    turningBack?.material.dispose()
    shadowPage?.geometry.dispose()
    shadowPage?.material.dispose()
    renderer?.dispose()
    renderer?.domElement.remove()
    fallbackCanvas?.remove()
    renderer = null
    scene = null
    camera = null
    staticPage = null
    turningFront = null
    turningBack = null
    shadowPage = null
    fallbackCanvas = null
  }

  watch(
    () => store.document,
    (document) => { void syncDocument(document) },
  )

  watch(
    () => store.currentPage,
    (pageNumber) => {
      if (!isTransitioning.value && pageNumber !== renderedPage) void displayPage(pageNumber)
    },
  )

  onMounted(() => {
    motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    updateMotionPreference()
    motionQuery.addEventListener('change', updateMotionPreference)
    createScene()
    resizeObserver = new ResizeObserver(() => resizeScene())
    if (hostRef.value) resizeObserver.observe(hostRef.value)
    void syncDocument(store.document)
  })

  onUnmounted(() => {
    cancelAnimation()
    resizeObserver?.disconnect()
    motionQuery?.removeEventListener('change', updateMotionPreference)
    clearRasters()
    destroyScene()
  })

  return {
    isTransitioning: readonly(isTransitioning),
    isPreparing: readonly(isPreparing),
    errorMessage: readonly(errorMessage),
    webglAvailable: readonly(webglAvailable),
    canTurnNext,
    canTurnPrevious,
    requestTurn,
    beginDrag,
    updateDrag,
    endDrag,
    cancelDrag,
  }
}
