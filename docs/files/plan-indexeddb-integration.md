# Plan: Cargar Archivos desde IndexedDB en Página My Files

## Resumen

Implementar la funcionalidad para que la página `/files` (My Files) muestre los archivos CSV reales almacenados en IndexedDB, reemplazando los datos mock actuales. Incluye carga dinámica, estado vacío, paginación funcional y navegación al visualizador.

---

## Análisis del Estado Actual

### Página `/files` actual
- **Datos mock**: Array estático de 6 archivos definidos en el frontmatter de `files.astro`
- **Componentes**: `FileTable.astro` → `FileTableRow.astro` + `Pagination.astro`
- **Sin script client-side**: Todo se renderiza server-side con datos hardcodeados

### Tipo de datos mock vs IndexedDB

| Propiedad Mock | Tipo | Propiedad CSVFile | Tipo |
|----------------|------|-------------------|------|
| `filename` | string | `filename` | string ✅ |
| `date` | string (formateado) | `uploadDate` | number (timestamp) ⚠️ |
| `size` | string (formateado) | `size` | number (bytes) ⚠️ |
| `status` | enum | — | No existe |
| `icon` | string | — | No existe |
| `iconColor` | enum | — | No existe |

**Diferencias clave:**
- IndexedDB guarda `uploadDate` como timestamp → necesita `formatRelativeDate()`
- IndexedDB guarda `size` como bytes → necesita `formatFileSize()`
- `status`, `icon`, `iconColor` no existen en `CSVFile` → usar valores por defecto ("processed", "table_view", "green")

### Patrón existente en `uploadPage.ts`
Ya existe un patrón probado para cargar archivos desde IndexedDB:
1. Usar `onPageLoad()` de `pageInit.ts` para View Transitions
2. Función `loadRecentFiles()` que llama `getAllFiles()`
3. Funciones helper: `formatFileSize()`, `formatRelativeDate()`
4. Renderizado dinámico con `insertAdjacentHTML()`

---

## Requisitos

### Funcionales
1. Mostrar lista de archivos CSV almacenados en IndexedDB
2. Mostrar estado vacío cuando no hay archivos
3. Formatear fecha y tamaño de archivo legiblemente
4. Paginación funcional (6 archivos por página)
5. Click en fila navega a `/visualizer?file={id}`
6. Botón "Upload New" navega a `/` (página de upload)

### No Funcionales
1. Compatible con View Transitions (usar `onPageLoad`)
2. Reutilizar funciones helper existentes
3. Mantener estilos y estructura visual actual

---

## Solución Propuesta

### Estrategia
Crear un script `filesPage.ts` similar a `uploadPage.ts` que:
1. Cargue archivos desde IndexedDB al iniciar la página
2. Renderice las filas de la tabla dinámicamente
3. Maneje paginación client-side
4. Añada event listeners para navegación

### Arquitectura de datos

```typescript
// Tipo interno para la tabla (derivado de CSVFile)
interface FileTableData {
  id: string;
  filename: string;
  date: string;        // Formateado desde uploadDate
  size: string;        // Formateado desde size (bytes)
  status: "processed"; // Siempre "processed" por ahora
  icon: "table_view";  // Siempre CSV icon
  iconColor: "green";  // Siempre verde
}
```

---

## Pasos de Implementación

### Paso 1: Crear utilidad compartida para formateo

**Archivo nuevo**: `src/lib/formatters.ts`

Extraer funciones de `uploadPage.ts` para reutilizarlas:
```typescript
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + sizes[i];
}

export function formatRelativeDate(timestamp: number): string {
  // ... lógica existente
}
```

### Paso 2: Modificar `files.astro`

**Cambios:**
1. Eliminar array de datos mock del frontmatter
2. Añadir contenedor con `data-file-table-body` para renderizado dinámico
3. Añadir estado vacío con `data-empty-state`
4. Agregar `<script src="../scripts/filesPage.ts"></script>`

### Paso 3: Modificar `FileTable.astro`

**Cambios:**
1. Eliminar prop `files` (ya no recibe datos estáticos)
2. Añadir `<slot />` para permitir tbody dinámico
3. Mantener `thead` estático
4. Hacer `Pagination` dinámico con data attributes

### Paso 4: Crear `filesPage.ts`

**Archivo nuevo**: `src/scripts/filesPage.ts`

