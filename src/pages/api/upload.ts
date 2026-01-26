import type { APIRoute } from "astro";
import fs from "node:fs/promises";
import path from "node:path";

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const files = formData.getAll("files") as File[];

  if (!files || files.length === 0) {
    return new Response(JSON.stringify({ message: "No files uploaded" }), {
      status: 400,
    });
  }

  const savedFiles = [];
  const filesDir = path.join(process.cwd(), "files");

  try {
    // Ensure files directory exists
    try {
      await fs.access(filesDir);
    } catch {
      await fs.mkdir(filesDir);
    }

    const uploadPromises = files.map(async (file) => {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        return null; // Skip non-csv
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const fileName = file.name;

      await fs.writeFile(path.join(filesDir, fileName), buffer);
      return fileName;
    });

    const results = await Promise.all(uploadPromises);
    const validFiles = results.filter(Boolean);

    if (validFiles.length === 0) {
      return new Response(JSON.stringify({ message: "No valid CSV files uploaded" }), {
        status: 400,
      });
    }

    return new Response(
      JSON.stringify({
        message: "Files uploaded successfully",
        files: validFiles,
      }),
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error saving files:", error);
    return new Response(JSON.stringify({ message: "Error saving files" }), {
      status: 500,
    });
  }
};
