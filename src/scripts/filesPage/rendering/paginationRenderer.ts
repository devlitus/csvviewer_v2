/**
 * Renders pagination controls and state.
 * Manages page numbers, navigation buttons, and display text.
 *
 * Responsibilities:
 * - Rendering page number buttons
 * - Updating prev/next button state
 * - Displaying "showing X-Y of Z" text
 *
 * Note: Event handling is managed by PaginationEventManager, not this renderer.
 */
export class PaginationRenderer {
  private paginationElement: HTMLElement | null = null;

  /**
   * Initializes the renderer with a pagination container selector.
   * @param paginationSelector - CSS selector for pagination element (e.g., "[data-pagination]")
   */
  constructor(private paginationSelector: string) {
    this.paginationElement = document.querySelector(
      this.paginationSelector
    ) as HTMLElement | null;
  }

  /**
   * Renders the complete pagination state.
   * Updates displaying text, page numbers, and prev/next buttons.
   *
   * @param currentPage - Current page number (1-indexed)
   * @param totalPages - Total number of pages
   * @param displayStart - Start index for "showing X-Y" text (1-indexed)
   * @param displayEnd - End index for "showing X-Y" text (1-indexed)
   * @param totalFiles - Total number of files
   */
  render(
    currentPage: number,
    totalPages: number,
    displayStart: number,
    displayEnd: number,
    totalFiles: number
  ): void {
    this.updateShowing(displayStart, displayEnd, totalFiles);
    this.updatePageNumbers(currentPage, totalPages);
    this.updatePrevNextButtons(currentPage > 1, currentPage < totalPages);
  }

  /**
   * Updates the "Showing X-Y of Z files" display.
   *
   * @param start - Start index (1-indexed, e.g., 1)
   * @param end - End index (1-indexed, e.g., 6)
   * @param total - Total file count
   */
  updateShowing(start: number, end: number, total: number): void {
    if (!this.paginationElement) return;

    const startSpan = this.paginationElement.querySelector(
      "[data-showing-start]"
    );
    const endSpan = this.paginationElement.querySelector("[data-showing-end]");
    const totalSpan = this.paginationElement.querySelector("[data-total-files]");

    if (startSpan) startSpan.textContent = String(start);
    if (endSpan) endSpan.textContent = String(end);
    if (totalSpan) totalSpan.textContent = String(total);
  }

  /**
   * Updates page number buttons with navigation capability.
   * Creates buttons for pages 1-3, adds ellipsis if more pages exist.
   * Current page button is highlighted with vibrant-blue background.
   *
   * Uses element cloning to safely remove old event listeners.
   *
   * @param currentPage - Current page number (1-indexed)
   * @param totalPages - Total number of pages
   */
  updatePageNumbers(currentPage: number, totalPages: number): void {
    if (!this.paginationElement) return;

    const pageNumbersContainer = this.paginationElement.querySelector(
      "[data-page-numbers]"
    );
    if (!pageNumbersContainer) return;

    // Clone container to remove old listeners
    const newContainer = pageNumbersContainer.cloneNode(false) as HTMLElement;

    // Show pages 1-3 or all pages if less than 3
    const pagesToShow = Math.min(3, totalPages);
    for (let i = 1; i <= pagesToShow; i++) {
      const button = document.createElement("button");
      button.textContent = String(i);
      button.className =
        "px-2 py-1 rounded-lg border border-border-dark text-sm font-medium transition-colors " +
        (i === currentPage
          ? "bg-vibrant-blue/10 border-vibrant-blue text-vibrant-blue"
          : "text-text-light-gray hover:bg-white/5 hover:border-text-light-gray");

      newContainer.appendChild(button);
    }

    // Add ellipsis if more pages exist
    if (totalPages > 3) {
      const ellipsis = document.createElement("span");
      ellipsis.textContent = "...";
      ellipsis.className = "px-2 py-1 text-text-light-gray";
      newContainer.appendChild(ellipsis);
    }

    // Replace old container with new one
    pageNumbersContainer.parentNode?.replaceChild(newContainer, pageNumbersContainer);
  }

  /**
   * Updates prev/next button disabled state based on navigation capability.
   * Clones buttons to safely remove old listeners.
   *
   * @param canPrev - Whether user can go to previous page
   * @param canNext - Whether user can go to next page
   */
  updatePrevNextButtons(canPrev: boolean, canNext: boolean): void {
    if (!this.paginationElement) return;

    const prevButton = this.paginationElement.querySelector(
      "[data-prev-button]"
    ) as HTMLButtonElement | null;
    const nextButton = this.paginationElement.querySelector(
      "[data-next-button]"
    ) as HTMLButtonElement | null;

    if (prevButton) {
      const newPrevButton = prevButton.cloneNode(true) as HTMLButtonElement;
      newPrevButton.disabled = !canPrev;
      prevButton.parentNode?.replaceChild(newPrevButton, prevButton);
    }

    if (nextButton) {
      const newNextButton = nextButton.cloneNode(true) as HTMLButtonElement;
      newNextButton.disabled = !canNext;
      nextButton.parentNode?.replaceChild(newNextButton, nextButton);
    }
  }

}
