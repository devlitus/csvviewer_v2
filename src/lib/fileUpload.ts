import type { CSVFile, ValidationResult, UploadResult } from "./types";
import { saveFile } from "./indexeddb";

export const SUPPORTED_EXTENSIONS = [".csv"];
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function validateFile(file: File): ValidationResult {
  const extension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

  if (!SUPPORTED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `File type not supported. Only ${SUPPORTED_EXTENSIONS.join(", ")} files are allowed.`
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: "File is empty (0 bytes)."
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit.`
    };
  }

  return { valid: true };
}

export async function uploadFiles(files: FileList): Promise<UploadResult> {
  const result: UploadResult = {
    uploaded: 0,
    skipped: 0,
    errors: []
  };

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const validation = validateFile(file);

    if (!validation.valid) {
      result.skipped++;
      if (validation.error) {
        result.errors.push(`${file.name}: ${validation.error}`);
      }
      continue;
    }

    try {
      const content = await file.text();
      const csvFile: CSVFile = {
        id: crypto.randomUUID(),
        filename: file.name,
        content,
        size: file.size,
        uploadDate: Date.now(),
      };

      await saveFile(csvFile);
      result.uploaded++;
    } catch (error) {
      result.skipped++;
      result.errors.push(`${file.name}: Failed to upload`);
      console.error(`Error uploading ${file.name}:`, error);
    }
  }

  return result;
}
