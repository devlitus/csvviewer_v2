/**
 * File Row Formatting
 *
 * Genera el HTML de filas de tabla de forma pura.
 * No accede a estado global, recibe contexto tipado.
 */

import type { CSVFile } from "../../../lib/types.js";
import { escapeHtml } from "../../../lib/htmlUtils.js";
import { formatFileSize, formatRelativeDate } from "../../../lib/formatters.js";

/**
 * Contexto necesario para renderizar una fila de archivo
 */
export interface RowRenderContext {
  /** Objeto de archivo a renderizar */
  file: CSVFile;
  /** Si el archivo está seleccionado */
  isSelected: boolean;
  /** Si el archivo está en estado de confirmación de eliminación */
  isPendingDelete: boolean;
}

/**
 * Renderiza una fila de tabla HTML para un archivo.
 *
 * Función pura que genera HTML a partir del contexto proporcionado.
 * Incluye escaping automático de todos los textos para evitar XSS.
 *
 * @param context - Contexto con archivo y estado
 * @returns HTML string de <tr> con la fila completa
 *
 * @example
 * const row = renderFileRow({
 *   file: csvFile,
 *   isSelected: true,
 *   isPendingDelete: false
 * });
 * tableBody.insertAdjacentHTML('beforeend', row);
 */
export function renderFileRow(context: RowRenderContext): string {
  const { file, isSelected, isPendingDelete } = context;

  // Formatear datos
  const date = formatRelativeDate(file.uploadDate);
  const size = formatFileSize(file.size);

  // Escapar todos los strings para seguridad
  const escapedFilename = escapeHtml(file.filename);
  const escapedSize = escapeHtml(size);
  const escapedDate = escapeHtml(date);
  const escapedId = escapeHtml(file.id);

  return `
    <tr class="hover:bg-white/5 transition-colors group" data-file-id="${escapedId}">
      <!-- Checkbox -->
      <td class="px-6 py-4">
        <input
          type="checkbox"
          data-file-checkbox
          value="${escapedId}"
          ${isSelected ? "checked" : ""}
          class="w-4 h-4 rounded border border-border-dark bg-surface-dark text-vibrant-blue cursor-pointer accent-vibrant-blue"
          aria-label="Select file ${escapedFilename}"
        />
      </td>

      <!-- File Name with Icon -->
      <td class="px-6 py-4 cursor-pointer">
        <div class="flex items-center gap-3">
          <div class="bg-green-500/10 text-green-400 w-8 h-8 rounded-lg flex items-center justify-center">
            <span class="material-symbols-outlined text-lg">table_view</span>
          </div>
          <span class="text-sm font-semibold text-text-off-white group-hover:text-vibrant-blue transition-colors truncate">
            ${escapedFilename}
          </span>
        </div>
      </td>

      <!-- Date Uploaded -->
      <td class="px-6 py-4 text-sm text-text-light-gray cursor-pointer">
        ${escapedDate}
      </td>

      <!-- File Size -->
      <td class="px-6 py-4 text-sm text-text-light-gray cursor-pointer">
        ${escapedSize}
      </td>

      <!-- Status -->
      <td class="px-6 py-4 cursor-pointer">
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-green-500/10 text-green-400 rounded-full text-xs font-medium border border-green-500/20">
          <span class="material-symbols-outlined text-lg">check_circle</span>
          Processed
        </span>
      </td>

      <!-- Actions -->
      <td class="px-6 py-4 text-right">
        <button
          data-delete-button
          class="p-2 rounded-lg transition-all ${
            isPendingDelete
              ? "bg-red-500/10 border border-red-500/30 text-red-400"
              : "text-text-light-gray hover:bg-white/5 hover:text-red-400"
          }"
          aria-label="Delete file ${escapedFilename}"
        >
          <span class="material-symbols-outlined text-lg">${isPendingDelete ? "check" : "delete"}</span>
        </button>
      </td>
    </tr>
  `;
}
