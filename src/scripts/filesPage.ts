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

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        window.location.reload();
      } else {
        const result = await response.json();
        alert("Upload failed: " + (result.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Error uploading files");
    }

    // Reset input value to allow re-uploading same file if needed
    fileInput.value = "";
  });
}

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

    // Update select all state
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
      .map((cb) => cb.dataset.filename);

    if (selectedFiles.length === 0) return;

    // Update description/title if needed based on count
    const descEl = modal?.querySelector("p");
    if (descEl) {
      descEl.textContent = `Are you sure you want to delete ${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""}? This action cannot be undone.`;
    }

    // Show Modal
    if (modal) {
      modal.classList.remove("hidden");
      // Trigger reflow/next frame for animation
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

  // Handle Confirm Action
  if (confirmBtn) {
    confirmBtn.addEventListener("click", async () => {
      const selectedFiles = Array.from(fileCheckboxes)
        .filter((cb) => cb.checked)
        .map((cb) => (cb.dataset as { filename: string }).filename);

      try {
        // Show loading state on button
        const originalText = confirmBtn.textContent;
        confirmBtn.textContent = "Deleting...";
        (confirmBtn as HTMLButtonElement).disabled = true;

        const response = await fetch("/api/delete", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ filenames: selectedFiles }),
        });

        if (response.ok) {
          window.location.reload();
        } else {
          const result = await response.json();
          alert("Delete failed: " + (result.message || "Unknown error"));
          // Reset button
          confirmBtn.textContent = originalText;
          (confirmBtn as HTMLButtonElement).disabled = false;
          // Close modal
          modal
            ?.querySelector(".modal-cancel-btn")
            ?.dispatchEvent(new Event("click"));
        }
      } catch (error) {
        console.error("Error deleting files:", error);
        alert("Error deleting files");
        // Reset button
        confirmBtn.textContent = "Delete";
        (confirmBtn as HTMLButtonElement).disabled = false;
        // Close modal
        modal
          ?.querySelector(".modal-cancel-btn")
          ?.dispatchEvent(new Event("click"));
      }
    });
  }
}
