import {
  COLUMN_VISIBILITY_TRIGGER,
  COLUMN_VISIBILITY_LIST,
  COLUMN_SELECT_ALL,
  COLUMN_DESELECT_ALL,
} from "../utils/domSelectors";

/**
 * Manages column visibility dropdown events.
 * Handles: dropdown toggle, checkbox changes, Select All/Deselect All, click outside, Escape key.
 * Implements cleanup for View Transitions support.
 */
export class ColumnVisibilityEventManager {
  private listeners: Array<{
    element: HTMLElement | Document | Window;
    type: string;
    handler: EventListener;
  }> = [];

  constructor(
    private triggerSelector: string = COLUMN_VISIBILITY_TRIGGER,
    private listSelector: string = COLUMN_VISIBILITY_LIST,
    private selectAllSelector: string = COLUMN_SELECT_ALL,
    private deselectAllSelector: string = COLUMN_DESELECT_ALL
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
   * Setup checkbox change handlers.
   */
  onCheckboxChange(callback: (column: string) => void): void {
    const list = document.querySelector(this.listSelector) as HTMLElement | null;
    if (!list) return;

    const handler = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.hasAttribute("data-column-check")) {
        const column = target.getAttribute("data-column-check");
        if (column) {
          callback(column);
        }
      }
    };

    list.addEventListener("change", handler);
    this.listeners.push({ element: list, type: "change", handler });
  }

  /**
   * Setup Select All button handler.
   */
  onSelectAll(callback: () => void): void {
    const button = document.querySelector(
      this.selectAllSelector
    ) as HTMLButtonElement | null;
    if (!button) return;

    const handler = () => callback();
    button.addEventListener("click", handler);
    this.listeners.push({ element: button, type: "click", handler });
  }

  /**
   * Setup Deselect All button handler.
   */
  onDeselectAll(callback: () => void): void {
    const button = document.querySelector(
      this.deselectAllSelector
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
      "[data-column-visibility-wrapper]"
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
