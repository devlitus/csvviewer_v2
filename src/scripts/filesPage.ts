import type { CSVFile } from "../lib/types";
import { getAllFiles } from "../lib/indexeddb";
import { formatFileSize, formatRelativeDate } from "../lib/formatters";
import { escapeHtml } from "../lib/htmlUtils";
import { onPageLoad } from "../lib/pageInit";

// Constantes
const ITEMS_PER_PAGE = 6;
const TABLE_BODY_SELECTOR = "[data-file-table-body]";
const EMPTY_STATE_SELECTOR = "[data-empty-state]";
const PAGINATION_SELECTOR = "[data-pagination]";
const UPLOAD_BUTTON_SELECTOR = "[data-upload-button]";

// Estado
let currentPage = 1;
let allFiles: CSVFile[] = [];

function renderFileRow(file: CSVFile): string {
  const date = formatRelativeDate(file.uploadDate);
  const size = formatFileSize(file.size);

  const escapedFilename = escapeHtml(file.filename);
  const escapedSize = escapeHtml(size);
  const escapedDate = escapeHtml(date);
  const escapedId = escapeHtml(file.id);

  return `
    <tr class="hover:bg-white/5 transition-colors cursor-pointer group" data-file-id="${escapedId}">
      <!-- File Name with Icon -->
      <td class="px-6 py-4">
        <div class="flex items-center gap-3">
          <div class="bg-green-500/10 text-green-400 w-8 h-8 rounded-lg flex items-center justify-center">
            <span class="material-symbols-outlined text-lg">table_view</span>
          </div>
          <span class="text-sm font-semibold text-text-off-white group-hover:text-vibrant-blue transition-colors truncate">
            ${escapedFilename}
          </span>
        </div>
      </td>

      <!-- Date Uploaded -->
      <td class="px-6 py-4 text-sm text-text-light-gray">
        ${escapedDate}
      </td>

      <!-- File Size -->
      <td class="px-6 py-4 text-sm text-text-light-gray">
        ${escapedSize}
      </td>

      <!-- Status -->
      <td class="px-6 py-4">
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-green-500/10 text-green-400 rounded-full text-xs font-medium border border-green-500/20">
          <span class="material-symbols-outlined text-lg">check_circle</span>
          Processed
        </span>
      </td>

      <!-- Actions -->
      <td class="px-6 py-4 text-right">
        <button class="p-1 rounded-lg hover:bg-white/5 transition-colors">
          <span class="material-symbols-outlined text-text-light-gray text-xl">more_vert</span>
        </button>
      </td>
    </tr>
  `;
}

function renderTable(): void {
  const tableBody = document.querySelector(TABLE_BODY_SELECTOR);
  if (!tableBody) return;

  // Clear existing rows
  tableBody.innerHTML = "";

  if (allFiles.length === 0) {
    updateEmptyState();
    return;
  }

  // Calculate pagination
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageFiles = allFiles.slice(start, end);

  // Render rows
  pageFiles.forEach((file) => {
    tableBody.insertAdjacentHTML("beforeend", renderFileRow(file));
  });

  updateEmptyState();
  updatePagination();
}

function updateEmptyState(): void {
  const emptyState = document.querySelector(EMPTY_STATE_SELECTOR);
  if (!emptyState) return;

  if (allFiles.length === 0) {
    emptyState.classList.remove("opacity-0", "pointer-events-none");
  } else {
    emptyState.classList.add("opacity-0", "pointer-events-none");
  }
}

function updatePagination(): void {
  const pagination = document.querySelector(PAGINATION_SELECTOR);
  if (!pagination) return;

  const totalFiles = allFiles.length;
  const totalPages = Math.ceil(totalFiles / ITEMS_PER_PAGE);

  // Update showing info
  const start = totalFiles === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const end = Math.min(currentPage * ITEMS_PER_PAGE, totalFiles);

  const showingStart = pagination.querySelector("[data-showing-start]");
  const showingEnd = pagination.querySelector("[data-showing-end]");
  const totalFilesSpan = pagination.querySelector("[data-total-files]");

  if (showingStart) showingStart.textContent = String(start);
  if (showingEnd) showingEnd.textContent = String(end);
  if (totalFilesSpan) totalFilesSpan.textContent = String(totalFiles);

  // Update page numbers (clone to remove old listeners and prevent memory leaks)
  const pageNumbersContainer = pagination.querySelector("[data-page-numbers]");
  if (pageNumbersContainer) {
    const newContainer = pageNumbersContainer.cloneNode(false) as HTMLElement;
    newContainer.setAttribute("data-page-numbers", "");

    // Show first 3 pages or total pages if less than 3
    const pagesToShow = Math.min(3, totalPages);
    for (let i = 1; i <= pagesToShow; i++) {
      const isActive = i === currentPage;
      const button = document.createElement("button");
      button.textContent = String(i);
      button.className = `px-2.5 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
        isActive
          ? "bg-vibrant-blue/10 border-vibrant-blue text-vibrant-blue"
          : "border-border-dark text-text-off-white hover:bg-white/5 hover:border-vibrant-blue"
      }`;
      button.addEventListener("click", () => {
        currentPage = i;
        renderTable();
      });
      newContainer.appendChild(button);
    }

    // Add ellipsis if more pages
    if (totalPages > 3) {
      const ellipsis = document.createElement("span");
      ellipsis.textContent = "...";
      ellipsis.className = "text-text-light-gray";
      newContainer.appendChild(ellipsis);
    }

    pageNumbersContainer.parentNode?.replaceChild(newContainer, pageNumbersContainer);
  }

  // Update prev/next buttons (clone to remove old listeners and prevent memory leaks)
  const prevButton = pagination.querySelector("[data-prev-button]") as HTMLButtonElement;
  const nextButton = pagination.querySelector("[data-next-button]") as HTMLButtonElement;

  if (prevButton) {
    const newPrevButton = prevButton.cloneNode(true) as HTMLButtonElement;
    newPrevButton.disabled = currentPage === 1 || totalPages === 0;
    newPrevButton.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        renderTable();
      }
    });
    prevButton.parentNode?.replaceChild(newPrevButton, prevButton);
  }

  if (nextButton) {
    const newNextButton = nextButton.cloneNode(true) as HTMLButtonElement;
    newNextButton.disabled = currentPage === totalPages || totalPages === 0;
    newNextButton.addEventListener("click", () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderTable();
      }
    });
    nextButton.parentNode?.replaceChild(newNextButton, nextButton);
  }
}

async function loadFiles(): Promise<void> {
  try {
    allFiles = await getAllFiles();
    renderTable();
  } catch (err) {
    console.error("Failed to load files:", err);
  }
}

function setupUploadButton(): void {
  const uploadButton = document.querySelector(UPLOAD_BUTTON_SELECTOR) as HTMLButtonElement;
  if (uploadButton) {
    uploadButton.addEventListener("click", () => {
      window.location.href = "/";
    });
  }
}

// Set up table row navigation using event delegation
function setupTableNavigation(): void {
  const tableBody = document.querySelector(TABLE_BODY_SELECTOR);
  if (tableBody) {
    tableBody.addEventListener("click", (e) => {
      const row = (e.target as HTMLElement).closest("[data-file-id]");
      if (row) {
        const fileId = row.getAttribute("data-file-id");
        if (fileId) {
          window.location.href = `/visualizer?file=${fileId}`;
        }
      }
    });
  }
}

// Initialize with View Transitions support
onPageLoad(() => {
  currentPage = 1;
  setupTableNavigation();
  loadFiles();
  setupUploadButton();
});
