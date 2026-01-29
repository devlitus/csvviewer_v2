/**
 * Page Initialization Utility with View Transitions Support
 *
 * Provides helpers for page scripts to initialize correctly when View Transitions
 * are enabled. astro:page-load fires on both initial page load and after SPA navigation.
 *
 * Reference: https://docs.astro.build/en/guides/view-transitions/#lifecycle-events
 */

/**
 * Execute callback when page loads, compatible with Astro View Transitions
 * Fires on initial page load AND after each SPA navigation
 *
 * @param callback - Function to execute when page loads
 * @example
 * onPageLoad(() => {
 *   // Re-initialize page-specific logic
 *   setupEventListeners();
 *   loadData();
 * });
 */
export function onPageLoad(callback: () => void): void {
  // Use astro:page-load instead of DOMContentLoaded for View Transitions compatibility
  document.addEventListener('astro:page-load', callback);

  // Also support standard page load for non-View Transitions navigation
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    // Already loaded, execute immediately
    callback();
  }
}

/**
 * Execute cleanup before View Transitions swaps the DOM
 * Useful for removing event listeners and resetting state
 *
 * @param callback - Function to execute before DOM swap
 * @example
 * onBeforeSwap(() => {
 *   // Clean up event listeners
 *   removeEventListeners();
 *   resetState();
 * });
 */
export function onBeforeSwap(callback: () => void): void {
  document.addEventListener('astro:before-swap', callback);
}

/**
 * Execute cleanup after the page leaves (useful for releasing resources)
 *
 * @param callback - Function to execute when leaving page
 * @example
 * onPageLeave(() => {
 *   // Last cleanup chance before page unloads
 *   analytics.flush();
 * });
 */
export function onPageLeave(callback: () => void): void {
  document.addEventListener('astro:after-swap', callback);
}
