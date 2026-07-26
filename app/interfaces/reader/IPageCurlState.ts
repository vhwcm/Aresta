export interface Point2D {
  x: number
  y: number
}

export interface PageCurlVertex {
  x: number
  y: number
  u: number
  v: number
}

export type CurlDirection = 'left' | 'right'

export interface CurlGeometry {
  foldPoint: Point2D
  controlPoint1: Point2D
  controlPoint2: Point2D
  radius: number
  angle: number
  shadowGradientStart: Point2D
  shadowGradientEnd: Point2D
}

export interface IPageCurlState {
  isAnimating: boolean
  isDragging: boolean
  curlDirection: CurlDirection
  dragOrigin: Point2D | null
  dragCurrent: Point2D | null
  progress: number
  geometry: CurlGeometry | null
  targetPage: number
  currentPage: number
}

export interface PageCurlConfig {
  sensitivity: number
  minRadius: number
  maxRadius: number
  animationDurationMs: number
  shadowOpacity: number
  shadowWidth: number
  easing: (t: number) => number
}
