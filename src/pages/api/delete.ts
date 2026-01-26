
import type { APIRoute } from "astro";
import fs from "node:fs";
import path from "node:path";

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { filenames } = body;

    if (!filenames || !Array.isArray(filenames) || filenames.length === 0) {
      return new Response(JSON.stringify({ message: "No filenames provided" }), {
        status: 400,
      });
    }

    const FILES_DIR = path.join(process.cwd(), "files");
    const deletedFiles: string[] = [];
    const errors: string[] = [];

    for (const filename of filenames) {
      // Basic security check to prevent directory traversal
      const safeFilename = path.basename(filename);
      const filePath = path.join(FILES_DIR, safeFilename);

      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          deletedFiles.push(safeFilename);
        } catch (err) {
          console.error(`Error deleting file ${safeFilename}:`, err);
          errors.push(`Failed to delete ${safeFilename}`);
        }
      } else {
        errors.push(`File not found: ${safeFilename}`);
      }
    }

    if (deletedFiles.length === 0 && errors.length > 0) {
      return new Response(
        JSON.stringify({ message: "Failed to delete files", errors }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({
        message: `Successfully deleted ${deletedFiles.length} files`,
        deleted: deletedFiles,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in delete API:", error);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
    });
  }
};
