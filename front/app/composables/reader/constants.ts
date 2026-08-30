/**
 * Constantes centralizadas do motor de virada de página.
 * Evita valores mágicos duplicados entre composables.
 */

/** Percentual mínimo de arraste horizontal para confirmar a virada (0–1) */
export const SNAP_THRESHOLD = 0.32

/** Velocidade mínima de flick para confirmar virada (px/ms normalizado) */
export const FLICK_VELOCITY_THRESHOLD = 0.45

/** Rigidez da mola de Hooke para animação de snap */
export const SPRING_STIFFNESS = 180

/** Amortecimento da mola de Hooke para animação de snap */
export const SPRING_DAMPING = 22

/** Duração padrão da animação de virada por clique/teclado (ms) */
export const TURN_DURATION_MS = 380

/** Deslocamento mínimo em pixels antes de ativar o arraste de virada de página (vs seleção de texto) */
export const DRAG_ACTIVATION_THRESHOLD_PX = 10
