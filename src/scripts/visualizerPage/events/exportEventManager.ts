import {
  EXPORT_TRIGGER,
  EXPORT_ALL,
  EXPORT_FILTERED,
  EXPORT_WRAPPER,
} from "../utils/domSelectors";

/**
 * Manages export dropdown events.
 * Handles: dropdown toggle, export options, click outside, Escape key.
 * Implements cleanup for View Transitions support.
 */
export class ExportEventManager {
  private listeners: Array<{
    element: HTMLElement | Document | Window;
    type: string;
    handler: EventListener;
  }> = [];

  constructor(
    private triggerSelector: string = EXPORT_TRIGGER,
    private exportAllSelector: string = EXPORT_ALL,
    private exportFilteredSelector: string = EXPORT_FILTERED,
    private wrapperSelector: string = EXPORT_WRAPPER
  ) {}

  /**
   * Setup trigger button click handler (toggle dropdown).
   */
  onTriggerClick(callback: () => void): void {
    const trigger = document.querySelector(
      this.triggerSelector
    ) as HTMLButtonElement | null;
    if (!trigger) return;

    const handler = () => callback();
    trigger.addEventListener("click", handler);
    this.listeners.push({ element: trigger, type: "click", handler });
  }

  /**
   * Setup "Export All" button handler.
   */
  onExportAll(callback: () => void): void {
    const button = document.querySelector(
      this.exportAllSelector
    ) as HTMLButtonElement | null;
    if (!button) return;

    const handler = () => callback();
    button.addEventListener("click", handler);
    this.listeners.push({ element: button, type: "click", handler });
  }

  /**
   * Setup "Export Filtered" button handler.
   */
  onExportFiltered(callback: () => void): void {
    const button = document.querySelector(
      this.exportFilteredSelector
    ) as HTMLButtonElement | null;
    if (!button) return;

    const handler = () => callback();
    button.addEventListener("click", handler);
    this.listeners.push({ element: button, type: "click", handler });
  }

  /**
   * Setup click-outside handler (close dropdown).
   */
  onClickOutside(callback: () => void): void {
    const wrapper = document.querySelector(
      this.wrapperSelector
    ) as HTMLElement | null;
    if (!wrapper) return;

    const handler = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!wrapper.contains(target)) {
        callback();
      }
    };

    document.addEventListener("click", handler);
    this.listeners.push({ element: document, type: "click", handler });
  }

  /**
   * Setup Escape key handler (close dropdown).
   */
  onEscapeKey(callback: () => void): void {
    const handler = (e: Event) => {
      const keyEvent = e as KeyboardEvent;
      if (keyEvent.key === "Escape") {
        callback();
      }
    };

    document.addEventListener("keydown", handler);
    this.listeners.push({ element: document, type: "keydown", handler });
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
