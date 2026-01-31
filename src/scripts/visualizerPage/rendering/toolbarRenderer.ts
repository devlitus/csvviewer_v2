import {
  SHOWING_ROWS_SELECTOR,
  TOTAL_RECORDS_SELECTOR,
} from "../utils/domSelectors";

/**
 * Updates toolbar counters (showing X rows from Y total).
 */
export class ToolbarRenderer {
  private showingElement: HTMLElement | null;
  private totalElement: HTMLElement | null;

  constructor(
    showingSelector: string = SHOWING_ROWS_SELECTOR,
    totalSelector: string = TOTAL_RECORDS_SELECTOR
  ) {
    this.showingElement = document.querySelector(showingSelector);
    if (!this.showingElement) {
      console.warn(`[ToolbarRenderer] Showing rows element not found for selector: "${showingSelector}"`);
    }
    this.totalElement = document.querySelector(totalSelector);
    if (!this.totalElement) {
      console.warn(`[ToolbarRenderer] Total records element not found for selector: "${totalSelector}"`);
    }
  }

  /**
   * Update toolbar counters.
   *
   * @param showingRows - Number of rows being shown on current page
   * @param totalRecords - Total number of records in dataset
   */
  update(showingRows: number, totalRecords: number): void {
    if (this.showingElement) {
      this.showingElement.textContent = showingRows.toString();
    }
    if (this.totalElement) {
      this.totalElement.textContent = totalRecords.toLocaleString();
    }
  }
}
