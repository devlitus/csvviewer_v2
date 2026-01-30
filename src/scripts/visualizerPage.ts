import type { CSVFile } from "../lib/types";
import { getFile } from "../lib/indexeddb";
import { parseCSVString } from "../lib/csvParser";
import { formatFileSize, formatRelativeDate } from "../lib/formatters";
import { onPageLoad, onBeforeSwap } from "../lib/pageInit";

// Selectors
const LOADING_STATE_SELECTOR = "[data-loading-state]";
const ERROR_STATE_SELECTOR = "[data-error-state]";
const ERROR_MESSAGE_SELECTOR = "[data-error-message]";
const TABLE_CONTAINER_SELECTOR = "[data-csv-table-container]";
const TABLE_BODY_SELECTOR = "[data-csv-table-body]";
const TABLE_HEADER_SELECTOR = "[data-table-header]";
const HEADER_FILENAME_SELECTOR = "[data-filename]";
const TOOLBAR_SELECTOR = "[data-toolbar-counters]";
const SHOWING_ROWS_SELECTOR = "[data-showing-rows]";
const TOTAL_RECORDS_SELECTOR = "[data-total-records]";
const PAGINATION_SELECTOR = "[data-pagination-container]";
const CURRENT_PAGE_SELECTOR = "[data-current-page]";
const TOTAL_PAGES_SELECTOR = "[data-total-pages]";
const ROWS_PER_PAGE_SELECT = "[data-rows-per-page]";
const PAGINATION_FIRST = "[data-pagination-first]";
const PAGINATION_PREV = "[data-pagination-prev]";
const PAGINATION_NEXT = "[data-pagination-next]";
const PAGINATION_LAST = "[data-pagination-last]";

// Pagination state
interface PaginationState {
  currentPage: number;
  rowsPerPage: number;
  totalRows: number;
  totalPages: number;
}

let paginationState: PaginationState = {
  currentPage: 1,
  rowsPerPage: 50,
  totalRows: 0,
  totalPages: 0,
};

let allData: Record<string, string>[] = [];
let columns: string[] = [];

/**
 * Initialize visualizer page
 */
async function initVisualizerPage(): Promise<void> {
  try {
    // Hide error state and show loading state
    showLoadingState();

    // Get file ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const fileId = urlParams.get("file");

    if (!fileId) {
      showErrorState("No file specified. Please select a file to visualize.");
      return;
    }

    // Load file from IndexedDB
    const file = await loadFileData(fileId);
    if (!file) {
      showErrorState("File not found. The file may have been deleted.");
      return;
    }

    // Parse CSV content
    const parseResult = parseCSVString(file.content);
    if (parseResult.error) {
      showErrorState(`Error parsing CSV: ${parseResult.error}`);
      return;
    }

    // Check if file has data
    if (parseResult.data.length === 0) {
      showErrorState("This CSV file has no data rows.");
      return;
    }

    // Store data globally
    allData = parseResult.data;
    paginationState.totalRows = parseResult.rowCount;
    paginationState.totalPages = Math.ceil(
      paginationState.totalRows / paginationState.rowsPerPage
    );
    paginationState.currentPage = 1;

    // Extract columns from first row
    columns = Object.keys(allData[0]);

    // Update UI
    updateHeader(file.filename);
    renderTableHeader(columns);
    renderTableBody(columns, allData, 1);
    updateToolbar(
      Math.min(paginationState.rowsPerPage, paginationState.totalRows),
      paginationState.totalRows
    );
    updatePagination();

    // Setup event listeners
    setupPaginationEvents();
    setupRowsPerPageChange();

    // Hide loading state
    hideLoadingState();
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    showErrorState(`An error occurred: ${errorMsg}`);
  }
}

/**
 * Load file from IndexedDB
 */
async function loadFileData(fileId: string): Promise<CSVFile | null> {
  try {
    const file = await getFile(fileId);
    return file || null;
  } catch (err) {
    console.error("Error loading file from IndexedDB:", err);
    return null;
  }
}

/**
 * Render table header with dynamic columns
 */
