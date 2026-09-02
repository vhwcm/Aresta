import { ref, onUnmounted, type Ref } from 'vue'
import * as THREE from 'three'

export interface Page3DConfig {
  isTwoPage: boolean
  pageWidth: number
  pageHeight: number
  direction: 'next' | 'previous'
}

export interface VertexPoint {
  x: number
  y: number
  z: number
}

export interface MatrixSampleResult {
  pos: VertexPoint
  normal: VertexPoint
  facing: number // +1.0 = frente (uFrontTexture), -1.0 = verso (uBackTexture)
  sampledTexture: 'front' | 'back'
  uvFront: { u: number; v: number }
  uvBack: { u: number; v: number }
}

/**
 * Avaliação analítica determinística da matriz de vértices 3D,
 * replicando com precisão matemática o cálculo do VERTEX_SHADER.
 */
export function evaluate3DPagePoint(
  x: number,
  y: number,
  pageWidth: number,
  pageHeight: number,
  progress: number,
  direction: 'next' | 'previous' = 'next',
  isTwoPage = true,
  gripY = 0.5,
  deltaY = 0,
): MatrixSampleResult {
  const PI = Math.PI
  const p = Math.max(0, Math.min(1, progress))

  const uvFront = {
    u: (x - (isTwoPage ? (direction === 'next' ? 0 : -pageWidth) : 0)) / pageWidth,
    v: 1.0 - (y + pageHeight / 2) / pageHeight,
  }
  const uvBack = {
    u: 1.0 - uvFront.u,
    v: uvFront.v,
  }

  if (p <= 0.0001) {
    return {
      pos: { x, y, z: 0 },
      normal: { x: 0, y: 0, z: 1 },
      facing: 1.0,
      sampledTexture: 'front',
      uvFront,
      uvBack,
    }
  }

  const uRadius = Math.max(32, pageWidth * 0.14)
  const arcFactor = Math.sin(p * PI)
  const dynamicRadius = Math.max(0.0, uRadius * arcFactor)
  const rollCircumference = Math.max(1.0, PI * dynamicRadius)

  const cornerBias = (0.5 - gripY) * 0.45
  let angle = cornerBias * arcFactor - deltaY * 0.25
  angle = Math.max(-0.30, Math.min(0.30, angle))

  let deformedPos = { x, y, z: 0 }
  let computedNormal = { x: 0, y: 0, z: 1 }
  let facing = 1.0

  if (isTwoPage) {
    if (direction === 'next') {
      const foldX = pageWidth * (1.0 - p)
      const dist = (x - foldX) + (y * Math.sin(angle))

      if (dist <= 0.0) {
        deformedPos = { x, y, z: 0 }
        computedNormal = { x: 0, y: 0, z: 1 }
        facing = 1.0
      } else {
        const rotX = 2.0 * foldX - x - y * Math.sin(angle)
        const rotY = y - (x - foldX) * Math.sin(2.0 * angle)

        if (dist < rollCircumference && dynamicRadius > 1.0) {
          const t = Math.max(0, Math.min(1, dist / rollCircumference))
          deformedPos = {
            x: rotX,
            y: rotY,
            z: dynamicRadius * Math.sin(t * PI),
          }
          computedNormal = {
            x: Math.sin(t * PI),
            y: 0,
            z: Math.cos(t * PI),
          }
          facing = t <= 0.5 ? 1.0 : -1.0
        } else {
          deformedPos = {
            x: rotX,
            y: rotY,
            z: 0.0,
          }
          computedNormal = { x: 0, y: 0, z: -1 }
          facing = -1.0
        }
      }
    } else {
      // PREVIOUS (Two-Page)
      const foldX = -pageWidth * (1.0 - p)
      const dist = (foldX - x) + (y * Math.sin(angle))

      if (dist <= 0.0) {
        deformedPos = { x, y, z: 0 }
        computedNormal = { x: 0, y: 0, z: 1 }
        facing = 1.0
      } else {
        const rotX = 2.0 * foldX - x + y * Math.sin(angle)
        const rotY = y - (foldX - x) * Math.sin(2.0 * angle)

        if (dist < rollCircumference && dynamicRadius > 1.0) {
          const t = Math.max(0, Math.min(1, dist / rollCircumference))
          deformedPos = {
            x: rotX,
            y: rotY,
            z: dynamicRadius * Math.sin(t * PI),
          }
          computedNormal = {
            x: -Math.sin(t * PI),
            y: 0,
            z: Math.cos(t * PI),
          }
          facing = t <= 0.5 ? 1.0 : -1.0
        } else {
          deformedPos = {
            x: rotX,
            y: rotY,
            z: 0.0,
          }
          computedNormal = { x: 0, y: 0, z: -1 }
          facing = -1.0
        }
      }
    }
  } else {
    // SINGLE-PAGE MODE
    if (direction === 'next') {
      const foldX = pageWidth * (1.0 - p)
      const dist = (x - foldX) + (y * Math.sin(angle))

      if (dist <= 0.0) {
        deformedPos = { x, y, z: 0 }
        computedNormal = { x: 0, y: 0, z: 1 }
        facing = 1.0
      } else {
        const rotX = 2.0 * foldX - x - y * Math.sin(angle)
        const rotY = y - (x - foldX) * Math.sin(2.0 * angle)

        if (dist < rollCircumference && dynamicRadius > 1.0) {
          const t = Math.max(0, Math.min(1, dist / rollCircumference))
          deformedPos = {
            x: rotX,
            y: rotY,
            z: dynamicRadius * Math.sin(t * PI),
          }
          computedNormal = {
            x: Math.sin(t * PI),
            y: 0,
            z: Math.cos(t * PI),
          }
          facing = t <= 0.5 ? 1.0 : -1.0
        } else {
          deformedPos = {
            x: rotX,
            y: rotY,
            z: Math.max(0.0, (1.0 - p) * 12.0),
          }
          computedNormal = { x: 0, y: 0, z: -1 }
          facing = -1.0
        }
      }
    } else {
      // PREVIOUS (Single-Page)
      const foldX = pageWidth * p
      const dist = (foldX - x) + (y * Math.sin(angle))

      if (dist <= 0.0) {
        deformedPos = { x, y, z: 0 }
        computedNormal = { x: 0, y: 0, z: 1 }
        facing = 1.0
      } else {
        const rotX = 2.0 * foldX - x + y * Math.sin(angle)
        const rotY = y - (foldX - x) * Math.sin(2.0 * angle)

        if (dist < rollCircumference && dynamicRadius > 1.0) {
          const t = Math.max(0, Math.min(1, dist / rollCircumference))
          deformedPos = {
            x: rotX,
            y: rotY,
            z: dynamicRadius * Math.sin(t * PI),
          }
          computedNormal = {
            x: -Math.sin(t * PI),
            y: 0,
            z: Math.cos(t * PI),
          }
          facing = t <= 0.5 ? 1.0 : -1.0
        } else {
          deformedPos = {
            x: rotX,
            y: rotY,
            z: Math.max(0.0, (1.0 - p) * 12.0),
          }
          computedNormal = { x: 0, y: 0, z: -1 }
          facing = -1.0
        }
      }
    }
  }

  return {
    pos: deformedPos,
    normal: computedNormal,
    facing,
    sampledTexture: facing > 0 ? 'front' : 'back',
    uvFront,
    uvBack,
  }
}

