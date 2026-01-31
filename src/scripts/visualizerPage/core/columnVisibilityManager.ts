/**
 * Manages visibility state of CSV columns.
 * Maintains a set of visible column names and provides operations to toggle visibility.
 * Enforces constraint: at least one column must always be visible.
 */
export class ColumnVisibilityManager {
  private allColumns: string[] = [];
  private visibleColumns: Set<string> = new Set();

  constructor() {}

  /**
   * Initialize from all columns, marking all as visible by default.
   * @param columns - All column names from the CSV
   */
  initFromColumns(columns: string[]): void {
    this.allColumns = [...columns];
    this.visibleColumns = new Set(columns);
  }

  /**
   * Toggle visibility of a column.
   * Prevents deselecting the last visible column.
   * @param column - Column name to toggle
   * @returns true if toggle was successful, false if it was prevented (last column constraint)
   */
  toggle(column: string): boolean {
    if (this.visibleColumns.has(column)) {
      // If this is the last visible column, prevent deselection
      if (this.visibleColumns.size === 1) {
        return false;
      }
      this.visibleColumns.delete(column);
    } else {
      this.visibleColumns.add(column);
    }
    return true;
  }

  /**
   * Set all columns to visible or hidden.
   * When setting to hidden, leaves at least one column visible.
   * @param visible - true to show all, false to deselect all (but keep 1)
   */
  setAll(visible: boolean): void {
    if (visible) {
      // Show all columns
      this.visibleColumns = new Set(this.allColumns);
    } else {
      // Deselect all but keep the first one
      this.visibleColumns = new Set([this.allColumns[0]]);
    }
  }

  /**
   * Check if a column is currently visible.
   * @param column - Column name to check
   * @returns true if visible, false otherwise
   */
  isVisible(column: string): boolean {
    return this.visibleColumns.has(column);
  }

  /**
   * Get array of visible columns in original order.
   * @returns Array of visible column names maintaining original order
   */
  getVisibleColumns(): string[] {
    return this.allColumns.filter((col) => this.visibleColumns.has(col));
  }

  /**
   * Get count of visible columns.
   * @returns Number of visible columns
   */
  getVisibleCount(): number {
    return this.visibleColumns.size;
  }

  /**
   * Get total count of all columns.
   * @returns Total number of columns
   */
  getTotalCount(): number {
    return this.allColumns.length;
  }
}