function renderTableHeader(columns: string[]): void {
  const headerElement = document.querySelector(TABLE_HEADER_SELECTOR);
  if (!headerElement) return;

  const headerHTML = `
    <tr class="border-b border-border-dark">
      ${columns
        .map((col) => {
          return `
        <th
          scope="col"
          class="px-6 py-4 font-semibold text-text-light-gray border-b border-border-dark text-left hover:text-text-off-white cursor-pointer transition-colors"
          aria-label="Sort by ${col}"
        >
          <div class="flex items-center gap-2">
            ${escapeHtml(col)}
            <span class="material-symbols-outlined text-sm">unfold_more</span>
          </div>
        </th>
      `;
        })
        .join("")}
      <th class="px-6 py-4 w-12 text-right"></th>
    </tr>
  `;

  headerElement.innerHTML = headerHTML;
}

/**
 * Render table body with paginated data
 */
function renderTableBody(
  columns: string[],
  data: Record<string, string>[],
  page: number
): void {
  const tbody = document.querySelector(TABLE_BODY_SELECTOR);
  if (!tbody) return;

  const startIndex = (page - 1) * paginationState.rowsPerPage;
  const endIndex = startIndex + paginationState.rowsPerPage;
  const paginatedData = data.slice(startIndex, endIndex);

  const rowsHTML = paginatedData
    .map((row, index) => {
      const bgClass = index % 2 === 0 ? "bg-background-dark" : "bg-surface-card/20";
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
          <td class="px-6 py-3.5 text-sm text-right">
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

  tbody.innerHTML = rowsHTML || "";
}

/**
 * Update header with filename
 */
function updateHeader(filename: string): void {
  const headerEl = document.querySelector(HEADER_FILENAME_SELECTOR);
  if (headerEl) {
    headerEl.textContent = filename;
  }
}

/**
 * Update toolbar counters
 */
function updateToolbar(showingRows: number, totalRecords: number): void {
  const showingEl = document.querySelector(SHOWING_ROWS_SELECTOR);
  const totalEl = document.querySelector(TOTAL_RECORDS_SELECTOR);

  if (showingEl) {
    showingEl.textContent = showingRows.toString();
  }
  if (totalEl) {
    totalEl.textContent = totalRecords.toLocaleString();
  }
}

/**
 * Update pagination display
 */
function updatePagination(): void {
  const currentPageEl = document.querySelector(CURRENT_PAGE_SELECTOR);
  const totalPagesEl = document.querySelector(TOTAL_PAGES_SELECTOR);
  const firstBtn = document.querySelector(PAGINATION_FIRST) as HTMLButtonElement;
  const prevBtn = document.querySelector(PAGINATION_PREV) as HTMLButtonElement;
  const nextBtn = document.querySelector(PAGINATION_NEXT) as HTMLButtonElement;
  const lastBtn = document.querySelector(PAGINATION_LAST) as HTMLButtonElement;

  if (currentPageEl) {
    currentPageEl.textContent = paginationState.currentPage.toString();
  }
  if (totalPagesEl) {
    totalPagesEl.textContent = paginationState.totalPages.toString();
  }

  // Disable buttons at boundaries
  if (firstBtn) {
    firstBtn.disabled = paginationState.currentPage === 1;
  }
  if (prevBtn) {
    prevBtn.disabled = paginationState.currentPage === 1;
  }
  if (nextBtn) {
    nextBtn.disabled = paginationState.currentPage === paginationState.totalPages;
  }
  if (lastBtn) {
    lastBtn.disabled = paginationState.currentPage === paginationState.totalPages;
  }
}

/**
 * Setup pagination event listeners
 */
function setupPaginationEvents(): void {
  const firstBtn = document.querySelector(PAGINATION_FIRST);
  const prevBtn = document.querySelector(PAGINATION_PREV);
  const nextBtn = document.querySelector(PAGINATION_NEXT);
  const lastBtn = document.querySelector(PAGINATION_LAST);

  firstBtn?.addEventListener("click", () => {
    paginationState.currentPage = 1;
    renderTableBody(columns, allData, paginationState.currentPage);
    updatePagination();
    scrollToTable();
  });

  prevBtn?.addEventListener("click", () => {
    if (paginationState.currentPage > 1) {
      paginationState.currentPage--;
      renderTableBody(columns, allData, paginationState.currentPage);
      updatePagination();
      scrollToTable();
    }
  });

  nextBtn?.addEventListener("click", () => {
    if (paginationState.currentPage < paginationState.totalPages) {
      paginationState.currentPage++;
      renderTableBody(columns, allData, paginationState.currentPage);
      updatePagination();
      scrollToTable();
    }
  });

  lastBtn?.addEventListener("click", () => {
    paginationState.currentPage = paginationState.totalPages;
    renderTableBody(columns, allData, paginationState.currentPage);
    updatePagination();
    scrollToTable();
  });
}

/**
 * Setup rows per page change
 */
function setupRowsPerPageChange(): void {
  const select = document.querySelector(ROWS_PER_PAGE_SELECT) as HTMLSelectElement;
  if (!select) return;

  select.addEventListener("change", (e) => {
    const newValue = parseInt((e.target as HTMLSelectElement).value, 10);
    paginationState.rowsPerPage = newValue;
    paginationState.totalPages = Math.ceil(
      paginationState.totalRows / paginationState.rowsPerPage
    );
    paginationState.currentPage = 1;

    renderTableBody(columns, allData, paginationState.currentPage);
    updateToolbar(
      Math.min(paginationState.rowsPerPage, paginationState.totalRows),
      paginationState.totalRows
    );
    updatePagination();
    scrollToTable();
  });
}

/**
 * Scroll to table after pagination change
 */
function scrollToTable(): void {
  const table = document.querySelector(TABLE_CONTAINER_SELECTOR);
  if (table) {
    table.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/**
 * Show loading state
 */
function showLoadingState(): void {
  const loadingEl = document.querySelector(LOADING_STATE_SELECTOR);
  const headerEl = document.querySelector(HEADER_FILENAME_SELECTOR);
  const toolbarEl = document.querySelector(TOOLBAR_SELECTOR);
  const tableEl = document.querySelector(TABLE_CONTAINER_SELECTOR);

  if (loadingEl) {
    loadingEl.classList.remove("hidden");
  }
  if (headerEl) {
    headerEl.closest("header")?.classList.add("hidden");
  }
  if (toolbarEl) {
    toolbarEl.closest("div")?.classList.add("hidden");
  }
  if (tableEl) {
    tableEl.classList.add("hidden");
  }
}

/**
 * Hide loading state
 */
function hideLoadingState(): void {
  const loadingEl = document.querySelector(LOADING_STATE_SELECTOR);
  const headerEl = document.querySelector(HEADER_FILENAME_SELECTOR);
  const toolbarEl = document.querySelector(TOOLBAR_SELECTOR);
  const tableEl = document.querySelector(TABLE_CONTAINER_SELECTOR);

  if (loadingEl) {
    loadingEl.classList.add("hidden");
  }
  if (headerEl) {
    headerEl.closest("header")?.classList.remove("hidden");
  }
  if (toolbarEl) {
    toolbarEl.closest("div")?.classList.remove("hidden");
  }
  if (tableEl) {
    tableEl.classList.remove("hidden");
  }
}

/**
 * Show error state
 */
function showErrorState(message: string): void {
  const errorEl = document.querySelector(ERROR_STATE_SELECTOR);
  const msgEl = document.querySelector(ERROR_MESSAGE_SELECTOR);
  const loadingEl = document.querySelector(LOADING_STATE_SELECTOR);
  const headerEl = document.querySelector(HEADER_FILENAME_SELECTOR);
  const toolbarEl = document.querySelector(TOOLBAR_SELECTOR);
  const tableEl = document.querySelector(TABLE_CONTAINER_SELECTOR);

  if (errorEl) {
    errorEl.classList.remove("hidden");
  }
  if (msgEl) {
    msgEl.textContent = message;
  }
  if (loadingEl) {
    loadingEl.classList.add("hidden");
  }
  if (headerEl) {
    headerEl.closest("header")?.classList.add("hidden");
  }
  if (toolbarEl) {
    toolbarEl.closest("div")?.classList.add("hidden");
  }
  if (tableEl) {
    tableEl.classList.add("hidden");
  }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

// Initialize on page load with View Transitions support
onPageLoad(() => {
  initVisualizerPage();
});

// Cleanup on before swap
onBeforeSwap(() => {
  allData = [];
  columns = [];
  paginationState = {
    currentPage: 1,
    rowsPerPage: 50,
    totalRows: 0,
    totalPages: 0,
  };
});
