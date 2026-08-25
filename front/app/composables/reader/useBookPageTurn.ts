// @ts-nocheck
import { computed, onMounted, onUnmounted, readonly, ref, watch, type Ref } from 'vue'
import * as THREE from 'three'
import { useReaderStore } from '~/stores/readerStore'
import { useSettings } from '~/composables/useSettings'
import type { IBookDocument, PageData } from '~/interfaces/reader/IBookDocument'
import { logWarn } from '~/utils/logger'

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

const MAX_CACHED_PAGES = 8
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
    const { pageAnimationEnabled } = useSettings()
    const isTransitioning = ref(false)
    const isPreparing = ref(false)
    const errorMessage = ref<string | null>(null)
    const reducedMotion = ref(false)
    const isAnimationDisabled = computed(() => !pageAnimationEnabled.value || reducedMotion.value)
    const webglAvailable = ref(true)

    const rasterCache = new Map<number, PageRaster>()
    const pendingRasters = new Map<number, Promise<PageRaster>>()
    let blankRaster: PageRaster | null = null
    let renderedPage = 0
    let activeDocument: IBookDocument | null = null
    let turnDirection: PageTurnDirection = 'next'
    let turnSource: PageRaster | null = null
    let turnTarget: PageRaster | null = null
    let turnBack: PageRaster | null = null
    let turnLeftStatic: PageRaster | null = null
    let turnRightStatic: PageRaster | null = null
    let dragStart: Point | null = null
    let dragLast: Point | null = null
    let pendingDragPoint: Point | null = null
    let dragEndedWhilePreparing = false
    let dragCancelledWhilePreparing = false
    let isDragging = false
    let turnProgress = 0
    let animationFrame: number | null = null
    let pendingDragFrame: number | null = null
    let resolveAnimation: ((completed: boolean) => void) | null = null
    let resizeObserver: ResizeObserver | null = null
    let motionQuery: MediaQueryList | null = null
    let lastGeometryAspectRatio = -1
    let lastGeometryTwoPageMode = false

    let renderer: THREE.WebGLRenderer | null = null
    let scene: THREE.Scene | null = null
    let camera: THREE.OrthographicCamera | null = null
    let pageGeometry: THREE.PlaneGeometry | null = null
    let staticGeometry: THREE.PlaneGeometry | null = null
    let leftStaticPage: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> | null = null
    let rightStaticPage: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> | null = null
    let spineShadow: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> | null = null
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

    function getBlankRaster(aspectRatio = 0.72): PageRaster {
        if (blankRaster && Math.abs(blankRaster.aspectRatio - aspectRatio) < 0.01) {
            return blankRaster
        }
        if (blankRaster) {
            disposeRaster(blankRaster)
        }
        const canvas = document.createElement('canvas')
        canvas.width = 600
        canvas.height = Math.max(1, Math.round(600 / Math.max(0.1, aspectRatio)))
        const context = canvas.getContext('2d')
        if (context) {
            context.fillStyle = '#ffffff'
            context.fillRect(0, 0, canvas.width, canvas.height)
        }
        const texture = new THREE.CanvasTexture(canvas)
        configureTexture(texture)
        const backTexture = texture.clone()
        backTexture.repeat.x = -1
        backTexture.offset.x = 1
        configureTexture(backTexture)

        blankRaster = {
            pageNumber: 0,
            canvas,
            texture,
            backTexture,
            aspectRatio,
        }
        return blankRaster
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
            renderedPage + 1,
            turnSource?.pageNumber,
            turnTarget?.pageNumber,
            turnBack?.pageNumber,
            store.currentPage - 2,
            store.currentPage - 1,
            store.currentPage,
            store.currentPage + 1,
            store.currentPage + 2,
            store.currentPage + 3,
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
        if (pageNumber < 1 || pageNumber > store.totalPages) {
            return getBlankRaster()
        }

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
        if (!scene || !leftStaticPage || !rightStaticPage || !turningFront || !turningBack || !shadowPage || !spineShadow) return
        const isTwoPage = store.isTwoPageMode
        if (
            Math.abs(aspectRatio - lastGeometryAspectRatio) < 0.001
            && isTwoPage === lastGeometryTwoPageMode
        ) {
            return
        }

        lastGeometryAspectRatio = aspectRatio
        lastGeometryTwoPageMode = isTwoPage
        disposePageGeometry()

        const pageHeight = 2
        const pageWidth = pageHeight * aspectRatio
        const halfWidth = pageWidth / 2
        const halfHeight = pageHeight / 2
        const boundX = isTwoPage ? pageWidth : halfWidth

        const clipPlanes = scene.userData.clipPlanes as THREE.Plane[] | undefined
        if (clipPlanes) {
            clipPlanes[0].constant = boundX
            clipPlanes[1].constant = boundX
            clipPlanes[2].constant = halfHeight
            clipPlanes[3].constant = halfHeight
        }

        staticGeometry = new THREE.PlaneGeometry(pageWidth, pageHeight)
        pageGeometry = new THREE.PlaneGeometry(pageWidth, pageHeight, 60, 24)
        pageGeometry.userData.basePositions = Float32Array.from(pageGeometry.attributes.position.array)

        leftStaticPage.geometry = staticGeometry
        rightStaticPage.geometry = staticGeometry
        turningFront.geometry = pageGeometry
        turningBack.geometry = pageGeometry

        shadowPage.geometry.dispose()
        shadowPage.geometry = new THREE.PlaneGeometry(pageWidth * 1.02, pageHeight * 1.02)

        spineShadow.geometry.dispose()
        spineShadow.geometry = new THREE.PlaneGeometry(Math.max(0.02, pageWidth * 0.04), pageHeight)

        if (isTwoPage) {
            leftStaticPage.position.set(-halfWidth, 0, -0.03)
            rightStaticPage.position.set(halfWidth, 0, -0.03)
            rightStaticPage.visible = true
            spineShadow.position.set(0, 0, -0.01)
            spineShadow.visible = true
        } else {
            leftStaticPage.position.set(0, 0, -0.03)
            rightStaticPage.visible = false
            spineShadow.visible = false
        }

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
        const isTwoPage = store.isTwoPageMode
        const totalBookWidth = isTwoPage ? (aspectRatio * 4) : (aspectRatio * 2)
        const visibleHeight = Math.max(2.05, (totalBookWidth * 1.05) / viewportAspect)
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
            renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true,
                powerPreference: 'high-performance',
                stencil: true,
            })
            renderer.setClearColor(0x000000, 0)
            renderer.localClippingEnabled = true

            renderer.domElement.className = 'page-curl-canvas'
            renderer.domElement.setAttribute('aria-hidden', 'true')
            host.appendChild(renderer.domElement)

            scene = new THREE.Scene()
            camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 20)
            camera.position.set(0, 0, 4)

            const ambient = new THREE.HemisphereLight(0xffffff, 0xffffff, 1.5)
            scene.add(ambient)

            const light = new THREE.DirectionalLight(0xffffff, 1.2)
            light.position.set(-1.5, 2, 4)
            scene.add(light)

            const backLight = new THREE.DirectionalLight(0xffffff, 0.8)
            backLight.position.set(1.5, -2, -4)
            scene.add(backLight)

            const clipPlanes = [
                new THREE.Plane(new THREE.Vector3(1, 0, 0), 1),
                new THREE.Plane(new THREE.Vector3(-1, 0, 0), 1),
                new THREE.Plane(new THREE.Vector3(0, -1, 0), 1),
                new THREE.Plane(new THREE.Vector3(0, 1, 0), 1),
            ]
            scene.userData.clipPlanes = clipPlanes

            const staticLeftMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, clippingPlanes: clipPlanes })
            const staticRightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, clippingPlanes: clipPlanes })
            const spineMaterial = new THREE.MeshBasicMaterial({
                color: 0x000000,
                transparent: true,
                opacity: 0.12,
                depthWrite: false,
                clippingPlanes: clipPlanes,
            })

            const frontMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffff, roughness: 0.5, metalness: 0.1, side: THREE.FrontSide, clippingPlanes: clipPlanes,
            })
            const backMaterial = new THREE.MeshStandardMaterial({
                color: 0xf3eee8, roughness: 0.6, metalness: 0.1, side: THREE.BackSide, clippingPlanes: clipPlanes,
            })
            const shadowMaterial = new THREE.MeshBasicMaterial({
                color: 0x000000, transparent: true, opacity: 0, depthWrite: false, clippingPlanes: clipPlanes,
            })

            staticGeometry = new THREE.PlaneGeometry(1, 1)
            pageGeometry = new THREE.PlaneGeometry(1, 1, 40, 18)
            pageGeometry.userData.basePositions = Float32Array.from(pageGeometry.attributes.position.array)

            leftStaticPage = new THREE.Mesh(staticGeometry, staticLeftMaterial)
            rightStaticPage = new THREE.Mesh(staticGeometry, staticRightMaterial)
            spineShadow = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 2), spineMaterial)
            turningFront = new THREE.Mesh(pageGeometry, frontMaterial)
            turningBack = new THREE.Mesh(pageGeometry, backMaterial)
            shadowPage = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), shadowMaterial)

            turningFront.renderOrder = 1
            turningBack.renderOrder = 1
            leftStaticPage.renderOrder = 2
            rightStaticPage.renderOrder = 2
            shadowPage.renderOrder = 3
            spineShadow.renderOrder = 4

            leftStaticPage.position.z = -0.03
            rightStaticPage.position.z = -0.03
            spineShadow.position.z = -0.01
            shadowPage.position.z = -0.015
            turningFront.visible = false
            turningBack.visible = false
            rightStaticPage.visible = false
            spineShadow.visible = false

            scene.add(leftStaticPage, rightStaticPage, spineShadow, shadowPage, turningFront, turningBack)
            resizeScene()
        } catch (error) {
            logWarn('[Reader] WebGL indisponível; usando renderer 2D.', error)
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
        if (!fallbackCanvas) return
        const host = hostRef.value
        if (!host) return
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
        fallbackCanvas.width = Math.max(1, Math.round(host.clientWidth * pixelRatio))
        fallbackCanvas.height = Math.max(1, Math.round(host.clientHeight * pixelRatio))
        const context = fallbackCanvas.getContext('2d')
        if (!context) return
        const width = fallbackCanvas.width
        const height = fallbackCanvas.height
        context.clearRect(0, 0, width, height)

        const isTwoPage = store.isTwoPageMode
        const targetRatio = turnTarget?.aspectRatio ?? turnSource?.aspectRatio ?? 0.72

        if (isTwoPage) {
            const targetHeight = Math.min(height, width / (2 * targetRatio))
            const targetWidth = targetHeight * targetRatio
            const startX = (width - 2 * targetWidth) / 2
            const y = (height - targetHeight) / 2

            if (turnLeftStatic) {
                context.drawImage(turnLeftStatic.canvas, startX, y, targetWidth, targetHeight)
            }
            if (turnRightStatic) {
                context.drawImage(turnRightStatic.canvas, startX + targetWidth, y, targetWidth, targetHeight)
            }

            // Spine shadow
            context.fillStyle = 'rgba(0,0,0,0.1)'
            context.fillRect(startX + targetWidth - 1, y, 2, targetHeight)
        } else {
            if (!turnTarget && !turnSource) return
            const target = turnTarget ?? turnSource
            const targetHeight = Math.min(height, width / targetRatio)
            const targetWidth = targetHeight * targetRatio
            const x = (width - targetWidth) / 2
            const y = (height - targetHeight) / 2

            context.drawImage(target.canvas, x, y, targetWidth, targetHeight)
            if (turnSource && turnProgress < 1 && turnTarget) {
                context.save()
                context.globalAlpha = 1 - turnProgress
                const inset = targetWidth * turnProgress * 0.06
                context.drawImage(turnSource.canvas, x + inset, y, targetWidth - inset, targetHeight)
                context.restore()
            }
        }
    }

    function setStaticSpread(leftRaster: PageRaster, rightRaster?: PageRaster | null) {
        if (leftStaticPage && rightStaticPage && spineShadow && turningFront && turningBack && shadowPage) {
            const isTwoPage = store.isTwoPageMode
            ensurePageGeometry(leftRaster.aspectRatio)

            const halfWidth = (2 * leftRaster.aspectRatio) / 2

            if (isTwoPage) {
                leftStaticPage.material.map = leftRaster.texture
                leftStaticPage.material.needsUpdate = true
                leftStaticPage.material.stencilWrite = false
                leftStaticPage.position.set(-halfWidth, 0, -0.03)
                leftStaticPage.visible = true

                const right = rightRaster ?? getBlankRaster(leftRaster.aspectRatio)
                rightStaticPage.material.map = right.texture
                rightStaticPage.material.needsUpdate = true
                rightStaticPage.material.stencilWrite = false
                rightStaticPage.position.set(halfWidth, 0, -0.03)
                rightStaticPage.visible = true

                spineShadow.position.set(0, 0, -0.01)
                spineShadow.visible = true
            } else {
                leftStaticPage.material.map = leftRaster.texture
                leftStaticPage.material.needsUpdate = true
                leftStaticPage.material.stencilWrite = false
                leftStaticPage.position.set(0, 0, -0.03)
                leftStaticPage.visible = true

                rightStaticPage.visible = false
                spineShadow.visible = false
            }

            shadowPage.visible = false
            turningFront.visible = false
            turningBack.visible = false
            renderScene()
        } else {
            turnLeftStatic = leftRaster
            turnRightStatic = rightRaster ?? null
            turnTarget = leftRaster
            turnSource = null
            turnProgress = 1
            renderFallback()
        }
    }

    function applyTurnTextures() {
        if (!turnSource || !turnTarget) return
        if (!leftStaticPage || !rightStaticPage || !turningFront || !turningBack || !shadowPage || !spineShadow) {
            renderFallback()
            return
        }

        const isTwoPage = store.isTwoPageMode
        const stencilRef = 1

        turningFront.material.colorWrite = true
        turningFront.material.depthWrite = true
        turningFront.material.stencilWrite = true
        turningFront.material.stencilFunc = THREE.AlwaysStencilFunc
        turningFront.material.stencilFail = THREE.KeepStencilOp
        turningFront.material.stencilZFail = THREE.KeepStencilOp
        turningFront.material.stencilZPass = THREE.ReplaceStencilOp
        turningFront.material.stencilRef = stencilRef

        turningBack.material.colorWrite = true
        turningBack.material.depthWrite = true
        turningBack.material.stencilWrite = true
        turningBack.material.stencilFunc = THREE.AlwaysStencilFunc
        turningBack.material.stencilFail = THREE.KeepStencilOp
        turningBack.material.stencilZFail = THREE.KeepStencilOp
        turningBack.material.stencilZPass = THREE.ReplaceStencilOp
        turningBack.material.stencilRef = stencilRef

        shadowPage.material.stencilWrite = true
        shadowPage.material.stencilFunc = THREE.NotEqualStencilFunc
        shadowPage.material.stencilFail = THREE.KeepStencilOp
        shadowPage.material.stencilZFail = THREE.KeepStencilOp
        shadowPage.material.stencilZPass = THREE.KeepStencilOp
        shadowPage.material.stencilRef = stencilRef

        ensurePageGeometry(turnSource.aspectRatio)

        if (!isTwoPage) {
            leftStaticPage.material.map = turnTarget.texture
            leftStaticPage.material.needsUpdate = true
            leftStaticPage.material.stencilWrite = true
            leftStaticPage.material.stencilFunc = THREE.NotEqualStencilFunc
            leftStaticPage.material.stencilFail = THREE.KeepStencilOp
            leftStaticPage.material.stencilZFail = THREE.KeepStencilOp
            leftStaticPage.material.stencilZPass = THREE.KeepStencilOp
            leftStaticPage.material.stencilRef = stencilRef
            leftStaticPage.position.set(0, 0, -0.03)
            leftStaticPage.visible = true

            rightStaticPage.visible = false
            spineShadow.visible = false

            turningFront.material.map = turnSource.texture
            turningFront.material.needsUpdate = true
            turningBack.material.map = turnSource.backTexture
            turningBack.material.needsUpdate = true
        } else {
            const halfWidth = (2 * turnSource.aspectRatio) / 2
            spineShadow.visible = true

            if (turnDirection === 'next') {
                if (turnLeftStatic) {
                    leftStaticPage.material.map = turnLeftStatic.texture
                    leftStaticPage.material.needsUpdate = true
                }
                leftStaticPage.material.stencilWrite = false
                leftStaticPage.position.set(-halfWidth, 0, -0.04)
                leftStaticPage.visible = true

                rightStaticPage.material.map = turnTarget.texture
                rightStaticPage.material.needsUpdate = true
                rightStaticPage.material.stencilWrite = true
                rightStaticPage.material.stencilFunc = THREE.NotEqualStencilFunc
                rightStaticPage.material.stencilFail = THREE.KeepStencilOp
                rightStaticPage.material.stencilZFail = THREE.KeepStencilOp
                rightStaticPage.material.stencilZPass = THREE.KeepStencilOp
                rightStaticPage.material.stencilRef = stencilRef
                rightStaticPage.position.set(halfWidth, 0, -0.03)
                rightStaticPage.visible = true

                turningFront.material.map = turnSource.texture
                turningFront.material.needsUpdate = true
                turningBack.material.map = (turnBack ?? turnTarget).backTexture
                turningBack.material.needsUpdate = true
            } else {
                if (turnRightStatic) {
                    rightStaticPage.material.map = turnRightStatic.texture
                    rightStaticPage.material.needsUpdate = true
                }
                rightStaticPage.material.stencilWrite = false
                rightStaticPage.position.set(halfWidth, 0, -0.04)
                rightStaticPage.visible = true

                leftStaticPage.material.map = turnTarget.texture
                leftStaticPage.material.needsUpdate = true
                leftStaticPage.material.stencilWrite = true
                leftStaticPage.material.stencilFunc = THREE.NotEqualStencilFunc
                leftStaticPage.material.stencilFail = THREE.KeepStencilOp
                leftStaticPage.material.stencilZFail = THREE.KeepStencilOp
                leftStaticPage.material.stencilZPass = THREE.KeepStencilOp
                leftStaticPage.material.stencilRef = stencilRef
                leftStaticPage.position.set(-halfWidth, 0, -0.03)
                leftStaticPage.visible = true

                turningFront.material.map = turnSource.texture
                turningFront.material.needsUpdate = true
                turningBack.material.map = (turnBack ?? turnTarget).backTexture
                turningBack.material.needsUpdate = true
            }
        }

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
        const forward = turnDirection === 'next'
        const isTwoPage = store.isTwoPageMode

        const radius = width * (0.12 - (progress * 0.04))
        const circumference = Math.PI * radius
        const angleOffset = 0.15

        if (!isTwoPage) {
            const foldX = forward
                ? halfWidth - (width + circumference * 2) * progress
                : -halfWidth + (width + circumference * 2) * progress

            for (let index = 0; index < position.count; index += 1) {
                const originalX = basePositions[index * 3]
                const originalY = basePositions[index * 3 + 1]
                const distanceToFold = forward
                    ? (originalX - (foldX + originalY * angleOffset))
                    : ((foldX + originalY * angleOffset) - originalX)

                let finalX = originalX
                let finalZ = 0

                if (distanceToFold > 0) {
                    if (distanceToFold < circumference) {
                        const theta = distanceToFold / radius
                        const curlX = radius * Math.sin(theta)
                        finalZ = radius * (1 - Math.cos(theta))
                        finalX = forward
                            ? (foldX + originalY * angleOffset) + curlX
                            : (foldX + originalY * angleOffset) - curlX
                    } else {
                        const remainingPaper = distanceToFold - circumference
                        finalX = forward
                            ? (foldX + originalY * angleOffset) - remainingPaper
                            : (foldX + originalY * angleOffset) + remainingPaper
                        finalZ = radius * 2
                    }
                }

                const settle = smoothstep(progress < 0.5 ? progress / 0.2 : (1 - progress) / 0.2)
                position.setXYZ(
                    index,
                    finalX,
                    originalY,
                    THREE.MathUtils.lerp(0, finalZ, settle),
                )
            }
        } else {
            const foldX = forward
                ? width - (2 * width + circumference * 2) * progress
                : -width + (2 * width + circumference * 2) * progress

            for (let index = 0; index < position.count; index += 1) {
                const localX = basePositions[index * 3]
                const originalY = basePositions[index * 3 + 1]
                const bookX = forward ? (localX + halfWidth) : (localX - halfWidth)

                const distanceToFold = forward
                    ? (bookX - (foldX + originalY * angleOffset))
                    : ((foldX + originalY * angleOffset) - bookX)

                let finalX = bookX
                let finalZ = 0

                if (distanceToFold > 0) {
                    if (distanceToFold < circumference) {
                        const theta = distanceToFold / radius
                        const curlX = radius * Math.sin(theta)
                        finalZ = radius * (1 - Math.cos(theta))
                        finalX = forward
                            ? (foldX + originalY * angleOffset) + curlX
                            : (foldX + originalY * angleOffset) - curlX
                    } else {
                        const remainingPaper = distanceToFold - circumference
                        finalX = forward
                            ? (foldX + originalY * angleOffset) - remainingPaper
                            : (foldX + originalY * angleOffset) + remainingPaper
                        finalZ = radius * 2
                    }
                }

                const settle = smoothstep(progress < 0.5 ? progress / 0.2 : (1 - progress) / 0.2)
                position.setXYZ(
                    index,
                    finalX,
                    originalY,
                    THREE.MathUtils.lerp(0, finalZ, settle),
                )
            }
        }

        position.needsUpdate = true
        pageGeometry.computeVertexNormals()

        const shadowIntensity = Math.sin(progress * Math.PI)
        shadowPage.material.opacity = 0.25 * shadowIntensity
        shadowPage.scale.set(1 + progress * 0.05, 1 + progress * 0.05, 1)
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
        if (pendingDragFrame !== null) {
            cancelAnimationFrame(pendingDragFrame)
            pendingDragFrame = null
        }
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
        const duration = Math.max(80, TURN_DURATION_MS * Math.min(distance, 1))

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
        if (store.isTwoPageMode) {
            if (direction === 'next') {
                const target = store.currentPage + 2
                if (target > store.totalPages && store.currentPage + 1 >= store.totalPages) return null
                return target <= store.totalPages ? target : store.totalPages
            } else {
                const target = store.currentPage - 2
                if (target < 1 && store.currentPage <= 1) return null
                return Math.max(1, target)
            }
        } else {
            const target = direction === 'next' ? store.currentPage + 1 : store.currentPage - 1
            if (target < 1 || target > store.totalPages) return null
            return target
        }
    }

    async function prepareTurn(direction: PageTurnDirection): Promise<boolean> {
        const targetPage = targetFor(direction)
        if (!targetPage || !activeDocument) return false

        isPreparing.value = true
        errorMessage.value = null
        try {
            if (!store.isTwoPageMode) {
                const [source, target] = await Promise.all([
                    getRaster(store.currentPage),
                    getRaster(targetPage),
                ])
                if (activeDocument !== store.document) return false
                turnDirection = direction
                turnSource = source
                turnTarget = target
                turnBack = null
                turnLeftStatic = null
                turnRightStatic = null
            } else {
                const currentLeft = store.currentPage
                const currentRight = currentLeft + 1
                if (direction === 'next') {
                    const nextLeft = targetPage
                    const nextRight = nextLeft + 1
                    const [cLeft, cRight, nLeft, nRight] = await Promise.all([
                        getRaster(currentLeft),
                        getRaster(currentRight),
                        getRaster(nextLeft),
                        getRaster(nextRight),
                    ])
                    if (activeDocument !== store.document) return false
                    turnDirection = 'next'
                    turnSource = cRight
                    turnBack = nLeft
                    turnTarget = nRight
                    turnLeftStatic = cLeft
                    turnRightStatic = nRight
                } else {
                    const prevLeft = targetPage
                    const prevRight = prevLeft + 1
                    const [pLeft, pRight, cLeft, cRight] = await Promise.all([
                        getRaster(prevLeft),
                        getRaster(prevRight),
                        getRaster(currentLeft),
                        getRaster(currentRight),
                    ])
                    if (activeDocument !== store.document) return false
                    turnDirection = 'previous'
                    turnSource = cLeft
                    turnBack = pRight
                    turnTarget = pLeft
                    turnLeftStatic = pLeft
                    turnRightStatic = cRight
                }
            }

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
        if (!store.isTwoPageMode) {
            if (committed && turnTarget) {
                renderedPage = turnTarget.pageNumber
                store.goToPage(renderedPage)
                setStaticSpread(turnTarget)
                prefetchNeighbors(renderedPage)
            } else if (turnSource) {
                setStaticSpread(turnSource)
            }
        } else {
            if (committed) {
                const newLeft = turnDirection === 'next'
                    ? (turnBack?.pageNumber ?? store.currentPage + 2)
                    : (turnTarget?.pageNumber ?? Math.max(1, store.currentPage - 2))
                renderedPage = newLeft
                store.goToPage(renderedPage)
                const rightRaster = turnDirection === 'next' ? turnTarget : turnBack
                setStaticSpread(turnDirection === 'next' ? turnBack! : turnTarget!, rightRaster)
                prefetchNeighbors(renderedPage)
            } else {
                setStaticSpread(turnLeftStatic ?? getBlankRaster(), turnRightStatic)
            }
        }

        turnSource = null
        turnTarget = null
        turnBack = null
        turnLeftStatic = null
        turnRightStatic = null
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

        if (isAnimationDisabled.value) {
            setTurnProgress(1)
            settleTurn(true)
            return
        }

        const completed = await animateTo(1)
        settleTurn(completed)
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
        if (pendingDragFrame !== null) return
        pendingDragFrame = requestAnimationFrame(() => {
            pendingDragFrame = null
            if (isDragging && dragLast) setTurnProgress(pointerProgress(dragLast))
        })
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

        if (isAnimationDisabled.value) {
            setTurnProgress(shouldCommit ? 1 : 0)
            settleTurn(shouldCommit)
            return
        }

        const completed = await animateTo(shouldCommit ? 1 : 0)
        settleTurn(completed ? shouldCommit : false)
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
        if (!isAnimationDisabled.value) await animateTo(0)
        settleTurn(false)
    }

    function prefetchNeighbors(pageNumber: number) {
        if (!activeDocument) return
        const candidates = store.isTwoPageMode
            ? [pageNumber - 2, pageNumber - 1, pageNumber + 2, pageNumber + 3]
            : [pageNumber - 1, pageNumber + 1]

        for (const candidate of candidates) {
            if (candidate >= 1 && candidate <= store.totalPages) {
                void getRaster(candidate).catch(() => undefined)
            }
        }
    }

    async function displayPage(pageNumber: number) {
        if (!activeDocument || isTransitioning.value) return
        isPreparing.value = true
        try {
            if (store.isTwoPageMode) {
                const leftPageNum = pageNumber > 1 && pageNumber % 2 === 0 ? pageNumber - 1 : pageNumber
                const rightPageNum = leftPageNum + 1
                const [leftRaster, rightRaster] = await Promise.all([
                    getRaster(leftPageNum),
                    rightPageNum <= store.totalPages ? getRaster(rightPageNum) : Promise.resolve(getBlankRaster()),
                ])
                if (activeDocument !== store.document) return
                renderedPage = leftPageNum
                setStaticSpread(leftRaster, rightRaster)
                prefetchNeighbors(leftPageNum)
            } else {
                const raster = await getRaster(pageNumber)
                if (activeDocument !== store.document) return
                renderedPage = pageNumber
                setStaticSpread(raster)
                prefetchNeighbors(pageNumber)
            }
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
        if (blankRaster) {
            disposeRaster(blankRaster)
            blankRaster = null
        }
    }

    async function syncDocument(document: IBookDocument | null) {
        cancelAnimation()
        isTransitioning.value = false
        isDragging = false
        dragEndedWhilePreparing = false
        dragCancelledWhilePreparing = false
        turnSource = null
        turnTarget = null
        turnBack = null
        turnLeftStatic = null
        turnRightStatic = null
        activeDocument = document
        renderedPage = 0
        clearRasters()
        if (!document) return
        await displayPage(store.currentPage)
    }

    function destroyScene() {
        disposePageGeometry()
        leftStaticPage?.material.dispose()
        rightStaticPage?.material.dispose()
        spineShadow?.material.dispose()
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
        leftStaticPage = null
        rightStaticPage = null
        spineShadow = null
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

    watch(
        () => store.isTwoPageMode,
        () => {
            if (!isTransitioning.value && store.document) {
                lastGeometryAspectRatio = -1
                void displayPage(store.currentPage)
            }
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
