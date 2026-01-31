/**
 * DOM Selectors for Visualizer Page
 * Centralized for easy maintenance and markup changes.
 */

// UI States
export const LOADING_STATE_SELECTOR = "[data-loading-state]";
export const ERROR_STATE_SELECTOR = "[data-error-state]";
export const ERROR_MESSAGE_SELECTOR = "[data-error-message]";
export const CONTENT_SELECTOR = "[data-visualizer-content]";

// Table
export const TABLE_CONTAINER_SELECTOR = "[data-csv-table-container]";
export const TABLE_HEADER_SELECTOR = "[data-table-header]";
export const TABLE_BODY_SELECTOR = "[data-csv-table-body]";

// Header
export const FILENAME_SELECTOR = "[data-filename]";

// Toolbar
export const SHOWING_ROWS_SELECTOR = "[data-showing-rows]";
export const TOTAL_RECORDS_SELECTOR = "[data-total-records]";

// Pagination
export const PAGINATION_CONTAINER_SELECTOR = "[data-pagination-container]";
export const CURRENT_PAGE_SELECTOR = "[data-current-page]";
export const TOTAL_PAGES_SELECTOR = "[data-total-pages]";
export const ROWS_PER_PAGE_SELECT = "[data-rows-per-page]";
export const PAGINATION_FIRST = "[data-pagination-first]";
export const PAGINATION_PREV = "[data-pagination-prev]";
export const PAGINATION_NEXT = "[data-pagination-next]";
export const PAGINATION_LAST = "[data-pagination-last]";

// Column Visibility
export const COLUMN_VISIBILITY_TRIGGER = "[data-column-visibility-trigger]";
export const COLUMN_VISIBILITY_DROPDOWN = "[data-column-visibility-dropdown]";
export const COLUMN_VISIBILITY_LIST = "[data-column-visibility-list]";
export const COLUMN_VISIBILITY_COUNT = "[data-column-visibility-count]";
export const COLUMN_SELECT_ALL = "[data-column-select-all]";
export const COLUMN_DESELECT_ALL = "[data-column-deselect-all]";

// Export
export const EXPORT_WRAPPER = "[data-export-wrapper]";
export const EXPORT_TRIGGER = "[data-export-trigger]";
export const EXPORT_DROPDOWN = "[data-export-dropdown]";
export const EXPORT_ALL = "[data-export-all]";
export const EXPORT_FILTERED = "[data-export-filtered]";
