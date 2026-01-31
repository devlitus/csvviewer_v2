import { ROWS_PER_PAGE_SELECT } from "../utils/domSelectors";

/**
 * Manages rows-per-page select change events.
 * Implements cleanup for View Transitions support.
 */
export class RowsPerPageEventManager {
  private listener: {
    element: HTMLSelectElement;
    handler: EventListener;
  } | null = null;

  constructor(private selectSelector: string = ROWS_PER_PAGE_SELECT) {}

  /**
   * Setup change listener.
   *
   * @param callback - Function to call with new rows-per-page value
   */
  onChange(callback: (newValue: number) => void): void {
    const selectElement = document.querySelector(
      this.selectSelector
    ) as HTMLSelectElement | null;
    if (!selectElement) return;

    const handler = (e: Event) => {
      const value = parseInt((e.target as HTMLSelectElement).value, 10);
      callback(value);
    };

    selectElement.addEventListener("change", handler);
    this.listener = { element: selectElement, handler };
  }

  /**
   * Cleanup event listener.
   */
  cleanup(): void {
    if (this.listener) {
      this.listener.element.removeEventListener("change", this.listener.handler);
      this.listener = null;
    }
  }
}
