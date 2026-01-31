# Plan: Refactorización y Modularización de visualizerPage.ts

## Resumen Ejecutivo

El archivo `src/scripts/visualizerPage.ts` contiene **511 líneas** con múltiples responsabilidades mezcladas:
- Renderizado de tabla y headers (70 líneas)
- Gestión de estado de paginación (50 líneas)
- Eventos de paginación y cambio de filas (80 líneas)
- Estados de UI: loading, error, content (60 líneas)
- Inicialización y carga de datos (90 líneas)
- Utilidades (escapeHtml, scrollToTable) (30 líneas)

**Objetivo**: Modularizar en módulos independientes siguiendo el patrón exitoso de `filesPage/`, mejorar testabilidad, reutilización y mantenimiento.

---

## 1. Análisis del Estado Actual

### 1.1 Bloques Lógicos Identificados

| Bloque | Líneas | Responsabilidad | Funciones |
|--------|--------|-----------------|-----------|
| **Selectores** | 1-27 | Constantes de selectores DOM | 14 constantes |
| **State** | 28-48 | Estado global de paginación y datos | `paginationState`, `allData`, `columns`, listeners tracking |
| **Init** | 50-141 | Inicialización y carga de datos | `initVisualizerPage()`, `loadFileData()` |
| **Rendering** | 160-240 | Renderizar tabla header/body | `renderTableHeader()`, `renderTableBody()` |
| **UI Updates** | 242-300 | Actualizar contadores y paginación | `updateHeader()`, `updateToolbar()`, `updatePagination()` |
| **Events** | 302-390 | Setup de event listeners | `setupPaginationEvents()`, `setupRowsPerPageChange()` |
| **UI States** | 400-470 | Estados de loading/error/content | `showLoadingState()`, `hideLoadingState()`, `showErrorState()` |
| **Utils** | 472-490 | Utilidades generales | `escapeHtml()`, `scrollToTable()` |
| **Cleanup** | 492-511 | Limpieza y lifecycle | `cleanupEventListeners()`, `onPageLoad()`, `onBeforeSwap()` |

### 1.2 Problemas Identificados

**Acoplamiento:**
- `initVisualizerPage()` tiene 90+ líneas con múltiples responsabilidades
- Estado global (`allData`, `columns`, `paginationState`) mutado desde múltiples funciones
- Event handlers definidos inline, difícil de testear

**Falta de abstracción:**
- Selectores DOM hardcodeados como constantes globales
- Lógica de paginación mezclada con renderizado
- No hay separación entre carga de datos y presentación

**Testabilidad:**
- Funciones con efectos secundarios (DOM, IndexedDB, timers)
- Estado global mutable sin encapsulamiento
- Sin inyección de dependencias

**Reutilización:**
- `escapeHtml()` debería estar en `lib/htmlUtils.ts`
- Lógica de paginación similar a `filesPage/` pero duplicada
- UI states (loading/error) podrían ser genéricos

---

## 2. Propuesta de Arquitectura Modular

### 2.1 Estructura de Módulos Propuesta

```
src/scripts/visualizerPage/
├── index.ts                      # Entry point (orquestación)
├── config.ts                     # Configuración (rows per page, timeouts)
├── core/
│   ├── index.ts                  # Re-exports
│   ├── dataStore.ts              # Gestión de datos CSV cargados
│   └── paginationManager.ts      # Gestión de estado de paginación
├── rendering/
│   ├── index.ts                  # Re-exports
│   ├── tableRenderer.ts          # Renderizado de header y body
│   ├── toolbarRenderer.ts        # Actualización de contadores
│   └── paginationRenderer.ts     # Actualización de controles de paginación
├── events/
│   ├── index.ts                  # Re-exports
│   ├── paginationEventManager.ts # Event delegation para paginación
│   └── rowsPerPageEventManager.ts # Evento de cambio de filas por página
├── ui/
│   ├── index.ts                  # Re-exports
│   └── stateManager.ts           # Loading, error, content states
└── utils/
    ├── index.ts                  # Re-exports
    ├── domSelectors.ts           # Constantes de selectores
    ├── dataLoader.ts             # Carga de datos desde IndexedDB
    └── htmlEscape.ts             # Escape de HTML (o usar lib/htmlUtils)
```

