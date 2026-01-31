# Plan: Feature de Exportacion CSV

## 1. Resumen

Implementar la funcionalidad de exportacion en el visualizador CSV. El usuario pulsa el boton "Export" y ve un dropdown con dos opciones: exportar todos los datos originales, o exportar solo las columnas visibles. Se genera un archivo CSV y se descarga automaticamente via Blob + URL.createObjectURL.

**Nota:** Actualmente no existe filtrado de filas (el ColumnFilterInput es estatico sin logica). Por tanto, "Export Filtered" se limita a exportar solo las columnas visibles (todas las filas). Cuando se implemente el filtrado de filas en el futuro, se debera extender esta opcion para tambien respetar las filas filtradas.

## 2. Analisis del Estado Actual

### Lo que existe
- **ExportButton.astro** (`src/components/visualizer/ExportButton.astro`): Boton estatico sin funcionalidad, sin dropdown, sin data attributes.
- **DataStore** (`src/scripts/visualizerPage/core/dataStore.ts`): Almacena `columns[]` y `rows[]` (Record<string, string>[]) completos. Expone `getColumns()`, `getRows()`, `getFilename()`.
- **ColumnVisibilityManager** (`src/scripts/visualizerPage/core/columnVisibilityManager.ts`): Expone `getVisibleColumns()` para obtener columnas visibles en orden original.
- **Patron de dropdown**: FilterButton.astro implementa un dropdown con wrapper `[data-*-wrapper]`, trigger `[data-*-trigger]`, dropdown panel con `hidden` class. El event manager maneja toggle, click-outside y Escape.
- **Patron de event manager**: Clase con array `listeners[]`, metodos `on*()` que registran handlers, y `cleanup()` que los remueve todos.

### Archivos relevantes
| Archivo | Rol |
|---------|-----|
| `src/components/visualizer/ExportButton.astro` | Boton estatico (se modifica) |
| `src/components/visualizer/FilterButton.astro` | Referencia para patron dropdown |
| `src/scripts/visualizerPage/index.ts` | Orquestador (se modifica) |
| `src/scripts/visualizerPage/core/dataStore.ts` | Fuente de datos (sin cambios) |
| `src/scripts/visualizerPage/core/columnVisibilityManager.ts` | Columnas visibles (sin cambios) |
| `src/scripts/visualizerPage/utils/domSelectors.ts` | Selectores DOM (se modifica) |
| `src/scripts/visualizerPage/events/index.ts` | Barrel export (se modifica) |

## 3. Solucion Propuesta

### Arquitectura

```
ExportButton.astro (dropdown con 2 opciones)
    |
    v
ExportEventManager (click trigger, click opcion, click-outside, Escape)
    |
    v
index.ts (orquesta: obtiene datos de DataStore + ColumnVisibilityManager)
    |
    v
csvExporter.ts (genera CSV string desde columnas + filas, dispara descarga)
```

### Flujo de datos

1. Usuario pulsa boton Export -> dropdown se muestra/oculta
2. Usuario selecciona "Export All" o "Export Visible Columns"
3. Orquestador obtiene datos segun la opcion:
   - **Export All**: `dataStore.getColumns()` + `dataStore.getRows()`
   - **Export Visible Columns**: `columnVisibilityManager.getVisibleColumns()` + `dataStore.getRows()`
4. Se llama a `exportToCSV(columns, rows, filename)` en `csvExporter.ts`
5. La funcion genera el CSV string, crea un Blob, genera URL temporal, crea un `<a>` invisible, dispara click, y limpia

### Justificacion
- No se necesitan librerias externas. La generacion de CSV es trivial (escapar comillas dobles, separar por comas).
- El patron Blob + createObjectURL es estandar y funciona en todos los navegadores modernos.
- Se reutiliza el mismo patron de dropdown y event manager que ya existe en column visibility.

## 4. Detalles de Implementacion

### 4.1 Modificar ExportButton.astro

Transformar de boton simple a dropdown, siguiendo el patron de FilterButton.astro:

- Wrapper: `div[data-export-wrapper]` con `class="relative"`
- Trigger: `button[data-export-trigger]` (el boton actual, con `aria-haspopup="true"` y `aria-expanded="false"`)
- Dropdown panel: `div[data-export-dropdown]` con `class="hidden"`, posicionado `absolute right-0 top-full mt-2`
  - Ancho: `w-56`
  - Estilos: `bg-surface-card border border-border-dark rounded-lg shadow-lg`
  - Dos items clickeables:
    1. `button[data-export-all]`: icono `download` + "Export All Data" + subtexto "All columns, all rows"
    2. `button[data-export-filtered]`: icono `filter_alt` + "Export Visible Columns" + subtexto "Only visible columns, all rows"
  - Cada item: `w-full text-left px-4 py-3 hover:bg-white/5 transition-colors` con texto principal `text-sm text-text-off-white` y subtexto `text-xs text-text-light-gray`

### 4.2 Crear csvExporter.ts

**Ubicacion:** `src/scripts/visualizerPage/utils/csvExporter.ts`

**Funcion principal:** `exportToCSV(columns: string[], rows: Record<string, string>[], filename: string): void`

**Logica:**
1. Construir header line: mapear cada columna con `escapeCSVField()`, unir con comas
2. Construir data lines: para cada fila, mapear cada columna a `row[column]`, escapar, unir con comas
3. Unir todo con `\r\n` (estandar CSV)
4. Crear `new Blob([csvString], { type: "text/csv;charset=utf-8" })`
5. Crear URL con `URL.createObjectURL(blob)`
6. Crear elemento `<a>` temporal con `href=url`, `download=filename`
7. Append al body, disparar `.click()`, remover del DOM
8. `URL.revokeObjectURL(url)` para liberar memoria

