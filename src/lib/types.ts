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