### 2.2 Comparación con filesPage/

| Aspecto | filesPage/ | visualizerPage/ (propuesto) |
|---------|-----------|----------------------------|
| **Core** | FileStore, SelectionManager, PaginationManager | DataStore, PaginationManager |
| **Rendering** | TableRenderer, PaginationRenderer, SelectionBarRenderer, EmptyStateRenderer | TableRenderer, ToolbarRenderer, PaginationRenderer |
| **Events** | TableEventManager, SelectionEventManager, PaginationEventManager, DeleteEventManager | PaginationEventManager, RowsPerPageEventManager |
| **Utils** | domSelectors, rowAnimations, fileFormatting | domSelectors, dataLoader, htmlEscape |
| **Extras** | delete/ (individual y batch) | ui/ (states management) |

---

## 3. Diseño Detallado de Módulos

### 3.1 `config.ts` — Configuración

```typescript
/**
 * Configuration constants for the visualizer page module
 */
export const CONFIG = {
  /** Filas por página por defecto */
  DEFAULT_ROWS_PER_PAGE: 50,
  
  /** Opciones disponibles de filas por página */
  ROWS_PER_PAGE_OPTIONS: [10, 25, 50] as const,
  
  /** Timeout para carga de archivos (ms) */
  FILE_LOAD_TIMEOUT_MS: 10000,
  
  /** Comportamiento de scroll después de paginación */
  SCROLL_BEHAVIOR: "smooth" as ScrollBehavior,
} as const;
```

### 3.2 `core/dataStore.ts` — Gestión de Datos

```typescript
import type { CSVFile } from "../../../lib/types";

export interface DataState {
  file: CSVFile | null;
  columns: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

/**
 * Manages CSV data state.
 * Encapsulates loaded file data and provides controlled access.
 */
export class DataStore {
  private state: DataState;
  
  constructor() {
    this.state = {
      file: null,
      columns: [],
      rows: [],
      totalRows: 0,
    };
  }
  
  setData(file: CSVFile, columns: string[], rows: Record<string, string>[]): void;
  getColumns(): string[];
  getRows(): Record<string, string>[];
  getTotalRows(): number;
  getFilename(): string;
  clear(): void;
  hasData(): boolean;
}
```

### 3.3 `core/paginationManager.ts` — Paginación

```typescript
export interface PaginationState {
  currentPage: number;
  rowsPerPage: number;
  totalRows: number;
  totalPages: number;
}

/**
 * Manages pagination state and calculations.
 * Reusable across different paginated views.
 */
export class PaginationManager {
  private state: PaginationState;
  
  constructor(rowsPerPage?: number);
  
  // Getters
  getCurrentPage(): number;
  getRowsPerPage(): number;
  getTotalPages(): number;
  
  // Calculations
  getPageRange(): [startIndex: number, endIndex: number];
  getDisplayRange(): [start: number, end: number];
  
  // Navigation
  canGoPrevious(): boolean;
  canGoNext(): boolean;
  goToFirst(): void;
  goToPrevious(): void;
  goToNext(): void;
  goToLast(): void;
  
  // Updates
  setTotalRows(total: number): void;
  setRowsPerPage(rowsPerPage: number): void;
  reset(): void;
}
```

### 3.4 `rendering/tableRenderer.ts` — Renderizado de Tabla

