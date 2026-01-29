import { deleteFiles } from "../lib/indexeddb";
import { uploadFiles } from "../lib/fileUpload";

// Upload Logic
const uploadButton = document.getElementById("uploadButton");
const fileInput = document.getElementById("fileInput") as HTMLInputElement;

if (uploadButton && fileInput) {
  uploadButton.addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", async () => {
    const files = fileInput.files;
    if (!files || files.length === 0) return;

    try {
      const result = await uploadFiles(files);

      if (result.uploaded > 0) {
        // Dispatch custom event - el listener se encarga del reload
        document.dispatchEvent(
          new CustomEvent("files-uploaded", {
            detail: { uploaded: result.uploaded, skipped: result.skipped }
          })
        );
      } else if (result.errors.length > 0) {
        alert(result.errors.join("\n"));
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Error uploading files");
    }

    fileInput.value = "";
  });
}

// Listen for files-uploaded event to refresh the page
document.addEventListener("files-uploaded", () => {
  // Reload centralizado - evita race conditions
  window.location.reload();
});

// Selection and Delete Logic
const selectAllCheckbox = document.getElementById(
  "selectAllCheckbox",
) as HTMLInputElement;
const fileCheckboxes = document.querySelectorAll(
  ".file-checkbox",
) as NodeListOf<HTMLInputElement>;
const deleteButton = document.getElementById("deleteButton");

function updateDeleteButton() {
  const checkedCount = Array.from(fileCheckboxes).filter(
    (cb) => cb.checked,
  ).length;
  if (deleteButton) {
    if (checkedCount > 0) {
      deleteButton.classList.remove("hidden");
    } else {
      deleteButton.classList.add("hidden");
    }
  }
}

if (selectAllCheckbox) {
  selectAllCheckbox.addEventListener("change", (e) => {
    const isChecked = (e.target as HTMLInputElement).checked;
    fileCheckboxes.forEach((cb) => {
      cb.checked = isChecked;
    });
    updateDeleteButton();
  });
}

fileCheckboxes.forEach((cb) => {
  cb.addEventListener("change", () => {
    updateDeleteButton();

    const allChecked = Array.from(fileCheckboxes).every((c) => c.checked);
    const someChecked = Array.from(fileCheckboxes).some((c) => c.checked);

    if (selectAllCheckbox) {
      selectAllCheckbox.checked = allChecked;
      selectAllCheckbox.indeterminate = someChecked && !allChecked;
    }
  });
});

if (deleteButton) {
  const modal = document.getElementById("deleteConfirmModal");
  const confirmBtn = modal?.querySelector(".modal-confirm-btn");

  deleteButton.addEventListener("click", () => {
    const selectedFiles = Array.from(fileCheckboxes)
      .filter((cb) => cb.checked)
      .map((cb) => cb.dataset.fileId);

    if (selectedFiles.length === 0) return;

    const descEl = modal?.querySelector("p");
    if (descEl) {
      descEl.textContent = `Are you sure you want to delete ${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""}? This action cannot be undone.`;
    }

    if (modal) {
      modal.classList.remove("hidden");
      requestAnimationFrame(() => {
        modal.classList.remove("opacity-0");
        modal
          .querySelector("div[class*='relative']")
          ?.classList.remove("scale-95");
        modal
          .querySelector("div[class*='relative']")
          ?.classList.add("scale-100");
      });
    }
  });

  if (confirmBtn) {
    confirmBtn.addEventListener("click", async () => {
      const selectedIds = Array.from(fileCheckboxes)
        .filter((cb) => cb.checked)
        .map((cb) => cb.dataset.fileId!)
        .filter(Boolean);

      try {
        confirmBtn.textContent = "Deleting...";
        (confirmBtn as HTMLButtonElement).disabled = true;

        await deleteFiles(selectedIds);
        window.location.reload();
      } catch (error) {
        console.error("Error deleting files:", error);
        alert("Error deleting files");
        // Restaurar estado del botón en caso de error
        confirmBtn.textContent = "Delete";
        (confirmBtn as HTMLButtonElement).disabled = false;
        modal
          ?.querySelector(".modal-cancel-btn")
          ?.dispatchEvent(new Event("click"));
      }
    });
  }
}
