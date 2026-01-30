import { CONFIG } from "../config.js";

/**
 * Row Animation Utilities
 *
 * Funciones para animar cambios en filas de la tabla (eliminación, etc).
 * Retorna promesas que se resuelven cuando la animación termina.
 *
 * Note: Respeta prefers-reduced-motion para accesibilidad.
 */

/**
 * Anima la eliminación de una fila agregando la clase CSS 'animate-delete-row'
 * y espera a que la animación termine.
 *
 * Respeta prefers-reduced-motion para usuarios con preferencias de accesibilidad.
 *
 * @param element - El elemento <tr> a animar
 * @returns Promesa que se resuelve cuando la animación termina
 *
 * @example
 * const row = document.querySelector('[data-file-id="123"]');
 * if (row) {
 *   await animateRowDelete(row as HTMLElement);
 *   row.remove();
 * }
 */
export async function animateRowDelete(element: HTMLElement): Promise<void> {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (prefersReducedMotion) {
    // Sin animación para usuarios con preferencias de accesibilidad
    return Promise.resolve();
  }

  // Aplicar clase de animación
  element.classList.add("animate-delete-row");

  // Esperar a que la animación termine
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, CONFIG.ANIMATION_DURATION_MS);
  });
}

/**
 * Anima la aparición de múltiples filas con un efecto escalonado.
 *
 * Respeta prefers-reduced-motion para usuarios con preferencias de accesibilidad.
 *
 * @param elements - Lista de elementos a animar
 * @param delayMs - Retraso entre cada elemento (ms)
 * @returns Promesa que se resuelve cuando todas las animaciones terminan
 */
export async function animateRowsAppear(
  elements: HTMLElement[],
  delayMs: number = 50
): Promise<void> {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (prefersReducedMotion) {
    // Sin animación para usuarios con preferencias de accesibilidad
    return Promise.resolve();
  }

  return Promise.all(
    elements.map(
      (el, index) =>
        new Promise((resolve) => {
          setTimeout(() => {
            el.classList.add("animate-fade-in");
            resolve(undefined);
          }, index * delayMs);
        })
    )
  ).then(() => {});
}
