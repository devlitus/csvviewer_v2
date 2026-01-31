# Plan: Filtrado de Visibilidad de Columnas en el Visualizador

## 1. Resumen

Implementar un control en la toolbar del visualizador que permita al usuario mostrar/ocultar columnas del CSV mediante un dropdown con checkboxes. Esto mejora la experiencia al trabajar con CSVs que tienen muchas columnas, permitiendo enfocarse solo en las relevantes.

## 2. Analisis del Estado Actual

### Arquitectura existente

El visualizador sigue un patron bien definido de modulos:

- **`DataStore`** (`src/scripts/visualizerPage/core/dataStore.ts`): Almacena `columns: string[]` y `rows: Record<string, string>[]`. Las columnas se obtienen con `getColumns()`.
- **`TableRenderer`** (`src/scripts/visualizerPage/rendering/tableRenderer.ts`): Recibe `columns` en `renderHeader()` y `renderBody()`. Itera sobre el array de columnas para generar `<th>` y `<td>`.
- **`renderUI()`** en `index.ts`: Orquesta todo. Llama `tableRenderer.renderHeader(columns)` y `tableRenderer.renderBody(columns, rows, start, end)`.
- **`DataToolbar.astro`**: Contiene `ColumnFilterInput` (input de texto para filtrar), `FilterButton` y `ExportButton`.

### Componentes relevantes en la toolbar

| Componente | Funcion actual |
|---|---|
| `ColumnFilterInput.astro` | Input de texto con placeholder "Filter columns..." - actualmente sin logica conectada |
| `FilterButton.astro` | Boton "Filter" con icono `tune` - actualmente sin logica conectada |

### Punto clave

`TableRenderer.renderHeader()` y `renderBody()` ya reciben el array de columnas como parametro. Si se pasa un subconjunto filtrado de columnas, la tabla se renderiza correctamente solo con esas columnas. **No requiere cambios en TableRenderer**.

## 3. Solucion Propuesta

### Estrategia: ColumnVisibilityManager + Dropdown UI

Crear un nuevo manager de estado (`ColumnVisibilityManager`) que mantenga un `Set<string>` de columnas visibles, y un nuevo componente dropdown que permita togglear la visibilidad.

### Flujo de datos

```
DataStore.getColumns()          --> todas las columnas del CSV
                                      |
ColumnVisibilityManager         --> filtra cuales son visibles
                                      |
renderUI() pasa columnas        --> TableRenderer recibe solo las visibles
filtradas a TableRenderer
```

### Justificacion

- **Minimo impacto**: No se modifica `TableRenderer` ni `DataStore`. Solo se interpone un filtro entre ambos.
- **Patron existente**: Sigue la misma arquitectura de managers + renderers + events del modulo.
- **Sin dependencias nuevas**: Todo se resuelve con DOM nativo y TypeScript.

## 4. Detalles de Implementacion

### 4.1. Nuevo archivo: `src/scripts/visualizerPage/core/columnVisibilityManager.ts`

**Responsabilidad**: Mantener el estado de columnas visibles.

**API propuesta**:
- `constructor()` - Inicializa sin columnas
- `initFromColumns(allColumns: string[]): void` - Marca todas como visibles al cargar
- `toggle(column: string): void` - Alterna visibilidad de una columna
- `setAll(visible: boolean): void` - Seleccionar/deseleccionar todas
- `isVisible(column: string): boolean` - Consulta individual
- `getVisibleColumns(): string[]` - Retorna array ordenado de columnas visibles (mantiene orden original)
- `getVisibleCount(): number` - Cantidad de columnas visibles
- `getTotalCount(): number` - Total de columnas

**Restriccion**: Debe impedir que se deseleccionen todas las columnas. Si solo queda una visible y se intenta deseleccionar, no hace nada y retorna `false`.

### 4.2. Nuevo componente: `src/components/visualizer/ColumnVisibilityDropdown.astro`

**Estructura HTML** (solo el shell estatico, el contenido se llena por script):

