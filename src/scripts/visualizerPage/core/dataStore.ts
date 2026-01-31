import type { CSVFile } from "../../../lib/types";

export interface DataState {
  file: CSVFile | null;
  columns: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

/**
 * Manages CSV data state.
 * Encapsulates loaded file data and provides controlled access.
 */
export class DataStore {
  private state: DataState;

  constructor() {
    this.state = {
      file: null,
      columns: [],
      rows: [],
      totalRows: 0,
    };
  }

  /**
   * Set all data at once.
   */
  setData(
    file: CSVFile,
    columns: string[],
    rows: Record<string, string>[]
  ): void {
    this.state = {
      file,
      columns,
      rows,
      totalRows: rows.length,
    };
  }

  /**
   * Get column names from loaded CSV.
   * @returns Array of column names, empty if no data loaded
   */
  getColumns(): string[] {
    return this.state.columns;
  }

  /**
   * Get all data rows from loaded CSV.
   * @returns Array of row objects, empty if no data loaded
   */
  getRows(): Record<string, string>[] {
    return this.state.rows;
  }

  /**
   * Get total number of rows in dataset.
   * @returns Total row count, 0 if no data loaded
   */
  getTotalRows(): number {
    return this.state.totalRows;
  }

  /**
   * Get original filename of loaded CSV.
   * @returns Filename from CSVFile object, or empty string if not loaded
   */
  getFilename(): string {
    return this.state.file?.filename || "";
  }

  /**
   * Check if data has been loaded.
   */
  hasData(): boolean {
    return this.state.rows.length > 0;
  }

  /**
   * Reset all data.
   */
  clear(): void {
    this.state = {
      file: null,
      columns: [],
      rows: [],
      totalRows: 0,
    };
  }
}
