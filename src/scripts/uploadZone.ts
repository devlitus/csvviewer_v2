import { uploadFiles } from "../lib/fileUpload";

const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-upload") as HTMLInputElement;
const uploadText = document.getElementById("upload-text");

if (dropZone && fileInput && uploadText) {
  // Prevent default drag behaviors
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });

  // Highlight drop zone when item is dragged over it
  ["dragenter", "dragover"].forEach((eventName) => {
    dropZone.addEventListener(eventName, highlight, false);
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, unhighlight, false);
  });

  // Handle dropped files
  dropZone.addEventListener("drop", handleDrop, false);

  // Handle selected files
  fileInput.addEventListener("change", handleFiles, false);

  function preventDefaults(e: Event) {
    e.preventDefault();
    e.stopPropagation();
  }

  function highlight() {
    dropZone?.classList.add("border-vibrant-blue", "bg-vibrant-blue/5");
  }

  function unhighlight() {
    dropZone?.classList.remove("border-vibrant-blue", "bg-vibrant-blue/5");
  }

  function handleDrop(e: DragEvent) {
    const dt = e.dataTransfer;
    const files = dt?.files;
    if (files) {
      handleUpload(files);
    }
  }

  function handleFiles(e: Event) {
    const target = e.target as HTMLInputElement;
    const files = target.files;
    if (!files || files.length === 0) return;
    handleUpload(files);
  }

  async function handleUpload(files: FileList) {
    // Early return para garantizar null safety
    if (!uploadText) return;

    let timeoutId: number | undefined;

    // Cancelar cualquier timeout de feedback anterior
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    const originalText = uploadText.innerText;
    const fileCount = files.length;
    uploadText.innerText = `Uploading ${fileCount} file${fileCount > 1 ? "s" : ""}...`;

    try {
      const result = await uploadFiles(files);

      if (result.uploaded > 0) {
        uploadText.innerText = `Upload Successful! (${result.uploaded} file${result.uploaded > 1 ? "s" : ""})`;

        // Dispatch custom event with upload results
        document.dispatchEvent(
          new CustomEvent("files-uploaded", {
            detail: { uploaded: result.uploaded, skipped: result.skipped }
          })
        );

        // El listener en filesPage.ts se encarga del reload, no hacemos reload aquí
        timeoutId = window.setTimeout(() => {
          if (uploadText) {
            uploadText.innerText = originalText;
          }
        }, 1500);
      } else if (result.errors.length > 0) {
        // Show first error
        uploadText.innerText = result.errors[0];
        timeoutId = window.setTimeout(() => {
          if (uploadText) {
            uploadText.innerText = originalText;
          }
        }, 3000);
      } else {
        uploadText.innerText = "No valid files found";
        timeoutId = window.setTimeout(() => {
          if (uploadText) {
            uploadText.innerText = originalText;
          }
        }, 3000);
      }
    } catch (error) {
      uploadText.innerText = "Error uploading files";
      console.error("Upload error:", error);
      timeoutId = window.setTimeout(() => {
        if (uploadText) {
          uploadText.innerText = originalText;
        }
      }, 3000);
    }

    // Reset file input
    fileInput.value = "";
  }
}
