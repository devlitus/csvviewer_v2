import { FileStore } from "../core/fileStore.js";
import {
  CONFIRMATION_MODAL_SELECTOR,
  CONFIRMATION_MESSAGE_SELECTOR,
  CONFIRM_BUTTON_SELECTOR,
  CANCEL_BUTTON_SELECTOR,
} from "../utils/index.js";

/**
 * Manages batch file deletion with modal confirmation.
 * Handles showing confirmation dialog, managing user response, and executing deletion.
 */
export class BatchDeleteManager {
  private fileStore: FileStore;
  private handleConfirm: (() => void) | null = null;
  private handleCancel: (() => void) | null = null;
  private handleEscape: ((e: KeyboardEvent) => void) | null = null;

  /**
   * Initializes the manager with FileStore dependency.
   * @param fileStore - FileStore instance for deletion operations
   */
  constructor(fileStore: FileStore) {
    this.fileStore = fileStore;
  }

  /**
   * Deletes multiple files with modal confirmation.
   * Shows modal, waits for user response, executes deletion if confirmed.
   * @param ids - Array of file IDs to delete
   */
  async deleteSelected(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    return new Promise<void>((resolve) => {
      this.showConfirmationModal(ids.length);

      const modal = this.getModal();
      if (!modal) {
        resolve();
        return;
      }

      const confirmBtn = modal.querySelector(
        CONFIRM_BUTTON_SELECTOR
      ) as HTMLButtonElement;
      const cancelBtn = modal.querySelector(
        CANCEL_BUTTON_SELECTOR
      ) as HTMLButtonElement;

      if (!confirmBtn || !cancelBtn) {
        resolve();
        return;
      }

      // Define handlers with proper cleanup
      this.handleConfirm = async () => {
        this.removeModalListeners(confirmBtn, cancelBtn);
        try {
          await this.fileStore.deleteFiles(ids);
        } catch (err) {
          console.error("Error deleting files:", err);
        }
        this.closeConfirmationModal();
        resolve();
      };

      this.handleCancel = () => {
        this.removeModalListeners(confirmBtn, cancelBtn);
        this.closeConfirmationModal();
        resolve();
      };

      this.handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          this.handleCancel?.();
        }
      };

      // Attach listeners
      confirmBtn.addEventListener("click", this.handleConfirm);
      cancelBtn.addEventListener("click", this.handleCancel);
      document.addEventListener("keydown", this.handleEscape);
    });
  }

  /**
   * Shows the confirmation modal with file count.
   * Updates message and displays modal.
   * @param count - Number of files to delete
   */
  showConfirmationModal(count: number): void {
    const modal = this.getModal();
    if (!modal) return;

    // Update message with file count
    const messageSpan = modal.querySelector(CONFIRMATION_MESSAGE_SELECTOR);
    if (messageSpan) {
      const fileWord = count === 1 ? "file" : "files";
      messageSpan.textContent = `Delete ${count} ${fileWord}?`;
    }

    // Show modal
    modal.classList.remove("hidden");
    (modal as HTMLElement).style.display = "flex";
  }

  /**
   * Closes the confirmation modal and hides it.
   */
  closeConfirmationModal(): void {
    const modal = this.getModal();
    if (!modal) return;

    modal.classList.add("hidden");
    (modal as HTMLElement).style.display = "none";
  }

  /**
   * Removes all event listeners from modal buttons and document.
   * @param confirmBtn - Confirm button element
   * @param cancelBtn - Cancel button element
   */
  private removeModalListeners(
    confirmBtn: HTMLButtonElement,
    cancelBtn: HTMLButtonElement
  ): void {
    if (this.handleConfirm) {
      confirmBtn.removeEventListener("click", this.handleConfirm);
    }
    if (this.handleCancel) {
      cancelBtn.removeEventListener("click", this.handleCancel);
    }
    if (this.handleEscape) {
      document.removeEventListener("keydown", this.handleEscape);
    }

    this.handleConfirm = null;
    this.handleCancel = null;
    this.handleEscape = null;
  }

  /**
   * Gets the confirmation modal element from DOM.
   * @returns Modal element or null if not found
   */
  private getModal(): HTMLElement | null {
    return document.querySelector(
      CONFIRMATION_MODAL_SELECTOR
    ) as HTMLElement | null;
  }
}