const VERTEX_SHADER = `
  uniform float uProgress;
  uniform float uDirection;     // +1.0 for Next (Right-to-Left), -1.0 for Previous (Left-to-Right)
  uniform float uIsTwoPage;     // 1.0 for Two-Page mode, 0.0 for Single-Page mode
  uniform float uGripY;         // 0.0 (top) to 1.0 (bottom)
  uniform float uPointerDeltaY; // vertical displacement
  uniform float uPageWidth;
  uniform float uPageHeight;
  uniform float uRadius;

  varying vec2 vUv;
  varying vec3 vNormalVec;
  varying float vCurlZ;
  varying float vFacing;

  const float PI = 3.14159265358979323846;

  void main() {
    vUv = uv;
    vec3 pos = position;
    float p = clamp(uProgress, 0.0, 1.0);

    if (p <= 0.0001) {
      vNormalVec = vec3(0.0, 0.0, 1.0);
      vCurlZ = 0.0;
      vFacing = 1.0;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      return;
    }

    // Raio dinâmico que atinge o ápice no meio (p = 0.5) e zera suavemente nas pontas (p=0 e p=1)
    float arcFactor = sin(p * PI);
    float dynamicRadius = max(0.0, uRadius * arcFactor);
    float rollCircumference = max(1.0, PI * dynamicRadius);

    // Inclinação cônica diagonal quando puxado pelo canto
    float cornerBias = (0.5 - uGripY) * 0.45;
    float angle = cornerBias * arcFactor - uPointerDeltaY * 0.25;
    angle = clamp(angle, -0.30, 0.30);

    vec3 deformedPos = pos;
    vec3 computedNormal = vec3(0.0, 0.0, 1.0);
    float facing = 1.0;

    if (uIsTwoPage > 0.5) {
      if (uDirection > 0.0) {
        // NEXT (Two-Page): Folha direita [0, W] dobra em direção à esquerda [-W, 0] ao redor da lombada (x = 0)
        float foldX = uPageWidth * (1.0 - p);
        float dist = (pos.x - foldX) + (pos.y * sin(angle));

        if (dist <= 0.0) {
          // Região ainda plana na direita
          deformedPos.z = 0.0;
          computedNormal = vec3(0.0, 0.0, 1.0);
          facing = 1.0;
        } else {
          float rotX = 2.0 * foldX - pos.x - pos.y * sin(angle);
          float rotY = pos.y - (pos.x - foldX) * sin(2.0 * angle);

          if (dist < rollCircumference && dynamicRadius > 1.0) {
            float t = clamp(dist / rollCircumference, 0.0, 1.0);
            deformedPos.x = rotX;
            deformedPos.y = rotY;
            deformedPos.z = dynamicRadius * sin(t * PI);
            computedNormal = normalize(vec3(sin(t * PI), 0.0, cos(t * PI)));
            facing = t <= 0.5 ? 1.0 : -1.0;
          } else {
            deformedPos.x = rotX;
            deformedPos.y = rotY;
            deformedPos.z = 0.0;
            computedNormal = vec3(0.0, 0.0, -1.0);
            facing = -1.0;
          }
        }
      } else {
        // PREVIOUS (Two-Page): Folha esquerda [-W, 0] dobra em direção à direita [0, W] ao redor da lombada (x = 0)
        float foldX = -uPageWidth * (1.0 - p);
        float dist = (foldX - pos.x) + (pos.y * sin(angle));

        if (dist <= 0.0) {
          // Região ainda plana na esquerda
          deformedPos.z = 0.0;
          computedNormal = vec3(0.0, 0.0, 1.0);
          facing = 1.0;
        } else {
          float rotX = 2.0 * foldX - pos.x + pos.y * sin(angle);
          float rotY = pos.y - (foldX - pos.x) * sin(2.0 * angle);

          if (dist < rollCircumference && dynamicRadius > 1.0) {
            float t = clamp(dist / rollCircumference, 0.0, 1.0);
            deformedPos.x = rotX;
            deformedPos.y = rotY;
            deformedPos.z = dynamicRadius * sin(t * PI);
            computedNormal = normalize(vec3(-sin(t * PI), 0.0, cos(t * PI)));
            facing = t <= 0.5 ? 1.0 : -1.0;
          } else {
            deformedPos.x = rotX;
            deformedPos.y = rotY;
            deformedPos.z = 0.0;
            computedNormal = vec3(0.0, 0.0, -1.0);
            facing = -1.0;
          }
        }
      }
    } else {
      // SINGLE-PAGE MODE: Folha reside em [0, W]
      if (uDirection > 0.0) {
        // NEXT (Single-Page): Folha [0, W] dobra da direita em direção à esquerda
        float foldX = uPageWidth * (1.0 - p);
        float dist = (pos.x - foldX) + (pos.y * sin(angle));

        if (dist <= 0.0) {
          deformedPos.z = 0.0;
          computedNormal = vec3(0.0, 0.0, 1.0);
          facing = 1.0;
        } else {
          float rotX = 2.0 * foldX - pos.x - pos.y * sin(angle);
          float rotY = pos.y - (pos.x - foldX) * sin(2.0 * angle);

          if (dist < rollCircumference && dynamicRadius > 1.0) {
            float t = clamp(dist / rollCircumference, 0.0, 1.0);
            deformedPos.x = rotX;
            deformedPos.y = rotY;
            deformedPos.z = dynamicRadius * sin(t * PI);
            computedNormal = normalize(vec3(sin(t * PI), 0.0, cos(t * PI)));
            facing = t <= 0.5 ? 1.0 : -1.0;
          } else {
            deformedPos.x = rotX;
            deformedPos.y = rotY;
            deformedPos.z = max(0.0, (1.0 - p) * 12.0);
            computedNormal = vec3(0.0, 0.0, -1.0);
            facing = -1.0;
          }
        }
      } else {
        // PREVIOUS (Single-Page): Folha [0, W] dobra da esquerda em direção à direita
        float foldX = uPageWidth * p;
        float dist = (foldX - pos.x) + (pos.y * sin(angle));

        if (dist <= 0.0) {
          deformedPos.z = 0.0;
          computedNormal = vec3(0.0, 0.0, 1.0);
          facing = 1.0;
        } else {
          float rotX = 2.0 * foldX - pos.x + pos.y * sin(angle);
          float rotY = pos.y - (foldX - pos.x) * sin(2.0 * angle);

          if (dist < rollCircumference && dynamicRadius > 1.0) {
            float t = clamp(dist / rollCircumference, 0.0, 1.0);
            deformedPos.x = rotX;
            deformedPos.y = rotY;
            deformedPos.z = dynamicRadius * sin(t * PI);
            computedNormal = normalize(vec3(-sin(t * PI), 0.0, cos(t * PI)));
            facing = t <= 0.5 ? 1.0 : -1.0;
          } else {
            deformedPos.x = rotX;
            deformedPos.y = rotY;
            deformedPos.z = max(0.0, (1.0 - p) * 12.0);
            computedNormal = vec3(0.0, 0.0, -1.0);
            facing = -1.0;
          }
        }
      }
    }

    vNormalVec = computedNormal;
    vCurlZ = deformedPos.z;
    vFacing = facing;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(deformedPos, 1.0);
  }
`

