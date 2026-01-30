/**
 * DOM Selectors for Files Page
 *
 * Centraliza todos los selectores DOM utilizados en la página de gestión de archivos.
 * Facilita cambios de markup sin afectar la lógica de negocio.
 */

/** Contenedor del cuerpo de la tabla de archivos */
export const TABLE_BODY_SELECTOR: string = "[data-file-table-body]";

/** Estado vacío mostrado cuando no hay archivos */
export const EMPTY_STATE_SELECTOR: string = "[data-empty-state]";

/** Contenedor de paginación */
export const PAGINATION_SELECTOR: string = "[data-pagination]";

/** Botón de subida (en la barra superior) */
export const UPLOAD_BUTTON_SELECTOR: string = "[data-upload-button]";

/** Barra de selección que aparece cuando hay archivos seleccionados */
export const SELECTION_BAR_SELECTOR: string = "[data-selection-bar]";

/** Contador de archivos seleccionados dentro de la barra */
export const SELECTION_COUNT_SELECTOR: string = "[data-selection-count]";

/** Botón para cancelar selección */
export const SELECTION_CANCEL_BUTTON_SELECTOR: string = "[data-selection-cancel]";

/** Botón para eliminar archivos seleccionados */
export const SELECTION_DELETE_BUTTON_SELECTOR: string = "[data-selection-delete]";

/** Modal de confirmación para eliminación masiva */
export const CONFIRMATION_MODAL_SELECTOR: string = "[data-confirmation-modal]";

/** Mensaje dentro del modal de confirmación */
export const CONFIRMATION_MESSAGE_SELECTOR: string = "[data-confirmation-message]";

/** Botón de confirmación en el modal */
export const CONFIRM_BUTTON_SELECTOR: string = "[data-confirm-button]";

/** Botón de cancelación en el modal */
export const CANCEL_BUTTON_SELECTOR: string = "[data-cancel-button]";

/** Atributo de ID de archivo en las filas */
export const FILE_ID_ATTRIBUTE: string = "data-file-id";

/** Selector para obtener fila por ID */
export function getFileRowSelector(fileId: string): string {
  return `[data-file-id="${fileId}"]`;
}
