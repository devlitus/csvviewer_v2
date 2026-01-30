/**
 * Event Manager para selección de archivos
 *
 * Implementa event delegation para:
 * - Cambios en checkboxes individuales de selección
 * - Cambios en checkbox "Seleccionar todos"
 *
 * Complementario a TableEventManager
 */

import { TABLE_BODY_SELECTOR } from "../utils/domSelectors.js";

export class SelectionEventManager {
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

    // Unified change handler for both individual and select-all checkboxes
    const changeHandler: EventListener = (e: Event) => {
      const target = e.target as HTMLElement;

      // Check for select-all checkbox first
      const selectAllCheckbox = target.closest("[data-select-all-checkbox]");
      if (selectAllCheckbox) {
        const checked = (selectAllCheckbox as HTMLInputElement).checked;
        this.notifySelectAllChange(checked);
        return;
      }

      // Check for individual file checkbox
      const fileCheckbox = target.closest("[data-file-checkbox]");
      if (fileCheckbox) {
        const fileId = (fileCheckbox as HTMLInputElement).value;
        if (fileId) {
          this.notifyCheckboxChange(fileId);
        }
        return;
      }
    };

    // Guardar referencia para poder remover después
    this.domListeners.set("change", changeHandler);

    // Registrar un único listener para cambios en checkboxes
    this.tableBody.addEventListener("change", changeHandler);
  }

  /**
   * Suscribirse a cambios en checkboxes individuales
   * Retorna función unsubscribe
   */
  onCheckboxChange(callback: (fileId: string) => void): () => void {
    if (!this.callbackSets.has("checkboxChangeCallbacks")) {
      this.callbackSets.set("checkboxChangeCallbacks", new Set());
    }

    const callbacks = this.callbackSets.get("checkboxChangeCallbacks")!;
    callbacks.add(callback);

    // Retornar función unsubscribe
    return () => {
      callbacks.delete(callback);
    };
  }

  /**
   * Suscribirse a cambios en checkbox "Seleccionar todos"
   * Usado en Fase 6 para activar selectAllCurrentPage()
   * Retorna función unsubscribe
   */
  onSelectAllChange(callback: (checked: boolean) => void): () => void {
    if (!this.callbackSets.has("selectAllChangeCallbacks")) {
      this.callbackSets.set("selectAllChangeCallbacks", new Set());
    }

    const callbacks = this.callbackSets.get("selectAllChangeCallbacks")!;
    callbacks.add(callback);

    // Retornar función unsubscribe
    return () => {
      callbacks.delete(callback);
    };
  }

  /**
   * Notifica a todos los suscriptores de checkbox change
   */
  private notifyCheckboxChange(fileId: string): void {
    const callbacks = this.callbackSets.get("checkboxChangeCallbacks");
    if (callbacks) {
      callbacks.forEach((cb) => {
        (cb as (fileId: string) => void)(fileId);
      });
    }
  }

  /**
   * Notifica a todos los suscriptores de select all change
   */
  private notifySelectAllChange(checked: boolean): void {
    const callbacks = this.callbackSets.get("selectAllChangeCallbacks");
    if (callbacks) {
      callbacks.forEach((cb) => {
        (cb as (checked: boolean) => void)(checked);
      });
    }
  }

  /**
   * Limpia todos los listeners
   * Llamado en View Transitions
   */
  cleanup(): void {
    if (!this.tableBody) return;

    const changeHandler = this.domListeners.get("change");
    if (changeHandler) {
      this.tableBody.removeEventListener("change", changeHandler);
    }

    // Limpiar listeners
    this.domListeners.clear();
    this.callbackSets.clear();
  }
}
