import { ref, onUnmounted, type Ref } from 'vue'
import * as THREE from 'three'

export type CurlMode = 'two-page-next' | 'two-page-prev' | 'single-page-next' | 'single-page-prev'

export interface Page3DDimensions {
  width: number
  height: number
  dpr?: number
}

const VERTEX_SHADER = `
  uniform float uProgress;
  uniform float uDirection;     // +1.0 for right-to-left (Next), -1.0 for left-to-right (Prev)
  uniform float uGripY;         // 0.0 (top) to 1.0 (bottom)
  uniform float uPointerDeltaY; // vertical pull offset
  uniform float uPageWidth;
  uniform float uPageHeight;
  uniform float uRadius;

  varying vec2 vUv;
  varying vec3 vNormalVec;
  varying float vCurlZ;
  varying float vDistToFold;

  const float PI = 3.14159265358979323846;

  void main() {
    vUv = uv;
    vec3 pos = position;

    // Normalização no espaço da página [0, width]
    float p = clamp(uProgress, 0.0, 1.0);
    
    if (p <= 0.0001) {
      vNormalVec = vec3(0.0, 0.0, 1.0);
      vCurlZ = 0.0;
      vDistToFold = 0.0;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      return;
    }

    // Ponto de desdobramento (fold origin) no eixo X
    float foldX = uPageWidth * (1.0 - p);
    
    // Inclinação da linha de dobra cônica (conical curl angle)
    float cornerBias = (uGripY - 0.5) * 0.75;
    float angle = cornerBias * sin(p * PI) + uPointerDeltaY * 0.6;
    angle = clamp(angle, -0.45, 0.45);

    // Ajuste do raio dinâmico de acordo com a posição Y (deformação cônica)
    float normY = (pos.y + (uPageHeight * 0.5)) / max(1.0, uPageHeight);
    float dynamicRadius = uRadius * (1.0 + (normY - uGripY) * cornerBias * 0.8);
    dynamicRadius = max(12.0, dynamicRadius);

    // Distância perpendicular ao eixo de rotação/dobra
    float relX = (uDirection > 0.0) ? (pos.x - foldX) : ((uPageWidth - pos.x) - foldX);
    float dist = relX + (pos.y * sin(angle));

    vec3 deformedPos = pos;
    vec3 computedNormal = vec3(0.0, 0.0, 1.0);

    float rollCircumference = PI * dynamicRadius;

    if (dist <= 0.0) {
      // Região ainda plana
      deformedPos.z = 0.0;
      computedNormal = vec3(0.0, 0.0, 1.0);
    } else if (dist < rollCircumference) {
      // Região da curva (rolo cilíndrico/cônico)
      float phi = dist / dynamicRadius;
      float sinPhi = sin(phi);
      float cosPhi = cos(phi);

      float deltaX = dynamicRadius * sinPhi;
      float deltaZ = dynamicRadius * (1.0 - cosPhi);

      if (uDirection > 0.0) {
        deformedPos.x = foldX - deltaX;
      } else {
        deformedPos.x = (uPageWidth - foldX) + deltaX;
      }
      
      deformedPos.z = deltaZ;
      computedNormal = normalize(vec3(-sinPhi * uDirection, 0.0, cosPhi));
    } else {
      // Região virada (verso plano)
      float flatOffset = dist - rollCircumference;
      if (uDirection > 0.0) {
        deformedPos.x = foldX - (flatOffset);
      } else {
        deformedPos.x = (uPageWidth - foldX) + (flatOffset);
      }
      deformedPos.z = dynamicRadius * 2.0;
      computedNormal = vec3(0.0, 0.0, -1.0);
    }

    vNormalVec = computedNormal;
    vCurlZ = deformedPos.z;
    vDistToFold = dist;

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
  varying float vDistToFold;

  void main() {
    vec3 lightDir = normalize(vec3(0.3, 0.4, 0.9));
    vec3 norm = normalize(vNormalVec);

    if (gl_FrontFacing) {
      vec4 frontTex = texture2D(uFrontTexture, vUv);
      
      // Translucidez sutil do verso na folha iluminada
      vec2 backUv = vec2(1.0 - vUv.x, vUv.y);
      vec4 backTex = texture2D(uBackTexture, backUv);
      vec3 paperBase = mix(frontTex.rgb, backTex.rgb, 0.04) * uPaperTint;

      // Iluminação difusa e brilho especular suave na crista
      float diff = max(0.0, dot(norm, lightDir));
      float spec = pow(diff, 12.0) * 0.12;

      // Sombra de contato e auto-oclusão
      float ambientShadow = clamp(vCurlZ * 0.003, 0.0, 0.28) * uShadowIntensity;

      vec3 finalRgb = (paperBase * (0.85 + 0.15 * diff) + vec3(spec)) * (1.0 - ambientShadow);
      gl_FragColor = vec4(finalRgb, frontTex.a);
    } else {
      // Face do Verso da Página
      vec2 backUv = vec2(1.0 - vUv.x, vUv.y);
      vec4 backTex = texture2D(uBackTexture, backUv);
      vec3 paperBase = backTex.rgb * uPaperTint;

      vec3 revNorm = -norm;
      float diff = max(0.0, dot(revNorm, lightDir));
      float spec = pow(diff, 12.0) * 0.10;

      float ambientShadow = clamp(vCurlZ * 0.002, 0.0, 0.22) * uShadowIntensity;

      vec3 finalRgb = (paperBase * (0.82 + 0.18 * diff) + vec3(spec)) * (1.0 - ambientShadow);
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
  let currentWidth = 600
  let currentHeight = 800

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
      ctx.fillText(text, 40, 60)
    }
    return canvas
  }

  function init(dimensions: Page3DDimensions) {
    const canvas = canvasHostRef.value
    if (!canvas) return

    currentWidth = dimensions.width
    currentHeight = dimensions.height
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    // Renderer com WebGL 2.0 e preservação de buffer
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    })
    renderer.setPixelRatio(dpr)
    renderer.setSize(currentWidth, currentHeight, false)
    renderer.toneMapping = THREE.NoToneMapping

    scene = new THREE.Scene()

    // Câmera ortográfica 1:1 pixel-perfect mapeando o canvas 2D para 3D
    camera = new THREE.OrthographicCamera(
      0,
      currentWidth,
      currentHeight * 0.5,
      -currentHeight * 0.5,
      -2000,
      2000,
    )
    camera.position.z = 800

    // Malha densa contínua (64x64) sem cortes
    geometry = new THREE.PlaneGeometry(currentWidth, currentHeight, 64, 64)
    // Desloca o pivô da geometria para a borda da lombada (X = 0)
    geometry.translate(currentWidth * 0.5, 0, 0)

    const defaultFront = createFallbackCanvas('')
    const defaultBack = createFallbackCanvas('')

    frontTexture = new THREE.CanvasTexture(defaultFront)
    frontTexture.generateMipmaps = true
    frontTexture.minFilter = THREE.LinearMipmapLinearFilter
    frontTexture.magFilter = THREE.LinearFilter

    backTexture = new THREE.CanvasTexture(defaultBack)
    backTexture.generateMipmaps = true
    backTexture.minFilter = THREE.LinearMipmapLinearFilter
    backTexture.magFilter = THREE.LinearFilter

    shaderMaterial = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      side: THREE.DoubleSide,
      transparent: true,
      uniforms: {
        uProgress: { value: 0.0 },
        uDirection: { value: 1.0 },
        uGripY: { value: 0.5 },
        uPointerDeltaY: { value: 0.0 },
        uPageWidth: { value: currentWidth },
        uPageHeight: { value: currentHeight },
        uRadius: { value: Math.max(30, currentWidth * 0.12) },
        uShadowIntensity: { value: 1.0 },
        uPaperTint: { value: new THREE.Vector3(1.0, 1.0, 1.0) },
        uFrontTexture: { value: frontTexture },
        uBackTexture: { value: backTexture },
      },
    })

    mesh = new THREE.Mesh(geometry, shaderMaterial)
    mesh.position.set(0, 0, 0)
    scene.add(mesh)

    isReady.value = true
    render()
  }

  function resize(dimensions: Page3DDimensions) {
    if (!renderer || !camera || !geometry || !shaderMaterial) return

    currentWidth = dimensions.width
    currentHeight = dimensions.height
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    renderer.setPixelRatio(dpr)
    renderer.setSize(currentWidth, currentHeight, false)

    camera.left = 0
    camera.right = currentWidth
    camera.top = currentHeight * 0.5
    camera.bottom = -currentHeight * 0.5
    camera.updateProjectionMatrix()

    geometry.dispose()
    geometry = new THREE.PlaneGeometry(currentWidth, currentHeight, 64, 64)
    geometry.translate(currentWidth * 0.5, 0, 0)

    if (mesh) {
      mesh.geometry = geometry
    }

    shaderMaterial.uniforms.uPageWidth.value = currentWidth
    shaderMaterial.uniforms.uPageHeight.value = currentHeight
    shaderMaterial.uniforms.uRadius.value = Math.max(30, currentWidth * 0.12)

    render()
  }

  function setTextures(frontCanvas: HTMLCanvasElement | null, backCanvas: HTMLCanvasElement | null) {
    if (!shaderMaterial) return

    if (frontCanvas && frontCanvas.width > 0 && frontCanvas.height > 0) {
      if (frontTexture) frontTexture.dispose()
      frontTexture = new THREE.CanvasTexture(frontCanvas)
      frontTexture.generateMipmaps = true
      frontTexture.minFilter = THREE.LinearMipmapLinearFilter
      frontTexture.magFilter = THREE.LinearFilter
      shaderMaterial.uniforms.uFrontTexture.value = frontTexture
    }

    if (backCanvas && backCanvas.width > 0 && backCanvas.height > 0) {
      if (backTexture) backTexture.dispose()
      backTexture = new THREE.CanvasTexture(backCanvas)
      backTexture.generateMipmaps = true
      backTexture.minFilter = THREE.LinearMipmapLinearFilter
      backTexture.magFilter = THREE.LinearFilter
      shaderMaterial.uniforms.uBackTexture.value = backTexture
    }
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
    init,
    resize,
    setTextures,
    updateUniforms,
    render,
    destroy,
  }
}
