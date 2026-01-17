import fs from 'node:fs/promises';
import { parse } from 'csv-parse/sync';

export interface CSVParseResult {
  data: any[];
  error?: string;
  rowCount: number;
}

export async function parseCSV(filePath: string): Promise<CSVParseResult> {
  try {
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      throw new Error(`File not found: ${filePath}`);
    }

    const fileContent = await fs.readFile(filePath, 'utf-8');

    if (!fileContent.trim()) {
      throw new Error('File is empty');
    }

    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    return {
      data: records,
      rowCount: records.length,
    };
  } catch (err) {
    let errorMessage = 'Unknown error parsing CSV';
    if (err instanceof Error) {
      errorMessage = err.message;
    }

    return {
      data: [],
      rowCount: 0,
      error: errorMessage,
    };
  }
}
