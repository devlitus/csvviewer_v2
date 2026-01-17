import type { APIRoute } from "astro";
import fs from "node:fs/promises";
import path from "node:path";

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return new Response(JSON.stringify({ message: "No file uploaded" }), {
      status: 400,
    });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const fileName = file.name;
  const filesDir = path.join(process.cwd(), "files");

  try {
    // Ensure files directory exists
    try {
      await fs.access(filesDir);
    } catch {
      await fs.mkdir(filesDir);
    }

    // Save file
    await fs.writeFile(path.join(filesDir, fileName), buffer);

    return new Response(
      JSON.stringify({
        message: "File uploaded successfully",
        filename: fileName,
      }),
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error saving file:", error);
    return new Response(JSON.stringify({ message: "Error saving file" }), {
      status: 500,
    });
  }
};