const FRAGMENT_SHADER = `
  uniform sampler2D uFrontTexture;
  uniform sampler2D uBackTexture;
  uniform float uShadowIntensity;

  varying vec2 vUv;
  varying vec3 vNormalVec;
  varying float vCurlZ;
  varying float vFacing;

  void main() {
    vec3 lightDir = normalize(vec3(0.15, 0.25, 0.95));
    vec3 norm = normalize(vNormalVec);

    if (vFacing > 0.0) {
      vec4 frontTex = texture2D(uFrontTexture, vUv);
      vec3 paperBase = frontTex.rgb;

      // Iluminação e sombreamento 3D apenas na curvatura
      float diff = max(0.0, dot(norm, lightDir));
      float curveFactor = clamp(vCurlZ / 25.0, 0.0, 1.0);
      float lightFactor = mix(1.0, 0.85 + 0.15 * diff, curveFactor);
      float ambientShadow = clamp(vCurlZ * 0.0015, 0.0, 0.12) * uShadowIntensity;

      vec3 finalRgb = paperBase * lightFactor * (1.0 - ambientShadow);
      gl_FragColor = vec4(finalRgb, frontTex.a);
    } else {
      vec2 backUv = vec2(1.0 - vUv.x, vUv.y);
      vec4 backTex = texture2D(uBackTexture, backUv);
      vec3 paperBase = backTex.rgb;

      vec3 revNorm = -norm;
      float diff = max(0.0, dot(revNorm, lightDir));
      float curveFactor = clamp(vCurlZ / 25.0, 0.0, 1.0);
      float lightFactor = mix(1.0, 0.85 + 0.15 * diff, curveFactor);
      float ambientShadow = clamp(vCurlZ * 0.0015, 0.0, 0.12) * uShadowIntensity;

      vec3 finalRgb = paperBase * lightFactor * (1.0 - ambientShadow);
      gl_FragColor = vec4(finalRgb, backTex.a);
    }
  }
`

