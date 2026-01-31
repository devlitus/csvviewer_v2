import { TABLE_HEADER_SELECTOR, TABLE_BODY_SELECTOR } from "../utils/domSelectors";
import { escapeHtml } from "../../../lib/htmlUtils";

/**
 * Renders CSV table header and body.
 * Manages DOM updates for data visualization.
 */
export class TableRenderer {
  private headerElement: HTMLElement | null;
  private bodyElement: HTMLElement | null;

  constructor(
    headerSelector: string = TABLE_HEADER_SELECTOR,
    bodySelector: string = TABLE_BODY_SELECTOR
  ) {
    this.headerElement = document.querySelector(headerSelector);
    if (!this.headerElement) {
      console.warn(
        `[TableRenderer] Header element not found. Selector: "${headerSelector}". ` +
          `Table will not render until element is available.`
      );
    }
    this.bodyElement = document.querySelector(bodySelector);
    if (!this.bodyElement) {
      console.warn(
        `[TableRenderer] Body element not found. Selector: "${bodySelector}". ` +
          `Table will not render until element is available.`
      );
    }
  }

  /**
   * Render table header with dynamic columns.
   */
  renderHeader(columns: string[]): void {
    if (!this.headerElement) return;

    const headerHTML = `
      <tr class="border-b border-border-dark">
        ${columns
          .map((col) => {
            return `
          <th
            scope="col"
            class="px-6 py-4 font-semibold text-text-light-gray border-b border-border-dark text-left hover:text-text-off-white transition-colors"
          >
            <div class="flex items-center gap-2">
              ${escapeHtml(col)}
              <span class="material-symbols-outlined text-sm text-text-light-gray/50">unfold_more</span>
            </div>
          </th>
        `;
          })
          .join("")}
        <th class="px-6 py-4 w-12 text-right"></th>
      </tr>
    `;

    this.headerElement.innerHTML = headerHTML;
  }

  /**
   * Render table body with paginated data.
   */
  renderBody(
    columns: string[],
    rows: Record<string, string>[],
    startIndex: number,
    endIndex: number
  ): void {
    if (!this.bodyElement) return;

    const paginatedRows = rows.slice(startIndex, endIndex);

    const rowsHTML = paginatedRows
      .map((row, index) => {
        const bgClass =
          index % 2 === 0 ? "bg-background-dark" : "bg-surface-card/20";
        const cells = columns
          .map((col) => {
            const value = row[col] || "";
            return `
            <td class="px-6 py-3.5 text-sm text-text-off-white">
              ${escapeHtml(value)}
            </td>
          `;
          })
          .join("");

        return `
          <tr class="${bgClass} hover:bg-surface-card/40 transition-colors border-b border-border-dark/30 group">
            ${cells}
            <td class="px-6 py-3.5 text-sm text-right w-12">
              <button
                class="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
                aria-label="Edit row"
              >
                <span class="material-symbols-outlined text-base">edit</span>
              </button>
            </td>
          </tr>
        `;
      })
      .join("");

    this.bodyElement.innerHTML = rowsHTML || "";
  }
}
