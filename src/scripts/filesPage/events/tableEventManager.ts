/**
 * Event Manager para la tabla de archivos
 *
 * Implementa event delegation para:
 * - Clicks en botones de eliminación individual
 * - Cambios en checkboxes de selección
 * - Clicks en filas para navegación al visualizador
 *
 * Patrón: Un único listener por contenedor, delegando a elementos específicos
 */

import { TABLE_BODY_SELECTOR } from "../utils/domSelectors.js";

export class TableEventManager {
  private tableBody: HTMLElement | null;
  private domListeners: Map<string, EventListener> = new Map();
  private callbackSets: Map<string, Set<Function>> = new Map();

  constructor(tableBodySelector: string = TABLE_BODY_SELECTOR) {
    this.tableBody = document.querySelector(tableBodySelector);
    this.setupDelegation();
  }

  /**
   * Configura listeners de delegación en el contenedor
   * Se ejecuta una sola vez en el constructor
   */
  private setupDelegation(): void {
    if (!this.tableBody) return;

    // Unified click handler for delete button and row navigation
    const clickHandler: EventListener = (e: Event) => {
      const event = e as MouseEvent;
      const target = event.target as HTMLElement;

      // Check for delete button first
      const deleteBtn = target.closest("[data-delete-button]");
      if (deleteBtn) {
        event.stopPropagation();
        const row = deleteBtn.closest("[data-file-id]");
        if (row) {
          const fileId = row.getAttribute("data-file-id");
          if (fileId) {
            this.notifyDeleteClick(fileId);
          }
        }
        return;
      }

      // Check for checkbox (prevent navigation)
      const checkbox = target.closest("[data-file-checkbox]");
      if (checkbox) {
        return;
      }

      // Otherwise, it's a row click (navigate to visualizer)
      const row = target.closest("[data-file-id]");
      if (row) {
        const fileId = row.getAttribute("data-file-id");
        if (fileId) {
          this.notifyRowClick(fileId);
        }
      }
    };

    // Guardar referencia para poder remover después
    this.domListeners.set("click", clickHandler);

    // Registrar un único listener para clicks
    this.tableBody.addEventListener("click", clickHandler);
  }

  /**
   * Suscribirse a clicks en botones de eliminación
   * Retorna función unsubscribe
   */
  onDeleteClick(callback: (fileId: string) => void): () => void {
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
   * Suscribirse a clicks en filas (navegación)
   * Retorna función unsubscribe
   */
  onRowClick(callback: (fileId: string) => void): () => void {
    if (!this.callbackSets.has("rowClickCallbacks")) {
      this.callbackSets.set("rowClickCallbacks", new Set());
    }

    const callbacks = this.callbackSets.get("rowClickCallbacks")!;
    callbacks.add(callback);

    // Retornar función unsubscribe
    return () => {
      callbacks.delete(callback);
    };
  }

  /**
   * Notifica a todos los suscriptores de delete click
   */
  private notifyDeleteClick(fileId: string): void {
    const callbacks = this.callbackSets.get("deleteClickCallbacks");
    if (callbacks) {
      callbacks.forEach((cb) => {
        (cb as (fileId: string) => void)(fileId);
      });
    }
  }


  /**
   * Notifica a todos los suscriptores de row click
   */
  private notifyRowClick(fileId: string): void {
    const callbacks = this.callbackSets.get("rowClickCallbacks");
    if (callbacks) {
      callbacks.forEach((cb) => {
        (cb as (fileId: string) => void)(fileId);
      });
    }
  }

  /**
   * Limpia todos los listeners
   * Llamado en View Transitions
   */
  cleanup(): void {
    if (!this.tableBody) return;

    const clickHandler = this.domListeners.get("click");
    if (clickHandler) {
      this.tableBody.removeEventListener("click", clickHandler);
    }

    this.domListeners.clear();
    this.callbackSets.clear();
  }
}
