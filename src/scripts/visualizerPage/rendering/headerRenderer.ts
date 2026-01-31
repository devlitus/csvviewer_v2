import { FILENAME_SELECTOR } from "../utils/domSelectors";

/**
 * Updates header with filename.
 */
export class HeaderRenderer {
  private filenameElement: HTMLElement | null;

  constructor(filenameSelector: string = FILENAME_SELECTOR) {
    this.filenameElement = document.querySelector(filenameSelector);
    if (!this.filenameElement) {
      console.warn(`[HeaderRenderer] Filename element not found for selector: "${filenameSelector}"`);
    }
  }

  /**
   * Update filename display.
   */
  updateFilename(filename: string): void {
    if (this.filenameElement) {
      this.filenameElement.textContent = filename;
    }
  }
}