```typescript
import type { DataStore } from "../core/dataStore";
import type { PaginationManager } from "../core/paginationManager";

/**
 * Renders CSV table header and body.
 * Manages DOM updates for data visualization.
 */
export class TableRenderer {
  constructor(
    private headerSelector: string,
    private bodySelector: string
  );
  
  renderHeader(columns: string[]): void;
  renderBody(
    columns: string[],
    rows: Record<string, string>[],
    startIndex: number,
    endIndex: number
  ): void;
  
  private generateHeaderHTML(columns: string[]): string;
  private generateRowHTML(row: Record<string, string>, columns: string[], index: number): string;
  private escapeHtml(text: string): string;
}
```

### 3.5 `rendering/toolbarRenderer.ts` — Toolbar

```typescript
/**
 * Updates toolbar counters (showing X rows from Y total).
 */
export class ToolbarRenderer {
  constructor(
    private showingSelector: string,
    private totalSelector: string
  );
  
  update(showingRows: number, totalRecords: number): void;
}
```

### 3.6 `rendering/paginationRenderer.ts` — Controles de Paginación

```typescript
/**
 * Updates pagination UI: page numbers and button states.
 */
export class PaginationRenderer {
  constructor(
    private currentPageSelector: string,
    private totalPagesSelector: string,
    private firstBtnSelector: string,
    private prevBtnSelector: string,
    private nextBtnSelector: string,
    private lastBtnSelector: string
  );
  
  update(currentPage: number, totalPages: number): void;
  private updatePageNumbers(current: number, total: number): void;
  private updateButtonStates(canPrev: boolean, canNext: boolean): void;
}
```

### 3.7 `events/paginationEventManager.ts` — Eventos de Paginación

```typescript
/**
 * Manages pagination button click events.
 * Implements cleanup for View Transitions support.
 */
export class PaginationEventManager {
  private listeners: Array<{ element: HTMLElement; type: string; handler: EventListener }> = [];
  
  constructor(
    private firstBtnSelector: string,
    private prevBtnSelector: string,
    private nextBtnSelector: string,
    private lastBtnSelector: string
  );
  
  onFirst(callback: () => void): void;
  onPrevious(callback: () => void): void;
  onNext(callback: () => void): void;
  onLast(callback: () => void): void;
  
  cleanup(): void;
}
```

### 3.8 `events/rowsPerPageEventManager.ts` — Cambio de Filas

```typescript
/**
 * Manages rows-per-page select change events.
 */
export class RowsPerPageEventManager {
  private listener: { element: HTMLSelectElement; handler: EventListener } | null = null;
  
  constructor(private selectSelector: string);
  
  onChange(callback: (newValue: number) => void): void;
  cleanup(): void;
}
```

### 3.9 `ui/stateManager.ts` — Gestión de Estados UI

```typescript
export type UIState = "loading" | "error" | "content";

/**
 * Manages UI state transitions (loading, error, content).
 * Handles visibility of different page sections.
 */
export class UIStateManager {
  constructor(
    private loadingSelector: string,
    private errorSelector: string,
    private contentSelector: string,
    private errorMessageSelector: string
  );
  
  showLoading(): void;
  showError(message: string): void;
  showContent(): void;
  
  private hideAll(): void;
  private show(selector: string): void;
  private hide(selector: string): void;
}
```

### 3.10 `utils/domSelectors.ts` — Selectores