```
<div data-column-visibility-wrapper class="relative">
  <!-- Boton trigger -->
  <button data-column-visibility-trigger>
    <span class="material-symbols-outlined">view_column</span>
    Columns
    <span data-column-visibility-count class="...badge...">5/8</span>
  </button>

  <!-- Dropdown panel -->
  <div data-column-visibility-dropdown class="hidden absolute ...">
    <!-- Header con Select All / Deselect All -->
    <div data-column-visibility-actions>
      <button data-column-select-all>Select All</button>
      <button data-column-deselect-all>Deselect All</button>
    </div>

    <!-- Separador -->
    <div class="border-t border-border-dark"></div>

    <!-- Lista de checkboxes (renderizada dinamicamente) -->
    <div data-column-visibility-list class="max-h-64 overflow-y-auto">
      <!-- Generado por script: -->
      <!-- <label data-column-item="NombreColumna">
             <input type="checkbox" checked data-column-check="NombreColumna">
             NombreColumna
           </label> -->
    </div>
  </div>
</div>
```

**Estilos Tailwind del dropdown**:
- Fondo: `bg-surface-card border border-border-dark rounded-lg shadow-lg`
- Posicion: `absolute right-0 top-full mt-2 z-20 w-56`
- Lista scrollable: `max-h-64 overflow-y-auto` (para CSVs con muchas columnas)
- Items: `px-3 py-2 hover:bg-white/5 cursor-pointer flex items-center gap-2 text-sm text-text-off-white`
- Checkboxes: `accent-vibrant-blue` (Tailwind 4 soporta esto)

**Wireframe ASCII**:

```
  [Columns 5/8 v]
  +-------------------------+
  | [Select All] [Deselect] |
  |-------------------------|
  | [x] ID                  |
  | [x] Date                |
  | [ ] Product             |
  | [x] Category            |
  | [x] Quantity            |
  | [ ] Total Revenue       |
  | [ ] Region              |
  | [x] Status              |
  +-------------------------+
```

### 4.3. Nuevo archivo: `src/scripts/visualizerPage/events/columnVisibilityEventManager.ts`

**Responsabilidad**: Manejar eventos del dropdown.

**Eventos a gestionar**:
- Click en `[data-column-visibility-trigger]` --> toggle dropdown (agregar/quitar clase `hidden`)
- Click fuera del dropdown --> cerrar (listener en `document` con check de `contains`)
- Change en `[data-column-check]` --> llamar `columnVisibilityManager.toggle(column)` y re-renderizar tabla
- Click en `[data-column-select-all]` --> `manager.setAll(true)`, actualizar checkboxes, re-render
- Click en `[data-column-deselect-all]` --> `manager.setAll(false)` (dejara al menos 1), actualizar checkboxes, re-render
- Tecla `Escape` --> cerrar dropdown

**Patron**: Seguir el mismo estilo de `PaginationEventManager` con metodo `cleanup()` que remueve todos los listeners.

### 4.4. Nuevo archivo: `src/scripts/visualizerPage/rendering/columnVisibilityRenderer.ts`

**Responsabilidad**: Renderizar la lista de checkboxes y actualizar el badge de conteo.

**Metodos**:
- `renderList(allColumns: string[], visibleColumns: Set<string>): void` - Genera los checkboxes en `[data-column-visibility-list]`
- `updateCount(visible: number, total: number): void` - Actualiza el badge `[data-column-visibility-count]`
- `updateCheckbox(column: string, checked: boolean): void` - Actualiza un checkbox individual sin re-renderizar todo

### 4.5. Modificaciones a archivos existentes

#### `src/components/visualizer/DataToolbar.astro`

- Importar `ColumnVisibilityDropdown.astro`
- Agregar el componente en la seccion de controles (lado derecho), entre `ColumnFilterInput` y `FilterButton`

#### `src/scripts/visualizerPage/index.ts`

- Importar `ColumnVisibilityManager`
- Importar `ColumnVisibilityEventManager`
- Importar `ColumnVisibilityRenderer`
- En `initVisualizerPage()`: instanciar los tres nuevos modulos
- En `renderUI()`: obtener columnas visibles del manager en lugar de todas las columnas del dataStore
- Cambiar: `const columns = dataStore.getColumns()` --> `const columns = columnVisibilityManager.getVisibleColumns()`
- Despues de `dataStore.setData(...)`: llamar `columnVisibilityManager.initFromColumns(result.columns)`
- En `setupEvents()`: configurar `columnVisibilityEvents`
- En `cleanup()`: llamar `columnVisibilityEvents.cleanup()`

#### `src/scripts/visualizerPage/core/index.ts`

- Exportar `ColumnVisibilityManager`

