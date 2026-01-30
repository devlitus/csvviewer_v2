export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
}

/**
 * Manages pagination state and calculations.
 * Provides boundary validation for page navigation.
 */
export class PaginationManager {
  private state: PaginationState;

  constructor(itemsPerPage: number = 6, totalItems: number = 0) {
    this.state = {
      currentPage: 1,
      itemsPerPage,
      totalItems,
    };
  }

  /**
   * Gets the current page number.
   */
  getCurrentPage(): number {
    return this.state.currentPage;
  }

  /**
   * Sets the current page with validation.
   * @param page - Page number to set (1-indexed)
   */
  setCurrentPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.state.currentPage = page;
    }
  }

  /**
   * Calculates the total number of pages.
   */
  getTotalPages(): number {
    if (this.state.totalItems === 0) return 1;
    return Math.ceil(this.state.totalItems / this.state.itemsPerPage);
  }

  /**
   * Gets the start and end indices for slicing an array.
   * Example: page 2 with 6 items per page returns [6, 12]
   */
  getPageRange(): [start: number, end: number] {
    const start = (this.state.currentPage - 1) * this.state.itemsPerPage;
    const end = Math.min(start + this.state.itemsPerPage, this.state.totalItems);
    return [start, end];
  }

  /**
   * Gets the display range for showing to the user.
   * Example: returns [1, 6] for page 1 with 6 items per page
   * @param total - Total number of items
   */
  getDisplayRange(total: number): [start: number, end: number] {
    if (total === 0) return [0, 0];
    const start = (this.state.currentPage - 1) * this.state.itemsPerPage + 1;
    const end = Math.min(
      this.state.currentPage * this.state.itemsPerPage,
      total
    );
    return [start, end];
  }

  /**
   * Checks if previous page is available.
   */
  canPrevious(): boolean {
    return this.state.currentPage > 1;
  }

  /**
   * Checks if next page is available.
   */
  canNext(): boolean {
    return this.state.currentPage < this.getTotalPages();
  }

  /**
   * Navigates to the previous page if available.
   */
  previousPage(): void {
    if (this.canPrevious()) {
      this.state.currentPage--;
    }
  }

  /**
   * Navigates to the next page if available.
   */
  nextPage(): void {
    if (this.canNext()) {
      this.state.currentPage++;
    }
  }

  /**
   * Navigates to a specific page with validation.
   * @param page - Target page number (1-indexed)
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.state.currentPage = page;
    }
  }

  /**
   * Updates the total number of items (call after files change).
   * Adjusts current page if necessary.
   * @param total - New total item count
   */
  setTotalItems(total: number): void {
    this.state.totalItems = total;
    // If current page exceeds total pages, move to last page
    if (this.state.currentPage > this.getTotalPages() && this.getTotalPages() > 0) {
      this.state.currentPage = this.getTotalPages();
    }
  }

  /**
   * Resets pagination to first page.
   */
  reset(): void {
    this.state.currentPage = 1;
  }
}
