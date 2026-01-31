/**
 * Configuration constants for the visualizer page module
 */
export const CONFIG = {
  /** Filas por página por defecto */
  DEFAULT_ROWS_PER_PAGE: 50,

  /** Opciones disponibles de filas por página */
  ROWS_PER_PAGE_OPTIONS: [10, 25, 50] as const,

  /** Timeout para carga de archivos (ms) */
  FILE_LOAD_TIMEOUT_MS: 10000,

  /** Comportamiento de scroll después de paginación */
  SCROLL_BEHAVIOR: "smooth" as ScrollBehavior,
} as const;