**Funcion auxiliar:** `escapeCSVField(value: string): string`
- Si el valor contiene comas, comillas dobles, o saltos de linea: envolver en comillas dobles y escapar comillas internas (duplicarlas)
- Si no, devolver tal cual

**Nombre del archivo descargado:**
- Export All: `{nombre-original}.csv` (sin cambios)
- Export Filtered: `{nombre-original}_filtered.csv`

### 4.3 Crear ExportEventManager

**Ubicacion:** `src/scripts/visualizerPage/events/exportEventManager.ts`

**Patron:** Identico a `ColumnVisibilityEventManager`. Clase con array `listeners[]` y metodo `cleanup()`.

**Metodos:**
- `onTriggerClick(callback: () => void)`: click en `[data-export-trigger]`
- `onExportAll(callback: () => void)`: click en `[data-export-all]`
- `onExportFiltered(callback: () => void)`: click en `[data-export-filtered]`
- `onClickOutside(callback: () => void)`: click fuera de `[data-export-wrapper]`
- `onEscapeKey(callback: () => void)`: tecla Escape
- `cleanup(): void`: remover todos los listeners

### 4.4 Agregar selectores DOM

**Archivo:** `src/scripts/visualizerPage/utils/domSelectors.ts`

Agregar al final:

```
// Export
EXPORT_WRAPPER = "[data-export-wrapper]"
EXPORT_TRIGGER = "[data-export-trigger]"
EXPORT_DROPDOWN = "[data-export-dropdown]"
EXPORT_ALL = "[data-export-all]"
EXPORT_FILTERED = "[data-export-filtered]"
```

### 4.5 Actualizar barrel exports

**Archivo:** `src/scripts/visualizerPage/events/index.ts` - agregar export de `ExportEventManager`.

**Archivo:** `src/scripts/visualizerPage/utils/index.ts` - agregar export de `csvExporter`.

### 4.6 Integrar en index.ts (orquestador)

**Cambios en `initVisualizerPage()`:**
- Instanciar `exportEvents = new ExportEventManager()`

**Cambios en `setupEvents()`:**
- `exportEvents.onTriggerClick(...)`: toggle dropdown (mismo patron que column visibility)
- `exportEvents.onExportAll(...)`: llamar `exportToCSV(dataStore.getColumns(), dataStore.getRows(), dataStore.getFilename())`; cerrar dropdown
- `exportEvents.onExportFiltered(...)`: llamar `exportToCSV(columnVisibilityManager.getVisibleColumns(), dataStore.getRows(), nombreConSufijo)`; cerrar dropdown
- `exportEvents.onClickOutside(...)`: cerrar dropdown
- `exportEvents.onEscapeKey(...)`: cerrar dropdown

**Cambios en `cleanup()`:**
- Agregar `exportEvents?.cleanup()`

## 5. Archivos a Crear/Modificar

| Accion | Archivo |
|--------|---------|
| **Crear** | `src/scripts/visualizerPage/utils/csvExporter.ts` |
| **Crear** | `src/scripts/visualizerPage/events/exportEventManager.ts` |
| **Modificar** | `src/components/visualizer/ExportButton.astro` |
| **Modificar** | `src/scripts/visualizerPage/utils/domSelectors.ts` |
| **Modificar** | `src/scripts/visualizerPage/events/index.ts` |
| **Modificar** | `src/scripts/visualizerPage/utils/index.ts` |
| **Modificar** | `src/scripts/visualizerPage/index.ts` |

**Dependencias nuevas:** Ninguna.

## 6. Criterios de Validacion

1. Al pulsar el boton Export, aparece un dropdown con dos opciones
2. Al pulsar fuera del dropdown o Escape, se cierra
3. "Export All Data" descarga un CSV identico al original (mismas columnas, mismas filas, mismo orden)
4. "Export Visible Columns" descarga un CSV solo con las columnas actualmente visibles
5. El archivo descargado tiene nombre correcto (`archivo.csv` o `archivo_filtered.csv`)
6. Los valores con comas, comillas y saltos de linea se escapan correctamente en el CSV generado
7. No hay memory leaks (URL.revokeObjectURL se llama siempre)
8. Los event listeners se limpian correctamente al navegar con View Transitions
9. El dropdown se posiciona correctamente (no se sale de la pantalla - usar `right-0` para alinear a la derecha)

## 7. Riesgos y Consideraciones

- **Archivos grandes:** Para CSVs muy grandes (decenas de miles de filas), la generacion del string puede tomar tiempo. Por ahora es aceptable ya que el limite de upload es 50MB. Si en el futuro se necesita, se puede mover a un Web Worker.
- **Encoding:** Se usa `charset=utf-8` en el Blob. Esto cubre la mayoria de casos. Caracteres especiales del CSV original se preservan porque `dataStore.getRows()` ya los tiene parseados.
- **Filtrado de filas futuro:** Cuando se implemente el filtrado de filas (el ColumnFilterInput actualmente es estatico), habra que extender la opcion "Export Filtered" para tambien filtrar filas. El diseno actual lo facilita: solo hay que pasar las filas filtradas en vez de `dataStore.getRows()`.
- **Dropdown z-index:** Usar `z-20` (mismo que column visibility dropdown) para evitar conflictos con otros elementos.
