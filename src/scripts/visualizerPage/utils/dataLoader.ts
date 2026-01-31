import type { CSVFile } from "../../../lib/types";
import { getFile } from "../../../lib/indexeddb";
import { parseCSVString } from "../../../lib/csvParser";
import { CONFIG } from "../config";

export interface LoadSuccess {
  success: true;
  file: CSVFile;
  columns: string[];
  rows: Record<string, string>[];
  rowCount: number;
}

export interface LoadFailure {
  success: false;
  error: string;
}

/**
 * Loads and parses CSV file from IndexedDB.
 * Handles timeout and validation.
 *
 * @param fileId - File identifier from URL query params
 * @returns LoadSuccess if file loaded and parsed successfully, LoadFailure otherwise
 */
export async function loadAndParseFile(
  fileId: string
): Promise<LoadSuccess | LoadFailure> {
  try {
    // 1. Validate fileId
    if (!fileId || fileId.trim() === "") {
      return {
        success: false,
        error: "No file specified. Please select a file to visualize.",
      };
    }

    // 2. Load from IndexedDB with timeout
    const fileLoadPromise = getFile(fileId);
    const timeoutPromise = new Promise<CSVFile | undefined>((resolve) =>
      setTimeout(() => resolve(undefined), CONFIG.FILE_LOAD_TIMEOUT_MS)
    );
    const file = await Promise.race([fileLoadPromise, timeoutPromise]);

    if (!file) {
      return {
        success: false,
        error:
          "File not found or request timed out. The file may have been deleted.",
      };
    }

    // 3. Validate file content
    if (!file.content || file.content.trim() === "") {
      return {
        success: false,
        error: "This file has no content.",
      };
    }

    // 4. Parse CSV
    let parseResult;
    try {
      parseResult = parseCSVString(file.content);
    } catch (parseErr) {
      const errorMsg =
        parseErr instanceof Error ? parseErr.message : "Unknown error";
      return {
        success: false,
        error: `Error parsing CSV: ${errorMsg}`,
      };
    }

    if (parseResult.error) {
      return {
        success: false,
        error: `Error parsing CSV: ${parseResult.error}`,
      };
    }

    // 5. Validate structure
    if (!parseResult.data || !Array.isArray(parseResult.data)) {
      return {
        success: false,
        error: "Invalid CSV format detected.",
      };
    }

    if (parseResult.data.length === 0) {
      return {
        success: false,
        error: "This CSV file has no data rows.",
      };
    }

    const firstRow = parseResult.data[0];
    if (!firstRow || Object.keys(firstRow).length === 0) {
      return {
        success: false,
        error: "CSV file has no columns.",
      };
    }

    // 6. Return result
    return {
      success: true,
      file,
      columns: Object.keys(firstRow),
      rows: parseResult.data,
      rowCount: parseResult.rowCount,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("Data loader error:", err);
    return {
      success: false,
      error: `An error occurred: ${errorMsg}`,
    };
  }
}
