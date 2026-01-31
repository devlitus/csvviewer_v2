import {
  LOADING_STATE_SELECTOR,
  ERROR_STATE_SELECTOR,
  ERROR_MESSAGE_SELECTOR,
  CONTENT_SELECTOR,
} from "../utils/domSelectors";

export type UIState = "loading" | "error" | "content";

/**
 * Manages UI state transitions (loading, error, content).
 * Handles visibility of different page sections.
 */
export class UIStateManager {
  private loadingElement: HTMLElement | null;
  private errorElement: HTMLElement | null;
  private errorMessageElement: HTMLElement | null;
  private contentElement: HTMLElement | null;

  constructor(
    loadingSelector: string = LOADING_STATE_SELECTOR,
    errorSelector: string = ERROR_STATE_SELECTOR,
    errorMessageSelector: string = ERROR_MESSAGE_SELECTOR,
    contentSelector: string = CONTENT_SELECTOR
  ) {
    this.loadingElement = document.querySelector(loadingSelector);
    this.errorElement = document.querySelector(errorSelector);
    this.errorMessageElement = document.querySelector(errorMessageSelector);
    this.contentElement = document.querySelector(contentSelector);
  }

  /**
   * Transition to loading state and hide other states.
   * Shows spinner and loading message.
   */
  showLoading(): void {
    this.hideAll();
    if (this.loadingElement) {
      this.loadingElement.classList.remove("hidden");
    }
  }

  /**
   * Transition to error state with error message.
   * Shows error icon and message, hides other states.
   * @param message - Error message to display to user
   */
  showError(message: string): void {
    this.hideAll();
    if (this.errorElement) {
      this.errorElement.classList.remove("hidden");
    }
    if (this.errorMessageElement) {
      this.errorMessageElement.textContent = message;
    }
  }

  /**
   * Transition to content state and hide other states.
   * Shows table and toolbar, hides loading and error states.
   */
  showContent(): void {
    this.hideAll();
    if (this.contentElement) {
      (this.contentElement as HTMLElement).style.display = "contents";
    }
  }

  /**
   * Hide all states.
   */
  private hideAll(): void {
    if (this.loadingElement) {
      this.loadingElement.classList.add("hidden");
    }
    if (this.errorElement) {
      this.errorElement.classList.add("hidden");
    }
    if (this.contentElement) {
      (this.contentElement as HTMLElement).style.display = "none";
    }
  }
}
