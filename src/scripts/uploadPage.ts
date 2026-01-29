import type { CSVFile } from "../lib/types";
import { saveFile, getAllFiles } from "../lib/indexeddb";
import { parseCSVString } from "../lib/csvParser";
import { onPageLoad, onBeforeSwap } from "../lib/pageInit";

const UPLOAD_ZONE_SELECTOR = "[data-upload-zone]";
const FILE_INPUT_SELECTOR = "#file-upload-input";
const UPLOAD_CONTENT_SELECTOR = "[data-upload-content]";
const UPLOAD_ERROR_SELECTOR = "[data-upload-error]";
const ERROR_MESSAGE_SELECTOR = "[data-error-message]";
const RECENT_FILES_GRID_SELECTOR = "[data-recent-files-grid]";
const EMPTY_STATE_SELECTOR = "[data-empty-state]";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ERROR_AUTO_HIDE_DELAY = 5000; // 5 seconds
let IDLE_STATE_HTML: string = "";

// Track event listeners for cleanup
let dragDropListeners: { element: HTMLElement; listeners: Array<[string, EventListener]> } | null = null;
let fileChangeListener: EventListener | null = null;
let browseButtonListener: { element: HTMLElement; listener: EventListener } | null = null;

interface ErrorScenario {
  condition: (file: File) => boolean;
  message: string;
}

// Error scenarios to check
const errorScenarios: ErrorScenario[] = [
  {
    condition: (file: File) => !file.name.toLowerCase().endsWith(".csv"),
    message: "Only .csv files are supported",
  },
  {
    condition: (file: File) => file.size > MAX_FILE_SIZE,
    message: "File exceeds the 10MB limit",
  },
  {
    condition: (file: File) => file.size === 0,
    message: "The file is empty",
  },
];

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + sizes[i];
}

function formatRelativeDate(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  if (days < 7) return `${days} day${days !== 1 ? "s" : ""} ago`;

  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

function renderFileCard(file: CSVFile): string {
  const size = formatFileSize(file.size);
  const date = formatRelativeDate(file.uploadDate);
  const iconColorClass = "bg-green-500/10 text-green-400";

  // Escape HTML special characters to prevent XSS
  const escapeHtml = (text: string): string => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
  };

  const escapedFilename = escapeHtml(file.filename);
  const escapedSize = escapeHtml(size);
  const escapedDate = escapeHtml(date);

  const cardElement = `
    <div data-file-card class="bg-surface-card border border-border-dark rounded-xl p-4 hover:border-vibrant-blue transition-all duration-300 group cursor-pointer animate-in fade-in slide-in-from-bottom-2" data-file-id="${escapeHtml(file.id)}">
      <div class="flex items-start justify-between mb-3">
        <div class="${iconColorClass} w-10 h-10 rounded-lg flex items-center justify-center">
          <span class="material-symbols-outlined text-lg">table_view</span>
        </div>
        <button class="p-1 rounded-lg hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100">
          <span class="material-symbols-outlined text-text-light-gray text-lg">more_vert</span>
        </button>
      </div>
      <h3 class="font-semibold text-text-off-white mb-2 group-hover:text-vibrant-blue transition-colors line-clamp-1">
        ${escapedFilename}
      </h3>
      <p class="text-xs text-text-light-gray mb-4">
        ${escapedSize} · ${escapedDate}
      </p>
      <div class="flex items-center justify-between pt-3 border-t border-border-dark">
        <div class="flex items-center gap-1">
          <span class="material-symbols-outlined text-sm text-green-400">check_circle</span>
          <span class="text-xs font-medium text-green-400">Processed</span>
        </div>
        <span class="text-xs text-vibrant-blue font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          Open File
        </span>
      </div>
    </div>
  `;

  // Enqueue navigation listener for when DOM is ready
  setTimeout(() => {
    const cardElement = document.querySelector(`[data-file-id="${file.id}"]`) as HTMLElement;
    if (cardElement) {
      cardElement.addEventListener('click', () => {
        window.location.href = `/visualizer?file=${file.id}`;
      });
    }
  }, 0);

  return cardElement;
}

function showError(message: string): void {
  const errorContainer = document.querySelector(UPLOAD_ERROR_SELECTOR);
  const errorMessage = document.querySelector(ERROR_MESSAGE_SELECTOR);

  if (!errorContainer || !errorMessage) return;

  errorMessage.textContent = message;
  errorContainer.classList.remove("hidden");

  setTimeout(() => {
    errorContainer.classList.add("hidden");
  }, ERROR_AUTO_HIDE_DELAY);
}

