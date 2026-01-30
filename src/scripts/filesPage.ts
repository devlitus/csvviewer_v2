/**
 * FilesPage Entry Point (Wrapper)
 *
 * Simple wrapper that initializes the modularized filesPage architecture.
 * Maintains compatibility with View Transitions and the existing page structure.
 */

import { onPageLoad } from "../lib/pageInit.js";
import { initFilesPage, cleanup } from "./filesPage/index.js";

onPageLoad(() => {
  cleanup();
  initFilesPage().catch((err) => {
    console.error("Failed to initialize files page:", err);
  });
});
