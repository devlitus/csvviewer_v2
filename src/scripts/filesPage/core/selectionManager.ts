import type { CSVFile } from "../../../lib/types.js";

export interface SelectionState {
  selectedIds: Set<string>;
}

/**
 * Manages file selection state with observer pattern support.
 * Handles individual, page, and bulk selection operations.
 */
export class SelectionManager {
  private state: SelectionState;
  private subscribers: Set<(state: SelectionState) => void> = new Set();

  constructor() {
    this.state = {
      selectedIds: new Set(),
    };
  }

  /**
   * Toggles selection of a file (adds if not selected, removes if selected).
   * @param fileId - File ID to toggle
   */
  toggle(fileId: string): void {
    if (this.state.selectedIds.has(fileId)) {
      this.state.selectedIds.delete(fileId);
    } else {
      this.state.selectedIds.add(fileId);
    }
    this.notifySubscribers();
  }

  /**
   * Selects a file.
   * @param fileId - File ID to select
   */
  select(fileId: string): void {
    if (!this.state.selectedIds.has(fileId)) {
      this.state.selectedIds.add(fileId);
      this.notifySubscribers();
    }
  }

  /**
   * Deselects a file.
   * @param fileId - File ID to deselect
   */
  deselect(fileId: string): void {
    if (this.state.selectedIds.has(fileId)) {
      this.state.selectedIds.delete(fileId);
      this.notifySubscribers();
    }
  }

  /**
   * Checks if a file is selected.
   * @param fileId - File ID to check
   */
  isSelected(fileId: string): boolean {
    return this.state.selectedIds.has(fileId);
  }

  /**
   * Gets the count of selected files.
   */
  getSelectedCount(): number {
    return this.state.selectedIds.size;
  }

  /**
   * Gets all selected file IDs as an array.
   */
  getSelectedIds(): string[] {
    return Array.from(this.state.selectedIds);
  }

  /**
   * Selects all files in the given page.
   * @param pageFiles - CSVFile[] for the current page
   */
  selectPage(pageFiles: CSVFile[]): void {
    const hadChanges = pageFiles.some(
      (f) => !this.state.selectedIds.has(f.id)
    );
    if (hadChanges) {
      pageFiles.forEach((f) => this.state.selectedIds.add(f.id));
      this.notifySubscribers();
    }
  }

  /**
   * Deselects all files in the given page.
   * @param pageFiles - CSVFile[] for the current page
   */
  deselectPage(pageFiles: CSVFile[]): void {
    const hadChanges = pageFiles.some((f) =>
      this.state.selectedIds.has(f.id)
    );
    if (hadChanges) {
      pageFiles.forEach((f) => this.state.selectedIds.delete(f.id));
      this.notifySubscribers();
    }
  }

  /**
   * Deselects all files.
   */
  deselectAll(): void {
    if (this.state.selectedIds.size > 0) {
      this.state.selectedIds.clear();
      this.notifySubscribers();
    }
  }

  /**
   * Gets the selection state for a page (none, partial, or all selected).
   * @param pageFiles - CSVFile[] for the current page
   */
  getPageSelectState(
    pageFiles: CSVFile[]
  ): "none" | "partial" | "all" {
    if (pageFiles.length === 0) return "none";

    const selectedCount = pageFiles.filter((f) =>
      this.state.selectedIds.has(f.id)
    ).length;

    if (selectedCount === 0) return "none";
    if (selectedCount === pageFiles.length) return "all";
    return "partial";
  }

  /**
   * Subscribes to state changes with observer pattern.
   * @param callback - Function called when state changes
   * @returns Unsubscribe function
   */
  subscribe(callback: (state: SelectionState) => void): () => void {
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
   * Gets the current state (used by notifySubscribers).
   */
  private getState(): SelectionState {
    return {
      selectedIds: new Set(this.state.selectedIds),
    };
  }
}