function showSuccessToast(message: string): void {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded animate-in fade-in';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

async function showLoadingState(): Promise<void> {
  const uploadZone = document.querySelector(UPLOAD_ZONE_SELECTOR);
  const uploadContent = document.querySelector(UPLOAD_CONTENT_SELECTOR);

  if (!uploadZone || !uploadContent) return;

  // Save original HTML on first load
  if (!IDLE_STATE_HTML) {
    IDLE_STATE_HTML = uploadContent.innerHTML;
  }

  uploadZone.classList.add("loading");
  uploadZone.setAttribute('aria-busy', 'true');

  const spinnerHTML = `
    <div class="flex flex-col items-center justify-center w-full">
      <div class="w-12 h-12 border-4 border-vibrant-blue/20 border-t-vibrant-blue rounded-full animate-spin mb-4"></div>
      <p class="text-text-light-gray">Processing file...</p>
    </div>
  `;

  uploadContent.innerHTML = spinnerHTML;
}

function setupBrowseButton(uploadZone: HTMLElement, fileInput: HTMLInputElement): void {
  const browseButton = uploadZone.querySelector('button[type="button"]') as HTMLButtonElement;
  if (!browseButton) return;

  const clickHandler = (e: Event) => {
    e.preventDefault();
    fileInput.click();
  };

  browseButton.addEventListener('click', clickHandler);
  browseButtonListener = { element: browseButton, listener: clickHandler };
}

async function restoreIdleState(): Promise<void> {
  const uploadZone = document.querySelector(UPLOAD_ZONE_SELECTOR);
  const uploadContent = document.querySelector(UPLOAD_CONTENT_SELECTOR);
  const fileInput = document.querySelector(FILE_INPUT_SELECTOR) as HTMLInputElement;

  if (!uploadZone || !uploadContent || !fileInput) return;

  uploadZone.classList.remove("loading", "drag-over");
  uploadZone.removeAttribute('aria-busy');

  // Restore from saved HTML or fall back to default
  if (IDLE_STATE_HTML) {
    uploadContent.innerHTML = IDLE_STATE_HTML;
  } else {
    uploadContent.innerHTML = `
      <div class="flex flex-col items-center justify-center w-full">
        <div class="w-16 h-16 bg-vibrant-blue/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
          <span class="material-symbols-outlined text-vibrant-blue text-5xl">cloud_upload</span>
        </div>
        <div class="text-center mb-4">
          <h3 class="text-xl font-semibold text-text-off-white mb-1">
            Drag & drop your CSV here
          </h3>
          <p class="text-text-light-gray">
            or click to browse from your computer
          </p>
        </div>
        <div class="flex gap-4 mb-6 flex-wrap justify-center">
          <div class="px-3 py-1 bg-surface-card rounded-full text-xs text-text-light-gray border border-border-dark">
            Supports: .csv
          </div>
          <div class="px-3 py-1 bg-surface-card rounded-full text-xs text-text-light-gray border border-border-dark">
            Max 10MB
          </div>
        </div>
        <button type="button" class="px-6 py-2.5 bg-vibrant-blue hover:bg-primary text-white font-semibold rounded-lg transition-colors">
          Browse Files
        </button>
      </div>
    `;
  }

  // Re-attach browse button listener after HTML restoration
  setupBrowseButton(fileInput);
}

function updateEmptyState(): void {
  const grid = document.querySelector(RECENT_FILES_GRID_SELECTOR);
  const emptyState = document.querySelector(EMPTY_STATE_SELECTOR);

  if (!grid || !emptyState) return;

  const hasCards = grid.querySelectorAll('[data-file-card]').length > 0;
  if (hasCards) {
    emptyState.classList.add("hidden");
  } else {
    emptyState.classList.remove("hidden");
  }
}

async function processFile(file: File): Promise<void> {
  // Check error scenarios
  for (const scenario of errorScenarios) {
    if (scenario.condition(file)) {
      showError(scenario.message);
      return;
    }
  }

  // Validate MIME type
  const mimeValid = file.type === 'text/csv' || file.type === 'application/csv' || file.type === '';
  if (!mimeValid) {
    showError("Only .csv files are supported");
    return;
  }

  await showLoadingState();

  try {
    const content = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Could not read the file"));
        }
      };
      reader.onerror = () => {
        const errorMsg = reader.error instanceof DOMException
          ? `Permission denied: ${reader.error.name}`
          : "Could not read the file";
        reject(new Error(errorMsg));
      };
      reader.readAsText(file);
    });

    // Validate CSV content
    const parseResult = parseCSVString(content);
    if (parseResult.error) {
      if (parseResult.error === "File is empty") {
        showError("The file is empty");
      } else if (parseResult.error === "No data rows found") {
        showError("No data rows found in the CSV");
      } else {
        showError(parseResult.error);
      }
      await restoreIdleState();
      return;
    }

    // Validate rowCount after successful parse
    if (parseResult.rowCount === 0) {
      showError("No data rows found in the CSV");
      await restoreIdleState();
      return;
    }

    // Create CSVFile object
    const csvFile: CSVFile = {
      id: crypto.randomUUID(),
      filename: file.name,
      content,
      size: file.size,
      uploadDate: Date.now(),
    };

    // Save to IndexedDB
    try {
      await saveFile(csvFile);
    } catch (err) {
      showError("Could not save file. Storage may be full.");
      await restoreIdleState();
      return;
    }

    // Restore idle state
    await restoreIdleState();

    // Render new card in the grid
    const grid = document.querySelector(RECENT_FILES_GRID_SELECTOR);
    if (grid) {
      const cardHTML = renderFileCard(csvFile);
      grid.insertAdjacentHTML("afterbegin", cardHTML);
      updateEmptyState();
      showSuccessToast("File uploaded successfully");
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "An error occurred";
    showError(errorMessage);
    await restoreIdleState();
  }
}

