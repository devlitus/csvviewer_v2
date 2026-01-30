import type { CSVFile, FileStoreState } from "../../../lib/types.js";
import { getAllFiles, deleteFiles } from "../../../lib/indexeddb.js";

/**
 * Manages file state and persistence layer communication.
 * Provides controlled access to file data with encapsulated state.
 */
export class FileStore {
  private state: FileStoreState;

  constructor(itemsPerPage: number = 6) {
    this.state = {
      allFiles: [],
      currentPage: 1,
      itemsPerPage,
    };
  }

  /**
   * Gets all loaded files.
   */
  getFiles(): CSVFile[] {
    return this.state.allFiles;
  }

  /**
   * Gets the current page number.
   */
  getCurrentPage(): number {
    return this.state.currentPage;
  }

  /**
   * Sets the current page number with validation.
   * @param page - Page number to set (1-indexed)
   */
  setCurrentPage(page: number): void {
    const totalPages = this.getTotalPages();
    if (page >= 1 && page <= totalPages) {
      this.state.currentPage = page;
    }
  }

  /**
   * Loads all files from IndexedDB into memory.
   * @throws Error if IndexedDB operation fails
   */
  async loadFiles(): Promise<void> {
    try {
      this.state.allFiles = await getAllFiles();
    } catch (err) {
      console.error("Failed to load files from IndexedDB:", err);
      throw err;
    }
  }

  /**
   * Deletes a single file from IndexedDB.
   * @param id - File ID to delete
   */
  async deleteFile(id: string): Promise<void> {
    await this.deleteFiles([id]);
  }

  /**
   * Deletes multiple files from IndexedDB and updates local state.
   * Adjusts currentPage if it exceeds totalPages after deletion.
   * @param ids - Array of file IDs to delete
   */
  async deleteFiles(ids: string[]): Promise<void> {
    try {
      await deleteFiles(ids);
      // Update local state by removing deleted files
      this.state.allFiles = this.state.allFiles.filter(
        (f) => !ids.includes(f.id)
      );

      // Adjust current page if it's now out of range
      const totalPages = this.getTotalPages();
      if (this.state.currentPage > totalPages && totalPages > 0) {
        this.state.currentPage = totalPages;
      }
    } catch (err) {
      console.error("Failed to delete files:", err);
      throw err;
    }
  }

  /**
   * Calculates the total number of pages.
   */
  getTotalPages(): number {
    return Math.max(
      1,
      Math.ceil(this.state.allFiles.length / this.state.itemsPerPage)
    );
  }

  /**
   * Gets the files for the current page.
   */
  getCurrentPageFiles(): CSVFile[] {
    const start = (this.state.currentPage - 1) * this.state.itemsPerPage;
    const end = start + this.state.itemsPerPage;
    return this.state.allFiles.slice(start, end);
  }

  /**
   * Resets store state for new page navigation (View Transitions support).
   */
  resetState(): void {
    this.state.currentPage = 1;
    this.state.allFiles = [];
  }
}