```typescript
/**
 * DOM Selectors for Visualizer Page
 * Centralized for easy maintenance and markup changes.
 */

// UI States
export const LOADING_STATE_SELECTOR = "[data-loading-state]";
export const ERROR_STATE_SELECTOR = "[data-error-state]";
export const ERROR_MESSAGE_SELECTOR = "[data-error-message]";
export const CONTENT_SELECTOR = "[data-visualizer-content]";

// Table
export const TABLE_CONTAINER_SELECTOR = "[data-csv-table-container]";
export const TABLE_HEADER_SELECTOR = "[data-table-header]";
export const TABLE_BODY_SELECTOR = "[data-csv-table-body]";

// Header
export const FILENAME_SELECTOR = "[data-filename]";

// Toolbar
export const SHOWING_ROWS_SELECTOR = "[data-showing-rows]";
export const TOTAL_RECORDS_SELECTOR = "[data-total-records]";

// Pagination
export const PAGINATION_CONTAINER_SELECTOR = "[data-pagination-container]";
export const CURRENT_PAGE_SELECTOR = "[data-current-page]";
export const TOTAL_PAGES_SELECTOR = "[data-total-pages]";
export const ROWS_PER_PAGE_SELECT = "[data-rows-per-page]";
export const PAGINATION_FIRST = "[data-pagination-first]";
export const PAGINATION_PREV = "[data-pagination-prev]";
export const PAGINATION_NEXT = "[data-pagination-next]";
export const PAGINATION_LAST = "[data-pagination-last]";
```

### 3.11 `utils/dataLoader.ts` — Carga de Datos

```typescript
import type { CSVFile } from "../../../lib/types";
import { getFile } from "../../../lib/indexeddb";
import { parseCSVString } from "../../../lib/csvParser";
import { CONFIG } from "../config";

export interface LoadResult {
  success: true;
  file: CSVFile;
  columns: string[];
  rows: Record<string, string>[];
  rowCount: number;
} | {
  success: false;
  error: string;
};

/**
 * Loads and parses CSV file from IndexedDB.
 * Handles timeout and validation.
 */
export async function loadAndParseFile(fileId: string): Promise<LoadResult> {
  // 1. Validate fileId
  // 2. Load from IndexedDB with timeout
  // 3. Validate file content
  // 4. Parse CSV
  // 5. Validate structure
  // 6. Return result
}
```

### 3.12 `index.ts` — Orquestador Principal

```typescript
/**
 * Visualizer Page Orchestrator
 *
 * Coordinates all modules to implement CSV visualization.
 *
 * Architecture:
 * - Core managers handle state (DataStore, PaginationManager)
 * - Renderers generate HTML and update DOM
 * - Event managers handle user interactions
 * - UI StateManager handles loading/error/content states
 * - Utils provide data loading and DOM selectors
 *
 * Flow:
 * 1. initVisualizerPage() shows loading state
 * 2. loadAndParseFile() fetches and parses CSV
 * 3. DataStore stores parsed data
 * 4. Renderers draw initial state
 * 5. Event managers setup interactions
 * 6. User actions → update managers → re-render
 *
 * View Transitions:
 * - cleanup() called on page change to reset state
 * - onPageLoad() called on page load to reinitialize
 */

import { DataStore } from "./core/dataStore";
import { PaginationManager } from "./core/paginationManager";
import { TableRenderer } from "./rendering/tableRenderer";
import { ToolbarRenderer } from "./rendering/toolbarRenderer";
import { PaginationRenderer } from "./rendering/paginationRenderer";
import { PaginationEventManager } from "./events/paginationEventManager";
import { RowsPerPageEventManager } from "./events/rowsPerPageEventManager";
import { UIStateManager } from "./ui/stateManager";
import { loadAndParseFile } from "./utils/dataLoader";
import * as selectors from "./utils/domSelectors";
import { CONFIG } from "./config";
import { onPageLoad, onBeforeSwap } from "../../lib/pageInit";

// Managers (instanciados en init)
let dataStore: DataStore;
let paginationManager: PaginationManager;
let tableRenderer: TableRenderer;
let toolbarRenderer: ToolbarRenderer;
let paginationRenderer: PaginationRenderer;
let paginationEvents: PaginationEventManager;
let rowsPerPageEvents: RowsPerPageEventManager;
let uiState: UIStateManager;

async function initVisualizerPage(): Promise<void> {
  // 1. Instantiate managers
  // 2. Show loading state
  // 3. Get fileId from URL
  // 4. Load and parse file
  // 5. Store data
  // 6. Render UI
  // 7. Setup events
  // 8. Show content
}

function renderUI(): void {
  // Render header, body, toolbar, pagination
}

function setupEvents(): void {
  // Wire event managers to update managers and re-render
}

function cleanup(): void {
  // Cleanup event managers
  // Reset stores
}

// Lifecycle
onPageLoad(() => initVisualizerPage());
onBeforeSwap(() => cleanup());
```

