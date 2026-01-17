import type { APIRoute } from "astro";
import path from "node:path";
import fs from "node:fs/promises";
import { Buffer } from "node:buffer";
import { parseCSV } from "../../utils/csvParser";
import * as XLSX from "xlsx";

export const GET: APIRoute = async ({ url }) => {
  const filename = url.searchParams.get("file");
  const excludeParam = url.searchParams.get("exclude");
  const format = url.searchParams.get("format") || "csv";

  if (!filename) {
    return new Response(JSON.stringify({ error: "Filename is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const filePath = path.join(process.cwd(), "files", filename);

  try {
    await fs.access(filePath);
  } catch (e) {
    return new Response(JSON.stringify({ error: "File not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const result = await parseCSV(filePath);

  if (result.error) {
    return new Response(JSON.stringify({ error: result.error }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let data = result.data;

  // Filter out excluded columns
  if (excludeParam && data.length > 0) {
    const excludedColumns = new Set(excludeParam.split(","));
    data = data.map((row) => {
      const newRow: any = {};
      Object.keys(row).forEach((key) => {
        if (!excludedColumns.has(key)) {
          newRow[key] = row[key];
        }
      });
      return newRow;
    });
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

  let buffer: Buffer;
  let contentType: string;
  let fileExtension: string;

  if (format === "xlsx") {
    // XLSX.write returns a Buffer if {type: 'buffer'} is specified
    buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as any;
    // ensure it's treated as a Buffer if the type defs are loose
    if (!(buffer instanceof Buffer)) {
      buffer = Buffer.from(buffer);
    }
    contentType =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    fileExtension = "xlsx";
  } else {
    const csvString = XLSX.utils.sheet_to_csv(ws);
    buffer = Buffer.from(csvString);
    contentType = "text/csv";
    fileExtension = "csv";
  }

  const cleanFilename = path.basename(filename, path.extname(filename));
  const downloadFilename = `${cleanFilename}_export.${fileExtension}`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${downloadFilename}"`,
    },
  });
};
