import {
  SELECTION_COUNT_SELECTOR,
} from "../utils/domSelectors.js";

/**
 * Renders the selection bar that appears when files are selected.
 * Manages visibility, selection count, and delete/cancel actions.
 *
 * Responsibilities:
 * - Showing/hiding selection bar
 * - Updating selected file count
 * - Observer pattern for cancel/delete actions
 */
export class SelectionBarRenderer {
  private barElement: HTMLElement | null = null;

  /**
   * Initializes the renderer with a selection bar selector.
   * @param barSelector - CSS selector for selection bar element (e.g., "[data-selection-bar]")
   */
  constructor(private barSelector: string) {
    this.barElement = document.querySelector(
      this.barSelector
    ) as HTMLElement | null;
  }

  /**
   * Shows the selection bar with given count.
   * Makes bar visible and updates selection count text.
   *
   * @param count - Number of selected files
   */
  show(count: number): void {
    if (!this.barElement) return;

    this.barElement.classList.remove("hidden");
    this.barElement.style.display = "flex";
    this.updateCount(count);
  }

  /**
   * Hides the selection bar.
   * Makes bar invisible and removes from document flow.
   */
  hide(): void {
    if (!this.barElement) return;

    this.barElement.classList.add("hidden");
    this.barElement.style.display = "none";
  }

  /**
   * Updates the selection count text.
   * Shows "N file(s) selected" with proper singular/plural handling.
   *
   * @param count - Number of selected files
   */
  updateCount(count: number): void {
    if (!this.barElement) return;

    const countSpan = this.barElement.querySelector(
      SELECTION_COUNT_SELECTOR
    );
    if (!countSpan) return;

    const fileWord = count === 1 ? "file" : "files";
    countSpan.textContent = `${count} ${fileWord}`;
  }
}