#### `src/scripts/visualizerPage/rendering/index.ts`

- Exportar `ColumnVisibilityRenderer`

#### `src/scripts/visualizerPage/events/index.ts`

- Exportar `ColumnVisibilityEventManager`

#### `src/scripts/visualizerPage/utils/domSelectors.ts`

- Agregar selectores:
  - `COLUMN_VISIBILITY_TRIGGER = '[data-column-visibility-trigger]'`
  - `COLUMN_VISIBILITY_DROPDOWN = '[data-column-visibility-dropdown]'`
  - `COLUMN_VISIBILITY_LIST = '[data-column-visibility-list]'`
  - `COLUMN_VISIBILITY_COUNT = '[data-column-visibility-count]'`
  - `COLUMN_SELECT_ALL = '[data-column-select-all]'`
  - `COLUMN_DESELECT_ALL = '[data-column-deselect-all]'`

### 4.6. Orden de implementacion

1. Crear `ColumnVisibilityManager` (core, sin DOM) - testeable de forma aislada
2. Crear `ColumnVisibilityDropdown.astro` (shell HTML estatico)
3. Modificar `DataToolbar.astro` para incluir el nuevo componente
4. Agregar selectores en `domSelectors.ts`
5. Crear `ColumnVisibilityRenderer` (renderizado de checkboxes y badge)
6. Crear `ColumnVisibilityEventManager` (eventos del dropdown)
7. Modificar `index.ts` para integrar todo en el flujo existente
8. Actualizar los barrel exports (`core/index.ts`, `rendering/index.ts`, `events/index.ts`)

## 5. Criterios de Validacion

- [ ] Al cargar un CSV, todas las columnas estan visibles por defecto
- [ ] El badge muestra "N/N" (ej: "8/8") al inicio
- [ ] Click en boton "Columns" abre el dropdown
- [ ] Click fuera del dropdown lo cierra
- [ ] Tecla Escape cierra el dropdown
- [ ] Deseleccionar una columna la oculta inmediatamente de la tabla (header y body)
- [ ] El badge se actualiza al cambiar visibilidad (ej: "5/8")
- [ ] "Select All" marca todas las columnas y las muestra
- [ ] "Deselect All" deja al menos una columna visible
- [ ] No se puede deseleccionar la ultima columna visible
- [ ] La paginacion sigue funcionando correctamente con columnas filtradas
- [ ] CSVs con 50+ columnas muestran lista scrollable en el dropdown
- [ ] El estado se mantiene al cambiar de pagina (paginacion)
- [ ] Al navegar fuera y volver (View Transitions), el estado se reinicia correctamente (cleanup)

## 6. Riesgos y Consideraciones

### Rendimiento con muchas columnas
- **Riesgo**: CSVs con 50+ columnas podrian generar un dropdown largo.
- **Mitigacion**: `max-h-64 overflow-y-auto` en la lista. Opcionalmente, agregar un mini-buscador en el dropdown para filtrar columnas por nombre (mejora futura, no incluida en este plan).

### Interaccion con filtros de datos existentes
- **Riesgo**: `ColumnFilterInput.astro` tiene placeholder "Filter columns..." que podria confundirse con esta feature.
- **Mitigacion**: Renombrar el placeholder de `ColumnFilterInput` a "Search in data..." o similar para diferenciarlo. `ColumnFilterInput` filtra filas por contenido; el nuevo dropdown filtra columnas por visibilidad.

### Interaccion con ordenamiento
- **Riesgo**: Si una columna esta ordenada y se oculta, el orden se mantiene pero el indicador visual desaparece.
- **Consideracion**: No es un problema funcional. Cuando se implemente sorting, el estado de sort deberia resetearse si la columna ordenada se oculta.

### Exportacion
- **Consideracion**: Al exportar, deberia exportarse solo las columnas visibles o todas? Se recomienda exportar solo las visibles, ya que es la intencion del usuario al filtrar. Esto es una decision de producto que puede definirse cuando se implemente la exportacion.

### Accesibilidad
- El dropdown debe tener `role="menu"` y los items `role="menuitemcheckbox"`.
- El boton trigger debe tener `aria-expanded="true|false"` y `aria-haspopup="true"`.
- Navegacion con teclado dentro del dropdown (Tab entre checkboxes) funciona nativamente con `<input type="checkbox">`.
