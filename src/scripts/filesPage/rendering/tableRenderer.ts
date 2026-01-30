import type { CSVFile } from "../../../lib/types.js";
import { renderFileRow, type RowRenderContext } from "../utils/fileFormatting.js";

/**
 * Renders file table HTML elements.
 * Manages the lifecycle of table row rendering and DOM insertion.
 *
 * Responsibilities:
 * - Generating HTML for table rows
 * - Managing table container updates
 * - Handling row state visualization (selected, pending delete)
 */
export class TableRenderer {
  private containerElement: HTMLElement | null = null;

  /**
   * Initializes the renderer with a table body selector.
   * @param containerSelector - CSS selector for table body element (e.g., "[data-file-table-body]")
   */
  constructor(private containerSelector: string) {
    this.containerElement = document.querySelector(
      this.containerSelector
    ) as HTMLElement | null;
  }

  /**
   * Renders a complete table with all files.
   * Clears existing content and inserts new rows based on file state.
   *
   * @param files - Array of CSVFile objects to render
   * @param selectedIds - Set of selected file IDs
   * @param pendingDeleteId - ID of file awaiting deletion confirmation (or null)
   */
  renderTable(
    files: CSVFile[],
    selectedIds: Set<string>,
    pendingDeleteId: string | null
  ): void {
    this.clearTable();

    files.forEach((file) => {
      const rowHtml = this.renderFileRow(file, selectedIds, pendingDeleteId);
      this.containerElement?.insertAdjacentHTML("beforeend", rowHtml);
    });
  }

  /**
   * Clears all rows from the table body.
   * Safely removes all child elements.
   */
  clearTable(): void {
    if (this.containerElement) {
      this.containerElement.innerHTML = "";
    }
  }

  /**
   * Renders a single file row as HTML string.
   * Uses the RowRenderContext to determine visual state (selected, pending delete).
   *
   * @param file - CSVFile object to render
   * @param selectedIds - Set of selected file IDs
   * @param pendingDeleteId - ID of file awaiting deletion confirmation
   * @returns HTML string for the table row (<tr> element)
   */
  private renderFileRow(
    file: CSVFile,
    selectedIds: Set<string>,
    pendingDeleteId: string | null
  ): string {
    const context: RowRenderContext = {
      file,
      isSelected: selectedIds.has(file.id),
      isPendingDelete: pendingDeleteId === file.id,
    };

    return renderFileRow(context);
  }
}
