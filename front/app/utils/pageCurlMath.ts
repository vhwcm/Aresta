import type { Point2D, CurlGeometry, IPageCurlState, PageCurlConfig, CurlDirection } from '~/interfaces/reader/IPageCurlState'

const DEFAULT_CONFIG: PageCurlConfig = {
  sensitivity: 1.0,
  minRadius: 20,
  maxRadius: 400,
  animationDurationMs: 400,
  shadowOpacity: 0.6,
  shadowWidth: 30,
  easing: easeInOutCubic,
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function distance(a: Point2D, b: Point2D): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2)
}

/**
 * Calcula o raio do cilindro de curvatura.
 *
 * Quando o usuário arrasta a página, a folha se dobra em torno de um cilindro
 * imaginário. O raio é inversamente proporcional ao quanto a página foi arrastada:
 *
 *   radius = (pageWidth * k) / dragDistance
 *
 * onde k controla a "rigidez" do papel (menor k = papel mais mole).
 * O raio é limitado entre minRadius e maxRadius para evitar artefatos visuais.
 */
function calculateCurlRadius(
  dragDistance: number,
  pageWidth: number,
  config: PageCurlConfig,
): number {
  if (dragDistance <= 0) return config.maxRadius
  const k = pageWidth * 0.4
  const raw = k / dragDistance
  return clamp(raw, config.minRadius, config.maxRadius)
}

/**
 * Calcula o ângulo da dobra em graus.
 *
 * O vetor de drag define a direção da dobra. O ângulo é calculado
 * a partir do vetor entre origem e ponto atual do drag.
 */
function calculateFoldAngle(origin: Point2D, current: Point2D): number {
  const dx = current.x - origin.x
  const dy = current.y - origin.y
  return Math.atan2(dy, dx)
}

/**
 * Ponto de dobra (fold point) na borda da página.
 *
 * Para um drag iniciado na borda direita da página, o fold point começa
 * no canto superior direito ou inferior direito, dependendo do drag vertical.
 * O ponto migra ao longo da borda conforme o drag.
 */
function calculateFoldPoint(
  dragOrigin: Point2D,
  dragCurrent: Point2D,
  pageWidth: number,
  pageHeight: number,
  direction: CurlDirection,
): Point2D {
  const edgeX = direction === 'right' ? pageWidth : 0

  const dy = dragCurrent.y - dragOrigin.y
  const foldY = clamp(dragOrigin.y + dy * 0.5, 0, pageHeight)

  return { x: edgeX, y: foldY }
}

/**
 * Gera a geometria completa do page curl.
 *
 * O algoritmo calcula:
 * 1. O ponto de dobra (fold point) na borda da página
 * 2. O raio do cilindro de curvatura
 * 3. Os pontos de controle da curva de Bezier que define o contorno da dobra
 * 4. Os pontos de gradiente da sombra
 *
 * A deformação cilíndrica mapeia pontos da página original para suas
 * posições na superfície do cilindro usando coordenadas angulares:
 *
 *   θ = arcsin((x - foldX) / radius)
 *   x' = foldX + radius * sin(θ)   (componente na direção do olhar)
 *   z' = radius * (1 - cos(θ))     (profundidade no canvas 2D → escala)
 *
 * A cônica surge porque θ varia com y: no centro da página o ângulo é
 * menor, nas extremidades é maior, criando o efeito de cone.
 */
export function computeCurlGeometry(
  dragOrigin: Point2D,
  dragCurrent: Point2D,
  pageWidth: number,
  pageHeight: number,
  direction: CurlDirection,
  config: PageCurlConfig = DEFAULT_CONFIG,
): CurlGeometry {
  const dragDist = distance(dragOrigin, dragCurrent)
  const radius = calculateCurlRadius(dragDist, pageWidth, config)
  const angle = calculateFoldAngle(dragOrigin, dragCurrent)
  const foldPoint = calculateFoldPoint(dragOrigin, dragCurrent, pageWidth, pageHeight, direction)

  const sign = direction === 'right' ? -1 : 1
  const perpAngle = angle + Math.PI / 2

  const cp1Offset = radius * 0.55
  const controlPoint1: Point2D = {
    x: foldPoint.x + sign * cp1Offset * Math.cos(perpAngle),
    y: foldPoint.y + cp1Offset * Math.sin(perpAngle),
  }
  const controlPoint2: Point2D = {
    x: foldPoint.x + sign * cp1Offset * Math.cos(perpAngle - Math.PI),
    y: foldPoint.y + cp1Offset * Math.sin(perpAngle - Math.PI),
  }

  const shadowDir = sign
  const shadowGradientStart: Point2D = {
    x: foldPoint.x + shadowDir * radius * 0.15,
    y: foldPoint.y,
  }
  const shadowGradientEnd: Point2D = {
    x: foldPoint.x - shadowDir * config.shadowWidth,
    y: foldPoint.y,
  }

  return {
    foldPoint,
    controlPoint1,
    controlPoint2,
    radius,
    angle,
    shadowGradientStart,
    shadowGradientEnd,
  }
}