---

## 4. Pasos de Implementación

### Fase 1: Preparación (30 min)

1. **Crear estructura de carpetas**
   ```
   mkdir -p src/scripts/visualizerPage/{core,rendering,events,ui,utils}
   ```

2. **Crear archivos base vacíos con exports**
   - Crear `index.ts` en cada subcarpeta
   - Configurar re-exports

### Fase 2: Utils y Config (45 min)

3. **Crear `config.ts`**
   - Extraer constantes de configuración

4. **Crear `utils/domSelectors.ts`**
   - Mover todos los selectores

5. **Crear `utils/dataLoader.ts`**
   - Extraer lógica de carga y parsing
   - Incluir timeout y validaciones

### Fase 3: Core Managers (1 hora)

6. **Crear `core/paginationManager.ts`**
   - Adaptar de filesPage si es posible
   - Incluir métodos específicos para visualizer

7. **Crear `core/dataStore.ts`**
   - Encapsular `allData`, `columns`, `file`

### Fase 4: Renderers (1 hora)

8. **Crear `rendering/tableRenderer.ts`**
   - Extraer `renderTableHeader()` y `renderTableBody()`
   - Incluir `escapeHtml()` como método privado

9. **Crear `rendering/toolbarRenderer.ts`**
   - Extraer `updateToolbar()`

10. **Crear `rendering/paginationRenderer.ts`**
    - Extraer `updatePagination()`

### Fase 5: UI State Manager (30 min)

11. **Crear `ui/stateManager.ts`**
    - Extraer `showLoadingState()`, `hideLoadingState()`, `showErrorState()`
    - Unificar lógica de visibilidad

### Fase 6: Event Managers (45 min)

12. **Crear `events/paginationEventManager.ts`**
    - Extraer setup de botones de paginación
    - Implementar cleanup

13. **Crear `events/rowsPerPageEventManager.ts`**
    - Extraer setup de select

### Fase 7: Orquestador (1 hora)

14. **Crear `index.ts` principal**
    - Importar todos los módulos
    - Implementar `initVisualizerPage()`
    - Implementar `cleanup()`
    - Conectar lifecycle hooks

### Fase 8: Migración y Testing (1 hora)

15. **Actualizar `visualizer.astro`**
    - Cambiar import a `../scripts/visualizerPage/index.ts`

16. **Eliminar `visualizerPage.ts` original**
    - Solo después de verificar funcionamiento

17. **Testing manual**
    - Cargar archivo CSV
    - Navegar páginas
    - Cambiar filas por página
    - Verificar estados loading/error
    - Probar View Transitions

---

