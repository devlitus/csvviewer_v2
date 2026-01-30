/**
 * Configuration constants for the files page module
 */
export const CONFIG = {
  /** Número de archivos por página */
  ITEMS_PER_PAGE: 6,

  /** Duración de animación de eliminación (ms) */
  ANIMATION_DURATION_MS: 300,

  /** Timeout de confirmación inline de delete (ms) */
  DELETE_CONFIRM_TIMEOUT_MS: 3000,
} as const;
