import type { CSVParseResult } from "./types";

export function parseCSVString(content: string): CSVParseResult {
  try {
    if (!content.trim()) {
      return { data: [], rowCount: 0, error: "File is empty" };
    }

    const lines = parseCSVLines(content.trim());
    if (lines.length < 2) {
      return { data: [], rowCount: 0, error: "No data rows found" };
    }

    const headers = lines[0];
    const data: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i];
      const row: Record<string, string> = {};
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = values[j] ?? "";
      }
      data.push(row);
    }

    return { data, rowCount: data.length };
  } catch (err) {
    return {
      data: [],
      rowCount: 0,
      error: err instanceof Error ? err.message : "Unknown error parsing CSV",
    };
  }
}

function parseCSVLines(text: string): string[][] {
  const results: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        row.push(current.trim());
        current = "";
      } else if (char === "\r" && next === "\n") {
        row.push(current.trim());
        results.push(row);
        row = [];
        current = "";
        i++;
      } else if (char === "\n") {
        row.push(current.trim());
        results.push(row);
        row = [];
        current = "";
      } else {
        current += char;
      }
    }
  }

  if (current || row.length > 0) {
    row.push(current.trim());
    results.push(row);
  }

  return results;
}