**Estructura principal:**
```typescript
import type { CSVFile } from "../lib/types";
import { getAllFiles } from "../lib/indexeddb";
import { formatFileSize, formatRelativeDate } from "../lib/formatters";
import { onPageLoad } from "../lib/pageInit";

// Constantes
const ITEMS_PER_PAGE = 6;
const TABLE_BODY_SELECTOR = "[data-file-table-body]";
const EMPTY_STATE_SELECTOR = "[data-empty-state]";
const PAGINATION_SELECTOR = "[data-pagination]";

// Estado
let currentPage = 1;
let allFiles: CSVFile[] = [];

// Funciones principales
function renderFileRow(file: CSVFile): string { ... }
function renderTable(): void { ... }
function updatePagination(): void { ... }
function setupEventListeners(): void { ... }
async function loadFiles(): Promise<void> { ... }

// Inicialización con View Transitions
onPageLoad(() => {
  currentPage = 1;
  loadFiles();
});
```

### Paso 5: Implementar paginación funcional

**Lógica:**
- `ITEMS_PER_PAGE = 6`
- Calcular `totalPages = Math.ceil(allFiles.length / ITEMS_PER_PAGE)`
- Slice del array para página actual: `allFiles.slice(start, end)`
- Event listeners en botones prev/next y números de página
- Actualizar texto "Showing X-Y of Z files"

### Paso 6: Implementar navegación a visualizador

**Comportamiento:**
- Click en fila → `window.location.href = /visualizer?file=${id}`
- Usar event delegation en `tbody`

### Paso 7: Actualizar `uploadPage.ts`

Importar desde `formatters.ts` en lugar de definir localmente para evitar duplicación.

---

## Archivos a Crear/Modificar

| Acción | Archivo | Descripción |
|--------|---------|-------------|
| **Crear** | `src/lib/formatters.ts` | Funciones compartidas de formateo |
| **Crear** | `src/scripts/filesPage.ts` | Script principal de la página |
| **Modificar** | `src/pages/files.astro` | Eliminar mock, añadir data attributes |
| **Modificar** | `src/components/files/FileTable.astro` | Usar slot, eliminar prop files |
| **Modificar** | `src/components/files/Pagination.astro` | Añadir data attributes |
| **Modificar** | `src/scripts/uploadPage.ts` | Importar desde formatters.ts |

---

## Dependencias

Ninguna nueva dependencia externa. Se reutilizan:
- `src/lib/indexeddb.ts` — `getAllFiles()`, `deleteFiles()`
- `src/lib/pageInit.ts` — `onPageLoad()`, `onBeforeSwap()`
- `src/lib/types.ts` — `CSVFile`

---

## Riesgos y Consideraciones

| Riesgo | Mitigación |
|--------|------------|
| Tabla vacía en primera carga (sin archivos) | Implementar estado vacío visible con CTA a upload |
| Paginación con 0 archivos | Ocultar paginación si `totalFiles === 0` |
| View Transitions rompen estado de paginación | Resetear `currentPage = 1` en cada `onPageLoad` |
| Archivos eliminados en otra pestaña | Recargar lista en `onPageLoad` siempre |
| Performance con muchos archivos | Paginación client-side es suficiente para <1000 archivos |

---

## Testing

### Tests Manuales
1. ✅ Página sin archivos → muestra estado vacío
2. ✅ Subir archivo en `/` → aparece en `/files`
3. ✅ Paginación: navegar entre páginas
4. ✅ Click en fila → navega a visualizador
5. ✅ Click "Upload New" → navega a `/`
6. ✅ View Transitions: navegar `/` ↔ `/files` múltiples veces
7. ✅ Formateo correcto de fecha y tamaño
8. ✅ 7+ archivos → paginación muestra múltiples páginas

### Criterios de Aceptación
1. La tabla muestra archivos reales de IndexedDB
2. Fechas muestran formato relativo ("2 hours ago", "Yesterday")
3. Tamaños muestran formato legible ("2.4 MB", "840 KB")
4. Paginación funciona correctamente con 6 items por página
5. Estado vacío aparece cuando no hay archivos
6. Navegación funciona con View Transitions sin bugs

---

## Orden de Implementación Sugerido

1. **Crear `src/lib/formatters.ts`** — Extraer funciones de uploadPage.ts
2. **Modificar `src/scripts/uploadPage.ts`** — Importar desde formatters.ts
3. **Modificar `src/components/files/FileTable.astro`** — Preparar para contenido dinámico
4. **Modificar `src/components/files/Pagination.astro`** — Añadir data attributes
5. **Modificar `src/pages/files.astro`** — Eliminar mock, agregar script
6. **Crear `src/scripts/filesPage.ts`** — Implementar lógica completa
7. **Testing manual** — Verificar todos los casos

---

## Estimación

- **Complejidad**: Media
- **Archivos afectados**: 6
- **Patrón similar a**: `uploadPage.ts` + `RecentFilesSection.astro`
