/**
 * Event Manager para paginación
 *
 * Implementa event delegation para:
 * - Clicks en números de página
 * - Clicks en botón "Anterior"
 * - Clicks en botón "Siguiente"
 *
 * Patrón: Delegación en contenedor de paginación
 */

import { PAGINATION_SELECTOR } from "../utils/domSelectors.js";

export class PaginationEventManager {
  private paginationContainer: HTMLElement | null;
  private domListeners: Map<string, EventListener> = new Map();
  private callbackSets: Map<string, Set<Function>> = new Map();

  constructor(paginationSelector: string = PAGINATION_SELECTOR) {
    this.paginationContainer = document.querySelector(paginationSelector);
    this.setupDelegation();
  }

  /**
   * Configura listeners de delegación en el contenedor
   * Se ejecuta una sola vez en el constructor
   */
  private setupDelegation(): void {
    if (!this.paginationContainer) return;

    // Unified click handler for all pagination elements
    const clickHandler: EventListener = (e: Event) => {
      const event = e as MouseEvent;
      const target = event.target as HTMLElement;

      // Check for prev button
      const prevBtn = target.closest("[data-prev-button]");
      if (prevBtn) {
        this.notifyPrevClick();
        return;
      }

      // Check for next button
      const nextBtn = target.closest("[data-next-button]");
      if (nextBtn) {
        this.notifyNextClick();
        return;
      }

      // Check for page number button
      const pageButton = target.closest("[data-page-numbers] button");
      if (pageButton) {
        const pageText = pageButton.textContent?.trim();
        if (pageText && /^\d+$/.test(pageText)) {
          const pageNumber = parseInt(pageText, 10);
          // Validate page number is within valid range (>= 1)
          if (pageNumber >= 1) {
            this.notifyPageNumberClick(pageNumber);
          }
        }
        return;
      }
    };

    // Guardar referencia para poder remover después
    this.domListeners.set("click", clickHandler);

    // Registrar un único listener para clicks en el contenedor de paginación
    this.paginationContainer.addEventListener("click", clickHandler);
  }

  /**
   * Suscribirse a clicks en números de página
   * Retorna función unsubscribe
   */
  onPageNumberClick(callback: (pageNumber: number) => void): () => void {
    if (!this.callbackSets.has("pageNumberClickCallbacks")) {
      this.callbackSets.set("pageNumberClickCallbacks", new Set());
    }

    const callbacks = this.callbackSets.get("pageNumberClickCallbacks")!;
    callbacks.add(callback);

    // Retornar función unsubscribe
    return () => {
      callbacks.delete(callback);
    };
  }

  /**
   * Suscribirse a clicks en botón "Anterior"
   * Retorna función unsubscribe
   */
  onPrevClick(callback: () => void): () => void {
    if (!this.callbackSets.has("prevClickCallbacks")) {
      this.callbackSets.set("prevClickCallbacks", new Set());
    }

    const callbacks = this.callbackSets.get("prevClickCallbacks")!;
    callbacks.add(callback);

    // Retornar función unsubscribe
    return () => {
      callbacks.delete(callback);
    };
  }

  /**
   * Suscribirse a clicks en botón "Siguiente"
   * Retorna función unsubscribe
   */
  onNextClick(callback: () => void): () => void {
    if (!this.callbackSets.has("nextClickCallbacks")) {
      this.callbackSets.set("nextClickCallbacks", new Set());
    }

    const callbacks = this.callbackSets.get("nextClickCallbacks")!;
    callbacks.add(callback);

    // Retornar función unsubscribe
    return () => {
      callbacks.delete(callback);
    };
  }

  /**
   * Notifica a todos los suscriptores de page number click
   */
  private notifyPageNumberClick(pageNumber: number): void {
    const callbacks = this.callbackSets.get("pageNumberClickCallbacks");
    if (callbacks) {
      callbacks.forEach((cb) => {
        (cb as (pageNumber: number) => void)(pageNumber);
      });
    }
  }

  /**
   * Notifica a todos los suscriptores de prev click
   */
  private notifyPrevClick(): void {
    const callbacks = this.callbackSets.get("prevClickCallbacks");
    if (callbacks) {
      callbacks.forEach((cb) => {
        (cb as () => void)();
      });
    }
  }

  /**
   * Notifica a todos los suscriptores de next click
   */
  private notifyNextClick(): void {
    const callbacks = this.callbackSets.get("nextClickCallbacks");
    if (callbacks) {
      callbacks.forEach((cb) => {
        (cb as () => void)();
      });
    }
  }

  /**
   * Limpia todos los listeners
   * Llamado en View Transitions
   */
  cleanup(): void {
    if (!this.paginationContainer) return;

    const clickHandler = this.domListeners.get("click");
    if (clickHandler) {
      this.paginationContainer.removeEventListener("click", clickHandler);
    }

    // Limpiar listeners
    this.domListeners.clear();
    this.callbackSets.clear();
  }
}
