/**
 * FilesPage Orchestrator (Fase 6: Integración)
 *
 * Central coordinator for all filesPage modules.
 * Manages initialization, state synchronization, and event flow.
 *
 * Architecture:
 * - Core: FileStore, SelectionManager, PaginationManager
 * - Delete: SingleDeleteManager, BatchDeleteManager
 * - Rendering: TableRenderer, PaginationRenderer, SelectionBarRenderer, EmptyStateRenderer
 * - Events: TableEventManager, SelectionEventManager, PaginationEventManager, DeleteEventManager
 */

import { FileStore } from "./core/fileStore.js";
import { SelectionManager } from "./core/selectionManager.js";
import { PaginationManager } from "./core/paginationManager.js";
import { SingleDeleteManager } from "./delete/singleDelete.js";
import { BatchDeleteManager } from "./delete/batchDelete.js";
import { TableRenderer } from "./rendering/tableRenderer.js";
import { PaginationRenderer } from "./rendering/paginationRenderer.js";
import { SelectionBarRenderer } from "./rendering/selectionBarRenderer.js";
import { EmptyStateRenderer } from "./rendering/emptyStateRenderer.js";
import { TableEventManager } from "./events/tableEventManager.js";
import { SelectionEventManager } from "./events/selectionEventManager.js";
import { PaginationEventManager } from "./events/paginationEventManager.js";
import { DeleteEventManager } from "./events/deleteEventManager.js";
import {
  TABLE_BODY_SELECTOR,
  PAGINATION_SELECTOR,
  SELECTION_BAR_SELECTOR,
  EMPTY_STATE_SELECTOR,
  UPLOAD_BUTTON_SELECTOR,
} from "./utils/domSelectors.js";

// Constants
const ITEMS_PER_PAGE = 6;

// Global state - managers and renderers
let fileStore: FileStore;
let selectionManager: SelectionManager;
let paginationManager: PaginationManager;
let singleDeleteManager: SingleDeleteManager;
let batchDeleteManager: BatchDeleteManager;
let tableRenderer: TableRenderer;
let paginationRenderer: PaginationRenderer;
let selectionBarRenderer: SelectionBarRenderer;
let emptyStateRenderer: EmptyStateRenderer;
let tableEventManager: TableEventManager;
let selectionEventManager: SelectionEventManager;
let paginationEventManager: PaginationEventManager;
let deleteEventManager: DeleteEventManager;

// Subscription unsubscribe functions
let unsubscribeList: Array<() => void> = [];

/**
 * Main initialization function for the files page.
 * Called once per page load with cleanup handled by calling cleanup() first.
 */
export async function initFilesPage(): Promise<void> {
  try {
    // Step 1: Instantiate core managers
    fileStore = new FileStore(ITEMS_PER_PAGE);
    selectionManager = new SelectionManager();
    paginationManager = new PaginationManager(ITEMS_PER_PAGE);

    // Step 2: Instantiate delete managers
    singleDeleteManager = new SingleDeleteManager(fileStore);
    batchDeleteManager = new BatchDeleteManager(fileStore);

    // Step 3: Instantiate renderers
    tableRenderer = new TableRenderer(TABLE_BODY_SELECTOR);
    paginationRenderer = new PaginationRenderer(PAGINATION_SELECTOR);
    selectionBarRenderer = new SelectionBarRenderer(SELECTION_BAR_SELECTOR);
    emptyStateRenderer = new EmptyStateRenderer(EMPTY_STATE_SELECTOR);

    // Step 4: Instantiate event managers
    tableEventManager = new TableEventManager(TABLE_BODY_SELECTOR);
    selectionEventManager = new SelectionEventManager(TABLE_BODY_SELECTOR);
    paginationEventManager = new PaginationEventManager(PAGINATION_SELECTOR);
    deleteEventManager = new DeleteEventManager(SELECTION_BAR_SELECTOR);

    // Step 5: Load files from IndexedDB
    await fileStore.loadFiles();

    // Step 6: Render initial UI
    renderUI();

    // Step 7: Connect observables for state changes
    connectObservables();

    // Step 8: Connect event handlers for user interactions
    connectEventHandlers();

    // Step 9: Setup upload button
    setupUploadButton();
  } catch (err) {
    console.error("Failed to initialize files page:", err);
    throw err;
  }
}

/**
 * Cleanup function called before new page load (View Transitions).
 * Removes all listeners and resets state.
 */
export function cleanup(): void {
  // Unsubscribe from all observables
  unsubscribeList.forEach((unsub) => unsub());
  unsubscribeList = [];

  // Cleanup all managers
  if (singleDeleteManager) singleDeleteManager.cleanup();
  if (tableEventManager) tableEventManager.cleanup();
  if (selectionEventManager) selectionEventManager.cleanup();
  if (paginationEventManager) paginationEventManager.cleanup();
  if (deleteEventManager) deleteEventManager.cleanup();

  // Reset state managers
  if (fileStore) fileStore.resetState();
  if (selectionManager) selectionManager.deselectAll();
  if (paginationManager) paginationManager.reset();
}

/**
 * Renders the complete UI based on current state.
 * Coordinates rendering of all UI components.
 */
