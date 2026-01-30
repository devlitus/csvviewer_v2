/**
 * Renders empty state visibility.
 * Manages showing/hiding the "no files" message.
 *
 * Responsibilities:
 * - Toggling empty state visibility
 * - Managing opacity and pointer events
 */
export class EmptyStateRenderer {
  private element: HTMLElement | null = null;

  /**
   * Initializes the renderer with an empty state selector.
   * @param selector - CSS selector for empty state element (e.g., "[data-empty-state]")
   */
  constructor(private selector: string) {
    this.element = document.querySelector(this.selector) as HTMLElement | null;
  }

  /**
   * Shows the empty state message.
   * Removes opacity-0 and pointer-events-none classes.
   */
  show(): void {
    if (!this.element) return;

    this.element.classList.remove("opacity-0", "pointer-events-none");
  }

  /**
   * Hides the empty state message.
   * Adds opacity-0 and pointer-events-none classes.
   */
  hide(): void {
    if (!this.element) return;

    this.element.classList.add("opacity-0", "pointer-events-none");
  }
}
