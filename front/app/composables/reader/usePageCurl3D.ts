import { ref, onUnmounted, type Ref } from 'vue'
import * as THREE from 'three'

export interface Page3DConfig {
  isTwoPage: boolean
  pageWidth: number
  pageHeight: number
  direction: 'next' | 'previous'
}

const VERTEX_SHADER = `
  uniform float uProgress;
  uniform float uDirection;     // +1.0 for Next (Right-to-Left), -1.0 for Previous (Left-to-Right)
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
    float dynamicRadius = max(4.0, uRadius * arcFactor);
    float rollCircumference = PI * dynamicRadius;

    // Inclinação cônica diagonal quando puxado pelo canto
    float cornerBias = (uGripY - 0.5) * 0.55;
    float angle = cornerBias * arcFactor + uPointerDeltaY * 0.35;
    angle = clamp(angle, -0.35, 0.35);

    vec3 deformedPos = pos;
    vec3 computedNormal = vec3(0.0, 0.0, 1.0);
    float facing = 1.0;

    if (uDirection > 0.0) {
      // NEXT: Folha direita [0, W] dobra em direção à esquerda [-W, 0] ao redor da lombada (x = 0)
      float foldX = uPageWidth * (1.0 - p);
      float dist = (pos.x - foldX) + (pos.y * sin(angle));

      if (dist <= 0.0) {
        // Região ainda plana na direita
        deformedPos.z = 0.0;
        computedNormal = vec3(0.0, 0.0, 1.0);
        facing = 1.0;
      } else if (dist < rollCircumference && dynamicRadius > 4.5) {
        // Na curva do cilindro/cone
        float phi = dist / dynamicRadius;
        float sinPhi = sin(phi);
        float cosPhi = cos(phi);

        deformedPos.x = foldX - (dist - dynamicRadius * sinPhi);
        deformedPos.z = dynamicRadius * (1.0 - cosPhi);
        computedNormal = normalize(vec3(-sinPhi, 0.0, cosPhi));
        facing = cosPhi >= 0.0 ? 1.0 : -1.0;
      } else {
        // Virada sobre a página esquerda (vai 100% até -W)
        deformedPos.x = 2.0 * foldX - pos.x;
        deformedPos.z = dynamicRadius * 2.0 * max(0.0, 1.0 - (dist / max(1.0, uPageWidth)));
        computedNormal = vec3(0.0, 0.0, -1.0);
        facing = -1.0;
      }
    } else {
      // PREVIOUS: Folha esquerda [-W, 0] dobra em direção à direita [0, W] ao redor da lombada (x = 0)
      float foldX = -uPageWidth * (1.0 - p);
      float dist = (foldX - pos.x) + (pos.y * sin(angle));

      if (dist <= 0.0) {
        // Região ainda plana na esquerda
        deformedPos.z = 0.0;
        computedNormal = vec3(0.0, 0.0, 1.0);
        facing = 1.0;
      } else if (dist < rollCircumference && dynamicRadius > 4.5) {
        // Na curva do cilindro/cone
        float phi = dist / dynamicRadius;
        float sinPhi = sin(phi);
        float cosPhi = cos(phi);

        deformedPos.x = foldX + (dist - dynamicRadius * sinPhi);
        deformedPos.z = dynamicRadius * (1.0 - cosPhi);
        computedNormal = normalize(vec3(sinPhi, 0.0, cosPhi));
        facing = cosPhi >= 0.0 ? 1.0 : -1.0;
      } else {
        // Virada sobre a página direita (vai 100% até +W)
        deformedPos.x = 2.0 * foldX - pos.x;
        deformedPos.z = dynamicRadius * 2.0 * max(0.0, 1.0 - (dist / max(1.0, uPageWidth)));
        computedNormal = vec3(0.0, 0.0, -1.0);
        facing = -1.0;
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
  uniform vec3 uPaperTint;

  varying vec2 vUv;
  varying vec3 vNormalVec;
  varying float vCurlZ;
  varying float vFacing;

  void main() {
    vec3 lightDir = normalize(vec3(0.2, 0.35, 0.92));
    vec3 norm = normalize(vNormalVec);

    if (gl_FrontFacing || vFacing > 0.0) {
      vec4 frontTex = texture2D(uFrontTexture, vUv);
      vec2 backUv = vec2(1.0 - vUv.x, vUv.y);
      vec4 backTex = texture2D(uBackTexture, backUv);

      vec3 paperBase = (frontTex.a > 0.05 ? frontTex.rgb : uPaperTint);
      if (backTex.a > 0.05) {
        paperBase = mix(paperBase, backTex.rgb, 0.035);
      }
      paperBase *= uPaperTint;

      float diff = max(0.0, dot(norm, lightDir));
      float spec = pow(diff, 14.0) * 0.10;
      float ambientShadow = clamp(vCurlZ * 0.003, 0.0, 0.25) * uShadowIntensity;

      vec3 finalRgb = (paperBase * (0.88 + 0.12 * diff) + vec3(spec)) * (1.0 - ambientShadow);
      gl_FragColor = vec4(finalRgb, 1.0);
    } else {
      vec2 backUv = vec2(1.0 - vUv.x, vUv.y);
      vec4 backTex = texture2D(uBackTexture, backUv);

      vec3 paperBase = (backTex.a > 0.05 ? backTex.rgb : uPaperTint) * uPaperTint;

      vec3 revNorm = -norm;
      float diff = max(0.0, dot(revNorm, lightDir));
      float spec = pow(diff, 14.0) * 0.08;
      float ambientShadow = clamp(vCurlZ * 0.002, 0.0, 0.20) * uShadowIntensity;

      vec3 finalRgb = (paperBase * (0.86 + 0.14 * diff) + vec3(spec)) * (1.0 - ambientShadow);
      gl_FragColor = vec4(finalRgb, 1.0);
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
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

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

    scene = new THREE.Scene()

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
    geometry = new THREE.PlaneGeometry(currentWidth, currentHeight, 64, 64)

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
          uGripY: { value: 0.5 },
          uPointerDeltaY: { value: 0.0 },
          uPageWidth: { value: currentWidth },
          uPageHeight: { value: currentHeight },
          uRadius: { value: Math.max(32, currentWidth * 0.14) },
          uShadowIntensity: { value: 1.0 },
          uPaperTint: { value: new THREE.Vector3(1.0, 1.0, 1.0) },
          uFrontTexture: { value: frontTexture },
          uBackTexture: { value: backTexture },
        },
      })
    } else {
      shaderMaterial.uniforms.uPageWidth.value = currentWidth
      shaderMaterial.uniforms.uPageHeight.value = currentHeight
      shaderMaterial.uniforms.uRadius.value = Math.max(32, currentWidth * 0.14)
      shaderMaterial.uniforms.uDirection.value = currentDirection === 'next' ? 1.0 : -1.0
      shaderMaterial.uniforms.uFrontTexture.value = frontTexture
      shaderMaterial.uniforms.uBackTexture.value = backTexture
    }

    mesh = new THREE.Mesh(geometry, shaderMaterial)
    mesh.position.set(0, 0, 0)
    scene.add(mesh)

    isReady.value = true
    render()
  }

  function setTextures(frontCanvas: HTMLCanvasElement | null, backCanvas: HTMLCanvasElement | null) {
    if (!shaderMaterial) return

    if (frontCanvas && frontCanvas.width > 0 && frontCanvas.height > 0) {
      if (frontTexture) frontTexture.dispose()
      frontTexture = new THREE.CanvasTexture(frontCanvas)
      frontTexture.minFilter = THREE.LinearFilter
      frontTexture.magFilter = THREE.LinearFilter
      frontTexture.generateMipmaps = false
      frontTexture.needsUpdate = true
      shaderMaterial.uniforms.uFrontTexture.value = frontTexture
    }

    if (backCanvas && backCanvas.width > 0 && backCanvas.height > 0) {
      if (backTexture) backTexture.dispose()
      backTexture = new THREE.CanvasTexture(backCanvas)
      backTexture.minFilter = THREE.LinearFilter
      backTexture.magFilter = THREE.LinearFilter
      backTexture.generateMipmaps = false
      backTexture.needsUpdate = true
      shaderMaterial.uniforms.uBackTexture.value = backTexture
    }

    render()
  }

  function updateUniforms(params: {
    progress: number
    direction: 'next' | 'previous'
    gripY?: number
    pointerDeltaY?: number
    theme?: 'sepia' | 'white' | 'black'
  }) {
    if (!shaderMaterial) return

    shaderMaterial.uniforms.uProgress.value = params.progress
    shaderMaterial.uniforms.uDirection.value = params.direction === 'next' ? 1.0 : -1.0

    if (typeof params.gripY === 'number') {
      shaderMaterial.uniforms.uGripY.value = params.gripY
    }
    if (typeof params.pointerDeltaY === 'number') {
      shaderMaterial.uniforms.uPointerDeltaY.value = params.pointerDeltaY
    }

    if (params.theme === 'sepia') {
      shaderMaterial.uniforms.uPaperTint.value.set(0.99, 0.96, 0.91)
    } else if (params.theme === 'black') {
      shaderMaterial.uniforms.uPaperTint.value.set(0.92, 0.92, 0.92)
    } else {
      shaderMaterial.uniforms.uPaperTint.value.set(1.0, 1.0, 1.0)
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
