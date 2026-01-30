import { FileStore } from "../core/fileStore.js";
import { animateRowDelete, getFileRowSelector } from "../utils/index.js";

export interface SingleDeleteState {
  pendingDeleteId: string | null;
  confirmTimeout: NodeJS.Timeout | null;
}

/**
 * Manages single file deletion with confirmation UI.
 * Implements two-click confirmation pattern: first click shows confirmation state,
 * second click (within 3s) confirms deletion, or timeout cancels.
 */
export class SingleDeleteManager {
  private state: SingleDeleteState;
  private fileStore: FileStore;
  private subscribers: Set<(state: SingleDeleteState) => void> = new Set();

  /**
   * Initializes the manager with FileStore dependency.
   * @param fileStore - FileStore instance for deletion operations
   */
  constructor(fileStore: FileStore) {
    this.fileStore = fileStore;
    this.state = {
      pendingDeleteId: null,
      confirmTimeout: null,
    };
  }

  /**
   * Handles a delete button click.
   * First click: shows confirmation state (visual feedback + 3s timeout)
   * Second click: confirms and executes deletion
   * @param fileId - ID of the file to delete
   */
  handleDeleteClick(fileId: string): void {
    if (this.state.pendingDeleteId === fileId) {
      // Second click: confirm deletion
      this.confirmDelete(fileId);
    } else {
      // First click: show confirmation state
      this.showDeleteConfirm(fileId);
    }
  }

  /**
   * Shows deletion confirmation state with auto-cancel timeout.
   * @param fileId - ID of file awaiting confirmation
   */
  private showDeleteConfirm(fileId: string): void {
    // Cleanup previous timeout if it exists
    if (this.state.confirmTimeout) {
      clearTimeout(this.state.confirmTimeout);
    }

    // Set pending delete state
    this.state.pendingDeleteId = fileId;
    this.notifySubscribers();

    // Auto-cancel after 3 seconds
    this.state.confirmTimeout = setTimeout(() => {
      this.cancelDelete();
    }, 3000);
  }

  /**
   * Confirms deletion and executes the delete operation.
   * Animates row exit, removes from IndexedDB, and updates state.
   * @param fileId - ID of file to delete
   */
  async confirmDelete(fileId: string): Promise<void> {
    // Cleanup timeout
    if (this.state.confirmTimeout) {
      clearTimeout(this.state.confirmTimeout);
      this.state.confirmTimeout = null;
    }

    // Get the row element for animation
    const rowSelector = getFileRowSelector(fileId);
    const row = document.querySelector(rowSelector) as HTMLElement;

    try {
      // Animate row deletion
      if (row) {
        await animateRowDelete(row);
      }

      // Delete from IndexedDB
      await this.fileStore.deleteFile(fileId);

      // Reset state after successful deletion
      this.state.pendingDeleteId = null;
      this.notifySubscribers();
    } catch (err) {
      console.error(`Error deleting file ${fileId}:`, err);
      // Reset state even on error to allow retry
      this.state.pendingDeleteId = null;
      this.notifySubscribers();
    }
  }

  /**
   * Cancels the pending deletion confirmation.
   * Clears timeout and resets pending delete ID.
   */
  cancelDelete(): void {
    if (this.state.confirmTimeout) {
      clearTimeout(this.state.confirmTimeout);
      this.state.confirmTimeout = null;
    }

    this.state.pendingDeleteId = null;
    this.notifySubscribers();
  }

  /**
   * Gets the currently pending delete file ID.
   * @returns File ID awaiting confirmation or null
   */
  getPendingDeleteId(): string | null {
    return this.state.pendingDeleteId;
  }

  /**
   * Subscribes to state changes with observer pattern.
   * @param callback - Function called when state changes
   * @returns Unsubscribe function
   */
  subscribe(callback: (state: SingleDeleteState) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notifies all subscribers of state change.
   */
  private notifySubscribers(): void {
    this.subscribers.forEach((cb) => cb(this.getState()));
  }

  /**
   * Gets the current state snapshot.
   */
  private getState(): SingleDeleteState {
    return {
      pendingDeleteId: this.state.pendingDeleteId,
      confirmTimeout: this.state.confirmTimeout,
    };
  }

  /**
   * Cleans up resources for View Transitions.
   * Clears timeout and all subscribers.
   */
  cleanup(): void {
    if (this.state.confirmTimeout) {
      clearTimeout(this.state.confirmTimeout);
      this.state.confirmTimeout = null;
    }
    this.subscribers.clear();
    this.state.pendingDeleteId = null;
  }
}