/**
 * Renderiza o page curl em um canvas 2D.
 *
 * Processo de renderização:
 * 1. Limpa o canvas
 * 2. Desenha a página de destino (página que vai aparecer) abaixo
 * 3. Calcula o clip path da página atual usando a geometria do curl
 * 4. Renderiza a página atual com clip e deformação cilíndrica
 * 5. Renderiza o verso da página (gradiente + conteúdo espelhado)
 * 6. Renderiza a sombra da dobra
 */
export async function renderPageCurl(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  geometry: CurlGeometry,
  progress: number,
  direction: CurlDirection,
  renderCurrentPage: (ctx: CanvasRenderingContext2D) => Promise<void>,
  renderNextPage: (ctx: CanvasRenderingContext2D) => Promise<void>,
  config: PageCurlConfig = DEFAULT_CONFIG,
): Promise<void> {
  ctx.clearRect(0, 0, width, height)

  await renderNextPage(ctx)

  const { foldPoint, controlPoint1, controlPoint2, radius } = geometry

  ctx.save()
  ctx.beginPath()

  if (direction === 'right') {
    ctx.moveTo(0, 0)
    ctx.lineTo(foldPoint.x, 0)
    ctx.bezierCurveTo(
      controlPoint1.x, controlPoint1.y,
      controlPoint2.x, controlPoint2.y,
      foldPoint.x, height,
    )
    ctx.lineTo(0, height)
    ctx.closePath()
  } else {
    ctx.moveTo(width, 0)
    ctx.lineTo(foldPoint.x, 0)
    ctx.bezierCurveTo(
      controlPoint1.x, controlPoint1.y,
      controlPoint2.x, controlPoint2.y,
      foldPoint.x, height,
    )
    ctx.lineTo(width, height)
    ctx.closePath()
  }
  ctx.clip()

  await renderCurrentPage(ctx)
  ctx.restore()

  renderCurlShadow(ctx, geometry, height, direction, config)
  renderPageBack(ctx, geometry, height, direction, progress, config)
}

/**
 * Renderiza a sombra da dobra.
 * A sombra é um gradiente radial centrado no fold point com opacidade
 * inversamente proporcional ao raio (dobra mais apertada = sombra mais forte).
 */
function renderCurlShadow(
  ctx: CanvasRenderingContext2D,
  geometry: CurlGeometry,
  height: number,
  direction: CurlDirection,
  config: PageCurlConfig,
): void {
  const { foldPoint, shadowGradientStart, shadowGradientEnd, radius } = geometry
  const shadowStrength = clamp(1 - radius / config.maxRadius, 0.05, config.shadowOpacity)

  const gradient = ctx.createLinearGradient(
    shadowGradientStart.x, foldPoint.y,
    shadowGradientEnd.x, foldPoint.y,
  )
  gradient.addColorStop(0, `rgba(0,0,0,${shadowStrength})`)
  gradient.addColorStop(0.6, `rgba(0,0,0,${shadowStrength * 0.3})`)
  gradient.addColorStop(1, 'rgba(0,0,0,0)')

  ctx.save()
  ctx.fillStyle = gradient
  const shadowX = direction === 'right'
    ? shadowGradientEnd.x
    : 0
  const shadowW = direction === 'right'
    ? foldPoint.x - shadowGradientEnd.x
    : shadowGradientEnd.x
  ctx.fillRect(shadowX, 0, shadowW, height)
  ctx.restore()
}

/**
 * Renderiza o verso da página durante o curl.
 * O verso é uma faixa estreita com gradiente que simula a espessura do papel
 * e o reflexo da luz na superfície curvada.
 */
function renderPageBack(
  ctx: CanvasRenderingContext2D,
  geometry: CurlGeometry,
  height: number,
  direction: CurlDirection,
  progress: number,
  config: PageCurlConfig,
): void {
  const { foldPoint, radius } = geometry
  const backWidth = clamp(radius * 0.4, 2, 40)
  const sign = direction === 'right' ? 1 : -1

  const backX = foldPoint.x
  const backStartX = backX
  const backEndX = backX + sign * backWidth

  const gradient = ctx.createLinearGradient(backStartX, 0, backEndX, 0)
  gradient.addColorStop(0, 'rgba(255,255,255,0.08)')
  gradient.addColorStop(0.4, 'rgba(240,240,245,0.15)')
  gradient.addColorStop(1, 'rgba(200,200,220,0.03)')

  ctx.save()
  ctx.fillStyle = gradient
  const x = direction === 'right' ? foldPoint.x : foldPoint.x - backWidth
  ctx.fillRect(x, 0, backWidth, height)
  ctx.restore()
}

/**
 * Interpola o estado da animação de page curl.
 *
 * Quando o usuário solta a página (snap), a animação progride de `progress`
 * até 1.0 (virar) ou volta a 0.0 (cancelar) usando easing.
 */
export function interpolateCurlState(
  state: IPageCurlState,
  targetProgress: number,
  t: number,
  config: PageCurlConfig = DEFAULT_CONFIG,
): IPageCurlState {
  const easedT = config.easing(clamp(t, 0, 1))
  const progress = lerp(state.progress, targetProgress, easedT)

  return {
    ...state,
    progress,
    isAnimating: Math.abs(progress - targetProgress) > 0.001,
  }
}

export { DEFAULT_CONFIG, easeInOutCubic, lerp, clamp, distance }
