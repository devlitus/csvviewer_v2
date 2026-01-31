export interface PaginationState {
  currentPage: number;
  rowsPerPage: number;
  totalRows: number;
  totalPages: number;
}

/**
 * Manages pagination state and calculations.
 * Reusable across different paginated views.
 */
export class PaginationManager {
  private state: PaginationState;

  constructor(rowsPerPage: number = 50, totalRows: number = 0) {
    this.state = {
      currentPage: 1,
      rowsPerPage,
      totalRows,
      totalPages: totalRows > 0 ? Math.ceil(totalRows / rowsPerPage) : 1,
    };
  }

  /**
   * Get current page number (1-indexed).
   */
  getCurrentPage(): number {
    return this.state.currentPage;
  }

  /**
   * Get rows per page.
   */
  getRowsPerPage(): number {
    return this.state.rowsPerPage;
  }

  /**
   * Get total number of pages.
   */
  getTotalPages(): number {
    return this.state.totalPages;
  }

  /**
   * Get start and end indices for slicing data.
   * Example: page 2 with 50 rows per page returns [50, 100]
   */
  getPageRange(): [startIndex: number, endIndex: number] {
    const start = (this.state.currentPage - 1) * this.state.rowsPerPage;
    const end = Math.min(start + this.state.rowsPerPage, this.state.totalRows);
    return [start, end];
  }

  /**
   * Get display range for UI (1-indexed, inclusive).
   * Returns [0, 0] if no data, otherwise returns [start, end] for current page.
   * Example: page 1 with 50 rows returns [1, 50]; empty dataset returns [0, 0]
   */
  getDisplayRange(): [start: number, end: number] {
    if (this.state.totalRows === 0) return [0, 0];
    const start = (this.state.currentPage - 1) * this.state.rowsPerPage + 1;
    const end = Math.min(
      this.state.currentPage * this.state.rowsPerPage,
      this.state.totalRows
    );
    return [start, end];
  }

  /**
   * Check if previous page is available.
   */
  canGoPrevious(): boolean {
    return this.state.currentPage > 1;
  }

  /**
   * Check if next page is available.
   */
  canGoNext(): boolean {
    return this.state.currentPage < this.state.totalPages;
  }

  /**
   * Go to first page.
   */
  goToFirst(): void {
    this.state.currentPage = 1;
  }

  /**
   * Go to previous page if available.
   */
  goToPrevious(): void {
    if (this.canGoPrevious()) {
      this.state.currentPage--;
    }
  }

  /**
   * Go to next page if available.
   */
  goToNext(): void {
    if (this.canGoNext()) {
      this.state.currentPage++;
    }
  }

  /**
   * Go to last page.
   */
  goToLast(): void {
    this.state.currentPage = this.state.totalPages;
  }

  /**
   * Update total number of rows and recalculate pages.
   * Adjusts current page if necessary.
   */
  setTotalRows(totalRows: number): void {
    this.state.totalRows = totalRows;
    this.state.totalPages =
      totalRows > 0 ? Math.ceil(totalRows / this.state.rowsPerPage) : 1;

    // Adjust current page if it exceeds total pages
    if (
      this.state.currentPage > this.state.totalPages &&
      this.state.totalPages > 0
    ) {
      this.state.currentPage = this.state.totalPages;
    }
  }

  /**
   * Update rows per page and recalculate pages.
   * Resets to first page.
   *
   * @param rowsPerPage - Number of rows per page (must be positive)
   * @throws {Error} If rowsPerPage is not positive
   */
  setRowsPerPage(rowsPerPage: number): void {
    if (rowsPerPage <= 0) {
      throw new Error("rowsPerPage must be a positive number");
    }
    this.state.rowsPerPage = rowsPerPage;
    this.state.totalPages =
      this.state.totalRows > 0
        ? Math.ceil(this.state.totalRows / rowsPerPage)
        : 1;
    this.state.currentPage = 1;
  }

  /**
   * Reset pagination to first page.
   */
  reset(): void {
    this.state.currentPage = 1;
  }
}
