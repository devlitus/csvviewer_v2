import {
  CURRENT_PAGE_SELECTOR,
  TOTAL_PAGES_SELECTOR,
  PAGINATION_FIRST,
  PAGINATION_PREV,
  PAGINATION_NEXT,
  PAGINATION_LAST,
} from "../utils/domSelectors";

/**
 * Updates pagination UI: page numbers and button states.
 */
export class PaginationRenderer {
  private currentPageElement: HTMLElement | null;
  private totalPagesElement: HTMLElement | null;
  private firstBtn: HTMLButtonElement | null;
  private prevBtn: HTMLButtonElement | null;
  private nextBtn: HTMLButtonElement | null;
  private lastBtn: HTMLButtonElement | null;

  constructor(
    currentPageSelector: string = CURRENT_PAGE_SELECTOR,
    totalPagesSelector: string = TOTAL_PAGES_SELECTOR,
    firstBtnSelector: string = PAGINATION_FIRST,
    prevBtnSelector: string = PAGINATION_PREV,
    nextBtnSelector: string = PAGINATION_NEXT,
    lastBtnSelector: string = PAGINATION_LAST
  ) {
    this.currentPageElement = document.querySelector(currentPageSelector);
    if (!this.currentPageElement) {
      console.warn(`[PaginationRenderer] Current page element not found for selector: "${currentPageSelector}"`);
    }
    this.totalPagesElement = document.querySelector(totalPagesSelector);
    if (!this.totalPagesElement) {
      console.warn(`[PaginationRenderer] Total pages element not found for selector: "${totalPagesSelector}"`);
    }
    this.firstBtn = document.querySelector(firstBtnSelector);
    if (!this.firstBtn) {
      console.warn(`[PaginationRenderer] First button not found for selector: "${firstBtnSelector}"`);
    }
    this.prevBtn = document.querySelector(prevBtnSelector);
    if (!this.prevBtn) {
      console.warn(`[PaginationRenderer] Previous button not found for selector: "${prevBtnSelector}"`);
    }
    this.nextBtn = document.querySelector(nextBtnSelector);
    if (!this.nextBtn) {
      console.warn(`[PaginationRenderer] Next button not found for selector: "${nextBtnSelector}"`);
    }
    this.lastBtn = document.querySelector(lastBtnSelector);
    if (!this.lastBtn) {
      console.warn(`[PaginationRenderer] Last button not found for selector: "${lastBtnSelector}"`);
    }
  }

  /**
   * Update pagination display with current page and total pages.
   *
   * @param currentPage - Current page number (1-indexed)
   * @param totalPages - Total number of pages available
   */
  update(currentPage: number, totalPages: number): void {
    this.updatePageNumbers(currentPage, totalPages);
    this.updateButtonStates(currentPage, totalPages);
  }

  /**
   * Update page numbers display.
   */
  private updatePageNumbers(currentPage: number, totalPages: number): void {
    if (this.currentPageElement) {
      this.currentPageElement.textContent = currentPage.toString();
    }
    if (this.totalPagesElement) {
      this.totalPagesElement.textContent = totalPages.toString();
    }
  }

  /**
   * Update button disabled states.
   */
  private updateButtonStates(currentPage: number, totalPages: number): void {
    const isFirst = currentPage === 1;
    const isLast = currentPage === totalPages;

    if (this.firstBtn) this.firstBtn.disabled = isFirst;
    if (this.prevBtn) this.prevBtn.disabled = isFirst;
    if (this.nextBtn) this.nextBtn.disabled = isLast;
    if (this.lastBtn) this.lastBtn.disabled = isLast;
  }
}