function renderUI(): void {
  const files = fileStore.getCurrentPageFiles();
  const totalFiles = fileStore.getFiles().length;
  const currentPage = paginationManager.getCurrentPage();
  const totalPages = paginationManager.getTotalPages();
  const selectedCount = selectionManager.getSelectedCount();
  const pendingDeleteId = singleDeleteManager.getPendingDeleteId();

  // Update pagination manager with total items
  paginationManager.setTotalItems(totalFiles);

  // Render table
  tableRenderer.renderTable(
    files,
    new Set(selectionManager.getSelectedIds()),
    pendingDeleteId
  );

  // Render pagination
  const [displayStart, displayEnd] = paginationManager.getDisplayRange(totalFiles);
  paginationRenderer.render(
    currentPage,
    totalPages,
    displayStart,
    displayEnd,
    totalFiles
  );

  // Show/hide selection bar
  if (selectedCount > 0) {
    selectionBarRenderer.show(selectedCount);
  } else {
    selectionBarRenderer.hide();
  }

  // Show/hide empty state
  if (totalFiles === 0) {
    emptyStateRenderer.show();
  } else {
    emptyStateRenderer.hide();
  }

  // Update select-all checkbox state
  updateSelectAllCheckboxState();
}

/**
 * Subscribes to observable changes from managers.
 * When state changes, re-render affected UI components.
 */
function connectObservables(): void {
  // When selection changes
  const unsubSelection = selectionManager.subscribe(() => {
    renderUI();
  });
  unsubscribeList.push(unsubSelection);

  // When single delete state changes
  const unsubSingleDelete = singleDeleteManager.subscribe(() => {
    renderUI();
  });
  unsubscribeList.push(unsubSingleDelete);
}

/**
 * Connects event handlers to manage user interactions.
 * Wires up all event managers to their corresponding manager methods.
 */
function connectEventHandlers(): void {
  // Table: Delete button clicks
  const unsubDeleteClick = tableEventManager.onDeleteClick((fileId) => {
    singleDeleteManager.handleDeleteClick(fileId);
  });
  unsubscribeList.push(unsubDeleteClick);

  // Table: Checkbox changes (individual file selection)
  const unsubCheckboxChange = tableEventManager.onCheckboxChange((fileId) => {
    selectionManager.toggle(fileId);
  });
  unsubscribeList.push(unsubCheckboxChange);

  // Table: Row clicks (navigation to visualizer)
  // Navigation already handled in tableEventManager, just subscribe to clean up
  const unsubRowClick = tableEventManager.onRowClick(() => {
    // Additional logic can be added here if needed in the future
  });
  unsubscribeList.push(unsubRowClick);

  // Selection: Select all checkbox
  const unsubSelectAllChange = selectionEventManager.onSelectAllChange(
    (checked) => {
      if (checked) {
        const pageFiles = fileStore.getCurrentPageFiles();
        selectionManager.selectPage(pageFiles);
      } else {
        const pageFiles = fileStore.getCurrentPageFiles();
        selectionManager.deselectPage(pageFiles);
      }
    }
  );
  unsubscribeList.push(unsubSelectAllChange);

  // Pagination: Page number clicks
  const unsubPageNumberClick = paginationEventManager.onPageNumberClick(
    (pageNumber) => {
      paginationManager.goToPage(pageNumber);
      selectionManager.deselectAll();
      renderUI();
    }
  );
  unsubscribeList.push(unsubPageNumberClick);

  // Pagination: Previous page
  const unsubPrevClick = paginationEventManager.onPrevClick(() => {
    paginationManager.previousPage();
    selectionManager.deselectAll();
    renderUI();
  });
  unsubscribeList.push(unsubPrevClick);

  // Pagination: Next page
  const unsubNextClick = paginationEventManager.onNextClick(() => {
    paginationManager.nextPage();
    selectionManager.deselectAll();
    renderUI();
  });
  unsubscribeList.push(unsubNextClick);

  // Selection bar: Cancel button
  const unsubCancelClick = deleteEventManager.onCancelClick(() => {
    selectionManager.deselectAll();
  });
  unsubscribeList.push(unsubCancelClick);

  // Selection bar: Delete button
  const unsubDeleteSelectedClick = deleteEventManager.onDeleteClick(
    async () => {
      const ids = selectionManager.getSelectedIds();
      if (ids.length === 0) return;

      // Show modal and wait for confirmation
      await batchDeleteManager.deleteSelected(ids);

      // Reload files and re-render
      selectionManager.deselectAll();
      await fileStore.loadFiles();
      renderUI();
    }
  );
  unsubscribeList.push(unsubDeleteSelectedClick);
}

/**
 * Sets up the upload button to navigate to the upload page.
 */
function setupUploadButton(): void {
  const uploadButton = document.querySelector(
    UPLOAD_BUTTON_SELECTOR
  ) as HTMLButtonElement;
  if (uploadButton) {
    uploadButton.addEventListener("click", () => {
      window.location.href = "/";
    });
  }
}

/**
 * Updates the select-all checkbox state based on current page selection.
 * Sets checked/indeterminate based on how many files are selected in the page.
 */
function updateSelectAllCheckboxState(): void {
  const selectAllCheckbox = document.querySelector(
    "[data-select-all-checkbox]"
  ) as HTMLInputElement;
  if (!selectAllCheckbox) return;

  const pageFiles = fileStore.getCurrentPageFiles();
  const selectedState = selectionManager.getPageSelectState(pageFiles);

  if (selectedState === "none") {
    selectAllCheckbox.indeterminate = false;
    selectAllCheckbox.checked = false;
  } else if (selectedState === "all") {
    selectAllCheckbox.indeterminate = false;
    selectAllCheckbox.checked = true;
  } else {
    selectAllCheckbox.indeterminate = true;
    selectAllCheckbox.checked = false;
  }
}