## 5. Archivos a Crear/Modificar

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/scripts/visualizerPage/config.ts` | CREAR | Configuración |
| `src/scripts/visualizerPage/core/index.ts` | CREAR | Re-exports |
| `src/scripts/visualizerPage/core/dataStore.ts` | CREAR | Gestión de datos CSV |
| `src/scripts/visualizerPage/core/paginationManager.ts` | CREAR | Gestión de paginación |
| `src/scripts/visualizerPage/rendering/index.ts` | CREAR | Re-exports |
| `src/scripts/visualizerPage/rendering/tableRenderer.ts` | CREAR | Renderizado de tabla |
| `src/scripts/visualizerPage/rendering/toolbarRenderer.ts` | CREAR | Renderizado de toolbar |
| `src/scripts/visualizerPage/rendering/paginationRenderer.ts` | CREAR | Renderizado de paginación |
| `src/scripts/visualizerPage/events/index.ts` | CREAR | Re-exports |
| `src/scripts/visualizerPage/events/paginationEventManager.ts` | CREAR | Eventos de paginación |
| `src/scripts/visualizerPage/events/rowsPerPageEventManager.ts` | CREAR | Evento de cambio filas |
| `src/scripts/visualizerPage/ui/index.ts` | CREAR | Re-exports |
| `src/scripts/visualizerPage/ui/stateManager.ts` | CREAR | Estados de UI |
| `src/scripts/visualizerPage/utils/index.ts` | CREAR | Re-exports |
| `src/scripts/visualizerPage/utils/domSelectors.ts` | CREAR | Selectores DOM |
| `src/scripts/visualizerPage/utils/dataLoader.ts` | CREAR | Carga de datos |
| `src/scripts/visualizerPage/index.ts` | CREAR | Orquestador principal |
| `src/pages/visualizer.astro` | MODIFICAR | Actualizar import |
| `src/scripts/visualizerPage.ts` | ELIMINAR | Después de migración |

**Total: 17 archivos nuevos, 1 modificación, 1 eliminación**

---

## 6. Dependencias

No se requieren nuevas dependencias. Todo se resuelve con:
- TypeScript (ya configurado)
- Módulos existentes en `src/lib/`

---

## 7. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Regresiones en funcionalidad | Media | Alto | Testing manual exhaustivo antes de eliminar original |
| Circular dependencies | Baja | Medio | Estructura de imports unidireccional (utils → core → rendering → events → index) |
| View Transitions broken | Media | Alto | Verificar cleanup y re-init funciona correctamente |
| Performance degradado | Baja | Bajo | Módulos son pequeños, bundler optimiza |

---

## 8. Testing

### 8.1 Casos de Prueba Manual

| Caso | Pasos | Resultado Esperado |
|------|-------|-------------------|
| **Carga exitosa** | Navegar a `/visualizer?file=<id>` | Muestra datos del CSV |
| **Sin file param** | Navegar a `/visualizer` | Muestra error "No file specified" |
| **File no existe** | Navegar a `/visualizer?file=invalid` | Muestra error "File not found" |
| **Paginación** | Click en botones first/prev/next/last | Navega correctamente |
| **Cambio filas** | Cambiar select de 50 a 10 | Muestra 10 filas, resetea a página 1 |
| **View Transitions** | Navegar a otra página y volver | Re-carga datos correctamente |
| **Archivo vacío** | Subir CSV vacío y visualizar | Muestra error "no data rows" |

### 8.2 Verificaciones de Código

- [ ] No hay errores TypeScript (`pnpm astro check`)
- [ ] Build exitoso (`pnpm build`)
- [ ] No hay warnings en consola del navegador
- [ ] Event listeners se limpian (verificar con DevTools Memory)

---

## 9. Estimación de Esfuerzo

| Fase | Tiempo Estimado |
|------|-----------------|
| Fase 1: Preparación | 30 min |
| Fase 2: Utils y Config | 45 min |
| Fase 3: Core Managers | 1 hora |
| Fase 4: Renderers | 1 hora |
| Fase 5: UI State Manager | 30 min |
| Fase 6: Event Managers | 45 min |
| Fase 7: Orquestador | 1 hora |
| Fase 8: Migración y Testing | 1 hora |
| **Total** | **6-7 horas** |

---

## 10. Beneficios Esperados

### Mantenibilidad
- Cada módulo tiene una única responsabilidad
- Cambios aislados no afectan otros módulos
- Código más fácil de entender

### Testabilidad
- Managers pueden ser testeados unitariamente
- Inyección de dependencias posible
- Mock de selectores sencillo

### Reutilización
- `PaginationManager` reutilizable en otros contextos
- `UIStateManager` aplicable a otras páginas
- `dataLoader` separado de presentación

### Consistencia
- Misma arquitectura que `filesPage/`
- Patrones conocidos por el equipo
- Documentación implícita en estructura

---

**Última actualización:** 30/01/2026
