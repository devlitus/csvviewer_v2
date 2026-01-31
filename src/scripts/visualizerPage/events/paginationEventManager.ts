import {
  PAGINATION_FIRST,
  PAGINATION_PREV,
  PAGINATION_NEXT,
  PAGINATION_LAST,
} from "../utils/domSelectors";

/**
 * Manages pagination button click events.
 * Implements cleanup for View Transitions support.
 */
export class PaginationEventManager {
  private listeners: Array<{
    element: HTMLElement;
    type: string;
    handler: EventListener;
  }> = [];

  constructor(
    private firstBtnSelector: string = PAGINATION_FIRST,
    private prevBtnSelector: string = PAGINATION_PREV,
    private nextBtnSelector: string = PAGINATION_NEXT,
    private lastBtnSelector: string = PAGINATION_LAST
  ) {}

  /**
   * Setup first button listener.
   */
  onFirst(callback: () => void): void {
    const btn = document.querySelector(
      this.firstBtnSelector
    ) as HTMLButtonElement | null;
    if (!btn) return;

    const handler = () => callback();
    btn.addEventListener("click", handler);
    this.listeners.push({ element: btn, type: "click", handler });
  }

  /**
   * Setup previous button listener.
   */
  onPrevious(callback: () => void): void {
    const btn = document.querySelector(
      this.prevBtnSelector
    ) as HTMLButtonElement | null;
    if (!btn) return;

    const handler = () => callback();
    btn.addEventListener("click", handler);
    this.listeners.push({ element: btn, type: "click", handler });
  }

  /**
   * Setup next button listener.
   */
  onNext(callback: () => void): void {
    const btn = document.querySelector(
      this.nextBtnSelector
    ) as HTMLButtonElement | null;
    if (!btn) return;

    const handler = () => callback();
    btn.addEventListener("click", handler);
    this.listeners.push({ element: btn, type: "click", handler });
  }

  /**
   * Setup last button listener.
   */
  onLast(callback: () => void): void {
    const btn = document.querySelector(
      this.lastBtnSelector
    ) as HTMLButtonElement | null;
    if (!btn) return;

    const handler = () => callback();
    btn.addEventListener("click", handler);
    this.listeners.push({ element: btn, type: "click", handler });
  }

  /**
   * Cleanup all event listeners.
   */
  cleanup(): void {
    this.listeners.forEach(({ element, type, handler }) => {
      element.removeEventListener(type, handler);
    });
    this.listeners = [];
  }
}