export function usePageCurl3D(canvasHostRef: Ref<HTMLCanvasElement | null>) {
  let renderer: THREE.WebGLRenderer | null = null
  let scene: THREE.Scene | null = null
  let camera: THREE.OrthographicCamera | null = null
  let mesh: THREE.Mesh | null = null
  let geometry: THREE.PlaneGeometry | null = null
  let shaderMaterial: THREE.ShaderMaterial | null = null

  let frontTexture: THREE.CanvasTexture | null = null
  let backTexture: THREE.CanvasTexture | null = null

  const isReady = ref(false)
  let currentWidth = 400
  let currentHeight = 600
  let isTwoPageMode = true
  let currentDirection: 'next' | 'previous' = 'next'

  function createFallbackCanvas(text: string, bgColor = '#f5eedc', textColor = '#333333'): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 724
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = textColor
      ctx.font = '20px sans-serif'
      if (text) {
        ctx.fillText(text, 40, 60)
      }
    }
    return canvas
  }

  function setupScene(config: Page3DConfig) {
    const canvas = canvasHostRef.value
    if (!canvas) return

    currentWidth = config.pageWidth
    currentHeight = config.pageHeight
    isTwoPageMode = config.isTwoPage
    currentDirection = config.direction

    const totalCanvasWidth = isTwoPageMode ? currentWidth * 2 : currentWidth
    const totalCanvasHeight = currentHeight
    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1

    if (!renderer) {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false,
      })
    }

    renderer.setPixelRatio(dpr)
    renderer.setSize(totalCanvasWidth, totalCanvasHeight, false)
    renderer.toneMapping = THREE.NoToneMapping

    if (!scene) {
      scene = new THREE.Scene()
    }

    if (mesh) {
      scene.remove(mesh)
      mesh = null
    }

    if (isTwoPageMode) {
      camera = new THREE.OrthographicCamera(
        -currentWidth,
        currentWidth,
        currentHeight * 0.5,
        -currentHeight * 0.5,
        -2000,
        2000,
      )
    } else {
      camera = new THREE.OrthographicCamera(
        0,
        currentWidth,
        currentHeight * 0.5,
        -currentHeight * 0.5,
        -2000,
        2000,
      )
    }
    camera.position.z = 800

    if (geometry) geometry.dispose()
    geometry = new THREE.PlaneGeometry(currentWidth, currentHeight, 48, 48)

    if (isTwoPageMode) {
      if (currentDirection === 'next') {
        geometry.translate(currentWidth * 0.5, 0, 0)
      } else {
        geometry.translate(-currentWidth * 0.5, 0, 0)
      }
    } else {
      geometry.translate(currentWidth * 0.5, 0, 0)
    }

    if (!frontTexture) {
      frontTexture = new THREE.CanvasTexture(createFallbackCanvas(''))
      frontTexture.minFilter = THREE.LinearFilter
      frontTexture.magFilter = THREE.LinearFilter
      frontTexture.generateMipmaps = false
    }

    if (!backTexture) {
      backTexture = new THREE.CanvasTexture(createFallbackCanvas(''))
      backTexture.minFilter = THREE.LinearFilter
      backTexture.magFilter = THREE.LinearFilter
      backTexture.generateMipmaps = false
    }

    if (!shaderMaterial) {
      shaderMaterial = new THREE.ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        side: THREE.DoubleSide,
        transparent: false,
        depthTest: true,
        depthWrite: true,
        uniforms: {
          uProgress: { value: 0.0 },
          uDirection: { value: currentDirection === 'next' ? 1.0 : -1.0 },
          uIsTwoPage: { value: isTwoPageMode ? 1.0 : 0.0 },
          uGripY: { value: 0.5 },
          uPointerDeltaY: { value: 0.0 },
          uPageWidth: { value: currentWidth },
          uPageHeight: { value: currentHeight },
          uRadius: { value: Math.max(32, currentWidth * 0.14) },
          uShadowIntensity: { value: 1.0 },
          uFrontTexture: { value: frontTexture },
          uBackTexture: { value: backTexture },
        },
      })
    } else {
      const u = shaderMaterial.uniforms as any
      u.uPageWidth.value = currentWidth
      u.uPageHeight.value = currentHeight
      u.uRadius.value = Math.max(32, currentWidth * 0.14)
      u.uDirection.value = currentDirection === 'next' ? 1.0 : -1.0
      u.uIsTwoPage.value = isTwoPageMode ? 1.0 : 0.0
      u.uFrontTexture.value = frontTexture
      u.uBackTexture.value = backTexture
    }

    mesh = new THREE.Mesh(geometry, shaderMaterial)
    mesh.position.set(0, 0, 0)
    scene.add(mesh)

    isReady.value = true
    render()
  }

  function setTextures(frontCanvas: HTMLCanvasElement | null, backCanvas: HTMLCanvasElement | null) {
    if (!shaderMaterial) return
    const u = shaderMaterial.uniforms as any

    if (frontCanvas && frontCanvas.width > 0 && frontCanvas.height > 0) {
      if (!frontTexture) {
        frontTexture = new THREE.CanvasTexture(frontCanvas)
        frontTexture.minFilter = THREE.LinearFilter
        frontTexture.magFilter = THREE.LinearFilter
        frontTexture.generateMipmaps = false
        u.uFrontTexture.value = frontTexture
      } else {
        frontTexture.image = frontCanvas
        frontTexture.needsUpdate = true
      }
    }

    if (backCanvas && backCanvas.width > 0 && backCanvas.height > 0) {
      if (!backTexture) {
        backTexture = new THREE.CanvasTexture(backCanvas)
        backTexture.minFilter = THREE.LinearFilter
        backTexture.magFilter = THREE.LinearFilter
        backTexture.generateMipmaps = false
        u.uBackTexture.value = backTexture
      } else {
        backTexture.image = backCanvas
        backTexture.needsUpdate = true
      }
    }

    render()
  }

  function updateUniforms(params: {
    progress: number
    direction: 'next' | 'previous'
    isTwoPage?: boolean
    gripY?: number
    pointerDeltaY?: number
    theme?: 'sepia' | 'white' | 'black'
  }) {
    if (!shaderMaterial) return
    const u = shaderMaterial.uniforms as any

    u.uProgress.value = params.progress
    u.uDirection.value = params.direction === 'next' ? 1.0 : -1.0

    if (typeof params.isTwoPage === 'boolean') {
      u.uIsTwoPage.value = params.isTwoPage ? 1.0 : 0.0
    }
    if (typeof params.gripY === 'number') {
      u.uGripY.value = params.gripY
    }
    if (typeof params.pointerDeltaY === 'number') {
      u.uPointerDeltaY.value = params.pointerDeltaY
    }
  }

  function render() {
    if (renderer && scene && camera) {
      renderer.render(scene, camera)
    }
  }

  function destroy() {
    if (frontTexture) {
      frontTexture.dispose()
      frontTexture = null
    }
    if (backTexture) {
      backTexture.dispose()
      backTexture = null
    }
    if (geometry) {
      geometry.dispose()
      geometry = null
    }
    if (shaderMaterial) {
      shaderMaterial.dispose()
      shaderMaterial = null
    }
    if (renderer) {
      renderer.dispose()
      renderer.forceContextLoss()
      renderer = null
    }
    scene = null
    camera = null
    mesh = null
    isReady.value = false
  }

  onUnmounted(() => {
    destroy()
  })

  return {
    isReady,
    setupScene,
    setTextures,
    updateUniforms,
    render,
    destroy,
  }
}