function cleanupUploadZone(): void {
  // Remove previously attached listeners to prevent duplicates
  if (dragDropListeners) {
    const { element, listeners } = dragDropListeners;
    listeners.forEach(([event, handler]) => {
      element.removeEventListener(event, handler);
    });
  }
  dragDropListeners = null;

  if (fileChangeListener) {
    const fileInput = document.querySelector(FILE_INPUT_SELECTOR) as HTMLInputElement;
    if (fileInput) {
      fileInput.removeEventListener('change', fileChangeListener);
    }
  }
  fileChangeListener = null;

  if (browseButtonListener) {
    const { element, listener } = browseButtonListener;
    element.removeEventListener('click', listener);
  }
  browseButtonListener = null;
}

function initializeUploadZone(): void {
  const uploadZone = document.querySelector(UPLOAD_ZONE_SELECTOR);
  const fileInput = document.querySelector(FILE_INPUT_SELECTOR) as HTMLInputElement;

  if (!uploadZone || !fileInput) return;

  // Clean up any existing listeners
  cleanupUploadZone();

  // Setup Browse Files button (tracked for cleanup)
  setupBrowseButton(uploadZone, fileInput);

  // Track handlers for cleanup
  const handlers: Array<[string, EventListener]> = [];

  // Drag and drop handlers
  const dragenterHandler = (e: Event) => {
    e.preventDefault();
    uploadZone.classList.add("drag-over");
  };
  uploadZone.addEventListener("dragenter", dragenterHandler);
  handlers.push(["dragenter", dragenterHandler]);

  const dragoverHandler = (e: Event) => {
    e.preventDefault();
    uploadZone.classList.add("drag-over");
  };
  uploadZone.addEventListener("dragover", dragoverHandler);
  handlers.push(["dragover", dragoverHandler]);

  const dragleaveHandler = (e: Event) => {
    e.preventDefault();
    uploadZone.classList.remove("drag-over");
  };
  uploadZone.addEventListener("dragleave", dragleaveHandler);
  handlers.push(["dragleave", dragleaveHandler]);

  const dropHandler = async (e: Event) => {
    e.preventDefault();
    uploadZone.classList.remove("drag-over");

    const dropEvent = e as DragEvent;
    const files = dropEvent.dataTransfer?.files;
    if (!files || files.length === 0) return;

    // Handle multiple files
    let processedCount = 0;
    for (let i = 0; i < files.length; i++) {
      if (!files[i].name.toLowerCase().endsWith('.csv')) {
        if (i === 0) {
          showError("Only .csv files are supported");
        }
        continue;
      }
      await processFile(files[i]);
      processedCount++;
    }

    if (files.length > 1 && processedCount > 0) {
      showError(`Only the first ${processedCount} CSV file(s) will be processed`);
    }
  };
  uploadZone.addEventListener("drop", dropHandler);
  handlers.push(["drop", dropHandler]);

  // Store handlers for cleanup on navigation
  dragDropListeners = { element: uploadZone, listeners: handlers };

  // File input change handler
  const changeHandler = async (e: Event) => {
    const inputEvent = e as Event;
    const input = inputEvent.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      await processFile(input.files[0]);
    }
    // Reset input so same file can be uploaded again
    input.value = "";
  };
  fileInput.addEventListener("change", changeHandler);
  fileChangeListener = changeHandler;
}

async function loadRecentFiles(): Promise<void> {
  try {
    const files = await getAllFiles();
    const grid = document.querySelector(RECENT_FILES_GRID_SELECTOR);
    const emptyState = document.querySelector(EMPTY_STATE_SELECTOR);

    if (!grid || !emptyState) return;

    // Clear existing cards (keep only empty state)
    const existingCards = grid.querySelectorAll(
      '[class*="bg-surface-card"]:not([data-empty-state])'
    );
    existingCards.forEach((card) => card.remove());

    if (files.length === 0) {
      emptyState.classList.remove("hidden");
      return;
    }

    emptyState.classList.add("hidden");

    // Render cards for each file
    files.forEach((file) => {
      const cardHTML = renderFileCard(file);
      grid.insertAdjacentHTML("beforeend", cardHTML);
    });
  } catch (err) {
    console.error("Failed to load recent files:", err);
  }
}

// Initialize when DOM is ready
function initializeUploadPage(): void {
  // Reset state on each initialization (important for View Transitions)
  IDLE_STATE_HTML = "";
  initializeUploadZone();
  loadRecentFiles();
}

// Use View Transitions compatible initialization
onPageLoad(() => {
  initializeUploadPage();
});

// Cleanup before page swap to prevent duplicate listeners
onBeforeSwap(() => {
  cleanupUploadZone();
  IDLE_STATE_HTML = "";
});
