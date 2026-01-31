import {
  COLUMN_VISIBILITY_LIST,
  COLUMN_VISIBILITY_COUNT,
} from "../utils/domSelectors";

/**
 * Renders the column visibility dropdown list and updates the badge count.
 */
export class ColumnVisibilityRenderer {
  private listContainer: HTMLElement | null;
  private countElement: HTMLElement | null;

  constructor(
    listSelector: string = COLUMN_VISIBILITY_LIST,
    countSelector: string = COLUMN_VISIBILITY_COUNT
  ) {
    this.listContainer = document.querySelector(listSelector);
    if (!this.listContainer) {
      console.warn(
        `[ColumnVisibilityRenderer] List container not found for selector: "${listSelector}"`
      );
    }
    this.countElement = document.querySelector(countSelector);
    if (!this.countElement) {
      console.warn(
        `[ColumnVisibilityRenderer] Count element not found for selector: "${countSelector}"`
      );
    }
  }

  /**
   * Render the list of column checkboxes.
   * @param allColumns - All available column names
   * @param visibleSet - Set of currently visible column names
   */
  renderList(allColumns: string[], visibleSet: Set<string>): void {
    if (!this.listContainer) return;

    // Clear existing list
    this.listContainer.innerHTML = "";

    // Create checkbox items for each column
    allColumns.forEach((column) => {
      const isChecked = visibleSet.has(column);
      const label = document.createElement("label");
      label.setAttribute("data-column-item", column);
      label.className =
        "px-3 py-2 hover:bg-white/5 cursor-pointer flex items-center gap-2 text-sm text-text-off-white transition-colors";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.setAttribute("data-column-check", column);
      checkbox.checked = isChecked;
      checkbox.className = "accent-vibrant-blue cursor-pointer";

      const columnName = document.createTextNode(column);

      label.appendChild(checkbox);
      label.appendChild(columnName);
      this.listContainer!.appendChild(label);
    });
  }

  /**
   * Update the visibility count badge.
   * @param visible - Number of visible columns
   * @param total - Total number of columns
   */
  updateCount(visible: number, total: number): void {
    if (this.countElement) {
      this.countElement.textContent = `${visible}/${total}`;
    }
  }

  /**
   * Update a single checkbox without re-rendering the entire list.
   * @param column - Column name
   * @param checked - New checked state
   */
  updateCheckbox(column: string, checked: boolean): void {
    const checkbox = document.querySelector(
      `[data-column-check="${column}"]`
    ) as HTMLInputElement | null;
    if (checkbox) {
      checkbox.checked = checked;
    }
  }
}
