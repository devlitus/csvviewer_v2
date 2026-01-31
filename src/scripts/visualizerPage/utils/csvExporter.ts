/**
 * CSV Export Utility
 *
 * Generates CSV strings from column and row data, and triggers downloads
 * using Blob + URL.createObjectURL pattern.
 */

/**
 * Escape a CSV field value if needed.
 * If value contains commas, quotes, or newlines, wrap in quotes and escape internal quotes.
 * @param value - The field value to escape
 * @returns Escaped field value
 */
function escapeCSVField(value: string): string {
  // If contains comma, quotes, or newlines, wrap in quotes and escape internal quotes
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Export data to CSV and trigger download
 * @param columns - Array of column names
 * @param rows - Array of row objects (Record<string, string>[])
 * @param filename - Filename for the download (without extension)
 */
export function exportToCSV(
  columns: string[],
  rows: Record<string, string>[],
  filename: string
): void {
  // Build header line
  const headerLine = columns.map((col) => escapeCSVField(col)).join(",");

  // Build data lines
  const dataLines = rows.map((row) =>
    columns.map((col) => escapeCSVField(row[col] ?? "")).join(",")
  );

  // Combine all lines with CRLF (standard CSV line ending)
  const csvString = [headerLine, ...dataLines].join("\r\n");

  // Create Blob
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8" });

  // Create temporary URL
  const url = URL.createObjectURL(blob);

  // Create temporary anchor element and trigger download
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Revoke URL to free memory
  URL.revokeObjectURL(url);
}
