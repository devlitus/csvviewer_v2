/**
 * Visualizer Page Orchestrator
 *
 * Coordinates all modules to implement CSV visualization.
 *
 * Architecture:
 * - Core managers handle state (DataStore, PaginationManager)
 * - Renderers generate HTML and update DOM
 * - Event managers handle user interactions
 * - UI StateManager handles loading/error/content states
 * - Utils provide data loading and DOM selectors
 *
 * Flow:
 * 1. initVisualizerPage() shows loading state
 * 2. loadAndParseFile() fetches and parses CSV
 * 3. DataStore stores parsed data
 * 4. Renderers draw initial state
 * 5. Event managers setup interactions
 * 6. User actions → update managers → re-render
 *
 * View Transitions:
 * - cleanup() called on page change to reset state
 * - onPageLoad() called on page load to reinitialize
 */

import { DataStore, PaginationManager } from "./core";
import {
  TableRenderer,
  ToolbarRenderer,
  PaginationRenderer,
  HeaderRenderer,
} from "./rendering";
import {
  PaginationEventManager,
  RowsPerPageEventManager,
} from "./events";
import { UIStateManager } from "./ui";
import { loadAndParseFile } from "./utils/dataLoader";
import { CONFIG } from "./config";
import { onPageLoad, onBeforeSwap } from "../../lib/pageInit";

// Managers (instantiated in init)
let dataStore: DataStore;
let paginationManager: PaginationManager;
let tableRenderer: TableRenderer;
let toolbarRenderer: ToolbarRenderer;
let paginationRenderer: PaginationRenderer;
let headerRenderer: HeaderRenderer;
let paginationEvents: PaginationEventManager;
let rowsPerPageEvents: RowsPerPageEventManager;
let uiState: UIStateManager;

/**
 * Initialize visualizer page
 */
async function initVisualizerPage(): Promise<void> {
  try {
    // Instantiate managers
    dataStore = new DataStore();
    paginationManager = new PaginationManager(CONFIG.DEFAULT_ROWS_PER_PAGE);
    tableRenderer = new TableRenderer();
    toolbarRenderer = new ToolbarRenderer();
    paginationRenderer = new PaginationRenderer();
    headerRenderer = new HeaderRenderer();
    paginationEvents = new PaginationEventManager();
    rowsPerPageEvents = new RowsPerPageEventManager();
    uiState = new UIStateManager();

    // Show loading state
    uiState.showLoading();

    // Get fileId from URL
    const urlParams = new URLSearchParams(window.location.search);
    const fileId = urlParams.get("file");

    // Validate fileId
    if (!fileId) {
      uiState.showError("No file specified. Please select a file to visualize.");
      return;
    }

    // Load and parse file
    const result = await loadAndParseFile(fileId);

    if (!result.success) {
      uiState.showError(result.error);
      return;
    }

    // Store data
    dataStore.setData(result.file, result.columns, result.rows);
    paginationManager.setTotalRows(result.rowCount);

    // Render UI
    renderUI();

    // Setup events
    setupEvents();

    // Show content
    uiState.showContent();
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("Visualizer initialization error:", err);
    uiState.showError(`An error occurred: ${errorMsg}`);
  }
}

/**
 * Render all UI components
 */
function renderUI(): void {
  const columns = dataStore.getColumns();
  const rows = dataStore.getRows();
  const filename = dataStore.getFilename();
  const currentPage = paginationManager.getCurrentPage();
  const [startIndex, endIndex] = paginationManager.getPageRange();
  const totalPages = paginationManager.getTotalPages();
  const totalRows = dataStore.getTotalRows();

  // Render header
  headerRenderer.updateFilename(filename);

  // Render table
  tableRenderer.renderHeader(columns);
  tableRenderer.renderBody(columns, rows, startIndex, endIndex);

  // Render toolbar
  const [displayStart, displayEnd] = paginationManager.getDisplayRange();
  const showingRows = displayEnd - displayStart + 1;
  toolbarRenderer.update(
    displayEnd === 0 ? 0 : showingRows,
    totalRows
  );

  // Render pagination
  paginationRenderer.update(currentPage, totalPages);
}

/**
 * Setup event listeners
 */
function setupEvents(): void {
  // Pagination events
  paginationEvents.onFirst(() => {
    paginationManager.goToFirst();
    rerenderAfterPageChange();
  });

  paginationEvents.onPrevious(() => {
    paginationManager.goToPrevious();
    rerenderAfterPageChange();
  });

  paginationEvents.onNext(() => {
    paginationManager.goToNext();
    rerenderAfterPageChange();
  });

  paginationEvents.onLast(() => {
    paginationManager.goToLast();
    rerenderAfterPageChange();
  });

  // Rows per page event
  rowsPerPageEvents.onChange((newValue) => {
    paginationManager.setRowsPerPage(newValue);
    rerenderAfterPageChange();
  });
}

/**
 * Re-render after page change with scroll
 */
function rerenderAfterPageChange(): void {
  renderUI();
  scrollToTable();
}

/**
 * Scroll to table after pagination change
 */
function scrollToTable(): void {
  const table = document.querySelector("[data-csv-table-container]");
  if (table) {
    table.scrollIntoView({
      behavior: CONFIG.SCROLL_BEHAVIOR,
      block: "start",
    });
  }
}

/**
 * Cleanup all resources
 */
function cleanup(): void {
  // Cleanup event managers
  paginationEvents?.cleanup();
  rowsPerPageEvents?.cleanup();

  // Reset stores
  dataStore?.clear();
}

// Lifecycle hooks
onPageLoad(() => {
  initVisualizerPage();
});

onBeforeSwap(() => {
  cleanup();
});
