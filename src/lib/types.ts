export interface CSVFile {
  id: string;
  filename: string;
  content: string;
  size: number;
  uploadDate: number;
}

export interface CSVParseResult {
  data: Record<string, string>[];
  rowCount: number;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface UploadResult {
  uploaded: number;
  skipped: number;
  errors: string[];
}

/**
 * State interfaces for filesPage modular architecture
 */
export interface FileStoreState {
  allFiles: CSVFile[];
  currentPage: number;
  itemsPerPage: number;
}

export interface SelectionState {
  selectedIds: Set<string>;
}

export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
}

export interface RowRenderContext {
  file: CSVFile;
  isSelected: boolean;
  isPendingDelete: boolean;
}
