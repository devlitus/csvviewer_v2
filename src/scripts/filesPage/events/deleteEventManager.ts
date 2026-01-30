/**
 * Event Manager para eliminación masiva
 *
 * Implementa listeners para:
 * - Click en botón "Cancelar" de la barra de selección
 * - Click en botón "Eliminar" de la barra de selección
 */

import { SELECTION_BAR_SELECTOR } from "../utils/domSelectors.js";

export class DeleteEventManager {
  private selectionBar: HTMLElement | null;
  private domListeners: Map<string, EventListener> = new Map();
  private callbackSets: Map<string, Set<Function>> = new Map();

  constructor(selectionBarSelector: string = SELECTION_BAR_SELECTOR) {
    this.selectionBar = document.querySelector(selectionBarSelector);
    this.setupListeners();
  }

  /**
   * Configura listeners en la barra de selección
   * Se ejecuta una sola vez en el constructor
   */
  private setupListeners(): void {
    if (!this.selectionBar) return;

    // Unified click handler for both cancel and delete buttons
    const clickHandler: EventListener = (e: Event) => {
      const target = e.target as HTMLElement;

      // Check for cancel button
      const cancelBtn = target.closest("[data-selection-cancel]");
      if (cancelBtn) {
        this.notifyCancelClick();
        return;
      }

      // Check for delete button
      const deleteBtn = target.closest("[data-selection-delete]");
      if (deleteBtn) {
        this.notifyDeleteClick();
        return;
      }
    };

    // Guardar referencia para poder remover después
    this.domListeners.set("click", clickHandler);

    // Registrar un único listener para clicks en la barra
    this.selectionBar.addEventListener("click", clickHandler);
  }

  /**
   * Suscribirse a clicks en botón "Cancelar"
   * Retorna función unsubscribe
   */
  onCancelClick(callback: () => void): () => void {
    if (!this.callbackSets.has("cancelClickCallbacks")) {
      this.callbackSets.set("cancelClickCallbacks", new Set());
    }

    const callbacks = this.callbackSets.get("cancelClickCallbacks")!;
    callbacks.add(callback);

    // Retornar función unsubscribe
    return () => {
      callbacks.delete(callback);
    };
  }

  /**
   * Suscribirse a clicks en botón "Eliminar"
   * Retorna función unsubscribe
   */
  onDeleteClick(callback: () => void): () => void {
    if (!this.callbackSets.has("deleteClickCallbacks")) {
      this.callbackSets.set("deleteClickCallbacks", new Set());
    }

    const callbacks = this.callbackSets.get("deleteClickCallbacks")!;
    callbacks.add(callback);

    // Retornar función unsubscribe
    return () => {
      callbacks.delete(callback);
    };
  }

  /**
   * Notifica a todos los suscriptores de cancel click
   */
  private notifyCancelClick(): void {
    const callbacks = this.callbackSets.get("cancelClickCallbacks");
    if (callbacks) {
      callbacks.forEach((cb) => {
        (cb as () => void)();
      });
    }
  }

  /**
   * Notifica a todos los suscriptores de delete click
   */
  private notifyDeleteClick(): void {
    const callbacks = this.callbackSets.get("deleteClickCallbacks");
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
    if (!this.selectionBar) return;

    const clickHandler = this.domListeners.get("click");
    if (clickHandler) {
      this.selectionBar.removeEventListener("click", clickHandler);
    }

    // Limpiar listeners
    this.domListeners.clear();
    this.callbackSets.clear();
  }
}
