# Plan: UI de la pagina Visualizer

## 1. Analisis de la UI del diseno

### Estructura de layout

El diseno muestra la estructura estandar de AppLayout (sidebar + main), con el area principal dividida en 4 zonas verticales:

1. **Header** (h-16): Breadcrumb con ruta `Home / Visualizer / <nombre_archivo>` a la izquierda, buscador global a la derecha.
2. **Toolbar** (px-8 py-6): Titulo "Data Preview" con subtitulo de conteo de registros, mas controles de filtrado y exportacion.
3. **Tabla CSV** (flex-1): Contenedor con borde redondeado que contiene la tabla con scroll, headers sticky y filas zebra.
4. **Paginacion** (footer de tabla): Selector "Rows per page" a la izquierda, controles de pagina a la derecha.

### Componentes identificados en el diseno

- Breadcrumb con 3 niveles (home icon / Visualizer / nombre archivo)
- Buscador global en header (input con icono search)
- Titulo de seccion con subtitulo de conteo
- Input de filtro de columnas (con icono filter_alt)
- Boton "Filter" (con icono tune)
- Boton "Export" con dropdown indicator (primario, con icono download)
- Tabla con headers sortables (iconos unfold_more / arrow_downward / filter_list)
- Celdas de datos con estilos diferenciados (mono para IDs y precios, badges para categorias)
- CategoryBadge con colores por tipo (azul=Electronics, naranja=Furniture, morado=Accessories)
- Boton de edicion por fila (visible solo en hover)
- Selector de rows-per-page (select con opciones 10/25/50)
- Controles de paginacion (first/prev/next/last con indicador "Page X of Y")

### Sistema de colores (ya definidos en global.css)

| Token | Valor | Uso |
|-------|-------|-----|
| `background-dark` | #121212 | Fondo tabla, inputs |
| `surface-dark` | #1A1C1E | Fondo main area |
| `surface-card` | #24272B | Headers tabla, filas alternas, footer |
| `text-off-white` | #F5F5F7 | Texto principal |
| `text-light-gray` | #A1A1AA | Texto secundario, labels |
| `border-dark` | #2D2F36 | Bordes, separadores |
| `vibrant-blue` | #3B82F6 | Acento, botones primarios, badges Electronics |

Colores adicionales para badges (Tailwind nativo):
- `blue-500/10`, `blue-400` -- Electronics
- `orange-500/10`, `orange-400` -- Furniture
- `purple-500/10`, `purple-400` -- Accessories

### Tipografia

- Font: Inter (ya cargada en Layout.astro)
- Titulo seccion: `text-xl font-bold tracking-tight`
- Subtitulo: `text-xs text-text-light-gray`
- Headers tabla: `text-sm font-semibold text-text-light-gray`
- Celdas: `text-sm`, producto con `font-medium text-white`
- IDs y precios: `font-mono`
- Badges: `text-xs font-medium`
- Paginacion: `text-xs`

---

## 2. Estructura de componentes Astro

### Jerarquia

```
pages/visualizer.astro
  AppLayout (contentClass personalizado)
    VisualizerHeader        (breadcrumb con nombre de archivo)
    DataToolbar             (titulo + filtros + export)
      ColumnFilterInput
      FilterButton
      ExportButton
    CSVTableContainer       (wrapper con borde redondeado)
      CSVTable              (tabla propiamente)
        CSVTableHeader      (thead con columnas sortables)
          SortableColumn
        CSVTableBody        (tbody con filas)
          CSVTableRow
            CategoryBadge
      TablePagination       (footer de tabla)
        RowsPerPageSelect
        PaginationControls
```

### Ubicacion en src/components/

```
src/components/visualizer/
  DataToolbar.astro
  ColumnFilterInput.astro
  FilterButton.astro
  ExportButton.astro
  CSVTable.astro
  CSVTableHeader.astro
  CSVTableRow.astro
  CategoryBadge.astro
  TablePagination.astro
```

---

## 3. Composicion del layout

### Pagina `visualizer.astro`

Usa `AppLayout` pero necesita un `contentClass` diferente al default. El diseno muestra:
- Header con h-16 y padding px-8 (diferente al PageHeader actual que usa py-6)
- El contenido principal no tiene padding propio en el layout; cada seccion gestiona su propio padding

**Cambio necesario en AppLayout**: El `PageHeader` actual no soporta breadcrumb multinivel ni el estilo visual del diseno (h-16 vs padding py-6). Se necesita que `visualizer.astro` pueda pasar su propio header o que `PageHeader` soporte un modo "breadcrumb" con slot.

**Propuesta**: La pagina `visualizer.astro` usara `AppLayout` con `contentClass="flex-1 overflow-hidden flex flex-col"` y `showSearch={false}` (ya que el search va en un header personalizado). Se incluira un header propio dentro del slot.

Alternativa preferida: Modificar `PageHeader` para aceptar un slot de breadcrumb y ajustar su estilo, pero esto puede romper otras paginas. Mejor opcion: la pagina visualizer monta su propio header dentro del contenido, sin usar `PageHeader`, pasando `showSearch={false}` y gestionando la barra de busqueda en su propio header.

**Ajuste en AppLayout**: Actualmente el PageHeader se renderiza siempre dentro del layout. Se necesita hacerlo condicional o permitir que la pagina use su propio header. La forma mas simple: agregar una prop `showHeader` (default true) a AppLayout. Si es false, no renderiza PageHeader y la pagina pone su propio header en el slot.

---

## 4. Componentes especificos del visualizer

### 4.1 DataToolbar.astro

- Seccion superior del area de contenido, debajo del header
- Contiene dos filas (flex-col en mobile, flex-row en desktop):
  - Izquierda: Titulo "Data Preview" (h2, text-xl font-bold) + subtitulo "Showing X rows from Y total records" (p, text-xs text-text-light-gray)
  - Derecha: Tres controles en linea
- Props: `fileName: string`, `showingRows: number`, `totalRecords: number`
- Clases contenedor: `flex-shrink-0 px-8 py-6`

### 4.2 ColumnFilterInput.astro

- Input con icono `filter_alt` a la izquierda
- Clases: `bg-background-dark border border-border-dark rounded-lg py-1.5 pl-9 pr-3 text-sm`
- Ancho: `w-full sm:w-64`
- Placeholder: "Filter columns..."
- Solo UI estatica, sin funcionalidad

### 4.3 FilterButton.astro

- Boton secundario con icono `tune` + texto "Filter"
- Clases: `bg-surface-card border border-border-dark rounded-lg px-3 py-1.5 text-sm font-medium text-text-light-gray`
- Hover: `hover:text-text-off-white hover:border-text-light-gray/50`

### 4.4 ExportButton.astro

- Boton primario con icono `download` + texto "Export" + icono `expand_more`
- Clases: `bg-vibrant-blue hover:bg-primary-hover text-white rounded-lg px-3 py-1.5 text-sm font-bold`
- Shadow: `shadow-lg shadow-vibrant-blue/20`

### 4.5 CSVTable.astro

- Contenedor wrapper: `bg-background-dark border border-border-dark rounded-xl flex flex-col shadow-inner overflow-hidden`
- Dentro: area de scroll (`overflow-auto flex-1`) + TablePagination
- La tabla interna: `w-full text-left text-sm whitespace-nowrap`

### 4.6 CSVTableHeader.astro

- `thead` con `bg-surface-card sticky top-0 z-10 shadow-sm`
- Cada `th` tiene `px-6 py-4 font-semibold text-text-light-gray border-b border-border-dark`
- Headers con icono de sort (`unfold_more`) o filtro (`filter_list`) segun columna
- Alineacion: la mayoria a la izquierda, columnas numericas a la derecha (`text-right`)
- Props: recibe array de nombres de columna (strings). En la UI estatica se renderizaran con datos de ejemplo.

### 4.7 CSVTableRow.astro

- Filas con zebra striping: alternas entre `bg-background-dark` y `bg-surface-card/20`
- Hover: `hover:bg-surface-card/40 transition-colors group`
- Celda ID: `font-mono text-text-light-gray`
- Celda producto: `font-medium text-white`
- Celda numerica/moneda: `text-right font-mono font-medium`
- Celda categoria: contiene `CategoryBadge`
- Ultima celda: boton edit que aparece con `opacity-0 group-hover:opacity-100`

### 4.8 CategoryBadge.astro

- Componente reutilizable que recibe un texto de categoria y aplica color
- Clases base: `inline-flex items-center px-2 py-0.5 rounded text-xs font-medium`
- Mapeo de colores (hardcoded para la UI estatica):
  - Electronics: `bg-blue-500/10 text-blue-400 border border-blue-500/20`
  - Furniture: `bg-orange-500/10 text-orange-400 border border-orange-500/20`
  - Accessories: `bg-purple-500/10 text-purple-400 border border-purple-500/20`
  - Default: `bg-gray-500/10 text-gray-400 border border-gray-500/20`
- Props: `category: string`

### 4.9 TablePagination.astro

Diferente al `Pagination.astro` existente en `/files` (aquel tiene botones prev/next con page numbers). Este diseno usa un estilo distinto:

- Contenedor: `border-t border-border-dark bg-surface-card p-3 flex items-center justify-between`
- Izquierda: "Rows per page:" + select (10/25/50)
- Derecha: botones first_page / chevron_left / "Page X of Y" / chevron_right / last_page
- Los botones: `p-1 rounded hover:bg-white/10`

Este componente es nuevo y no debe reutilizar el `Pagination.astro` de files, ya que tiene un diseno visual distinto.

---

## 5. Especificaciones de estilo

### Paleta de colores

Todos los colores ya estan definidos en `src/styles/global.css` via `@theme`. No se necesitan nuevas variables de color del tema. Los colores de badges usan utilidades nativas de Tailwind (blue-500, orange-500, purple-500).

### Tipografia

- Ya esta cargada Inter desde Google Fonts en `Layout.astro`
- No se requieren cambios en la configuracion de fuentes

### Espaciado

- Padding general del contenido: `px-8`
- Toolbar: `py-6`
- Celdas tabla: `px-6 py-3.5`
- Headers tabla: `px-6 py-4`
- Footer paginacion: `p-3`

### Bordes redondeados

- Contenedor tabla: `rounded-xl`
- Inputs y botones: `rounded-lg`
- Badges: `rounded` (4px)

### Estados hover

- Filas tabla: `hover:bg-surface-card/40`
- Boton edit en fila: `opacity-0 group-hover:opacity-100`
- Headers sortables: `hover:text-text-off-white`
- Botones toolbar: hover definido en cada componente
- Botones paginacion: `hover:bg-white/10`

### Responsive

- Toolbar: `flex-col` en mobile, `flex-row` en `sm:`
- Input filtro: `w-full sm:w-64`
- La tabla usa `overflow-auto` para scroll horizontal en pantallas pequenas
- El sidebar ya es fixed width (w-64) - no cambia

---

## 6. Consideraciones de accesibilidad y estructura semantica

### Elementos semanticos

- `<header>` para la barra superior con breadcrumb
- `<nav>` con `aria-label="Breadcrumb"` para la navegacion breadcrumb
- `<section>` con `aria-labelledby` para el area de Data Preview
- `<table>` con `<thead>` y `<tbody>` correctamente estructurados
- `<th scope="col">` en todos los headers de tabla
- `<button>` para todos los controles interactivos (no `<div>` clicables)
- `<select>` con `<label>` asociado para "Rows per page"

### ARIA

- Breadcrumb: `<nav aria-label="Breadcrumb">` con `<ol>` y separadores `aria-hidden="true"`
- Botones de sort en headers: `aria-label="Sort by [column name]"`
- Boton de edicion en filas: `aria-label="Edit row"`
- Botones de paginacion: `aria-label="First page"`, `aria-label="Previous page"`, etc.
- Botones disabled: `aria-disabled="true"` ademas de `disabled`
- Input de busqueda: `aria-label="Search application"`
- Input de filtro: `aria-label="Filter columns"`

### Orden DOM

- El orden visual coincide con el orden del DOM (header -> toolbar -> tabla -> paginacion)
- No se requiere reordenamiento CSS que rompa la accesibilidad

---

## 7. Archivos a crear/modificar

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/layouts/AppLayout.astro` | Agregar prop `showHeader?: boolean` (default true). Si es false, no renderizar `PageHeader`. Esto permite que visualizer use su propio header. |

### Archivos a crear

| Archivo | Descripcion |
|---------|-------------|
| `src/pages/visualizer.astro` | Pagina principal. Usa AppLayout con `showHeader={false}` y `contentClass` personalizado. Monta su propio header con breadcrumb, luego DataToolbar, CSVTable con datos de ejemplo hardcodeados. |
| `src/components/visualizer/DataToolbar.astro` | Barra de titulo + controles (filtro, filter, export). Contiene ColumnFilterInput, FilterButton, ExportButton inline. |
| `src/components/visualizer/ColumnFilterInput.astro` | Input con icono filter_alt para filtrar columnas. |
| `src/components/visualizer/FilterButton.astro` | Boton secundario "Filter" con icono tune. |
| `src/components/visualizer/ExportButton.astro` | Boton primario "Export" con icono download y expand_more. |
| `src/components/visualizer/CSVTable.astro` | Contenedor de tabla con scroll y borde redondeado. Incluye CSVTableHeader, filas de ejemplo y TablePagination. |
| `src/components/visualizer/CSVTableHeader.astro` | Thead con columnas sortables de ejemplo (ID, Date, Product, Category, Quantity, Total Revenue). |
| `src/components/visualizer/CSVTableRow.astro` | Fila de tabla con estilos zebra, celdas tipadas y boton edit en hover. |
| `src/components/visualizer/CategoryBadge.astro` | Badge de categoria con mapeo de color por nombre. |
| `src/components/visualizer/TablePagination.astro` | Footer de tabla con selector rows-per-page y controles de paginacion. |
| `src/components/visualizer/VisualizerHeader.astro` | Header con breadcrumb multinivel y buscador global. Reemplaza PageHeader en esta pagina. |

### Componentes existentes reutilizados

- `AppLayout.astro` -- layout principal (con modificacion menor)
- `Layout.astro` -- base HTML (sin cambios)
- `Sidebar.astro` -- sidebar de navegacion (sin cambios, solo marcar "Visualizer" como activo via `currentPath`)

### Componentes existentes NO reutilizados

- `Pagination.astro` de files -- diseno visual diferente, no compatible
- `PageHeader.astro` -- no soporta breadcrumb multinivel; se crea VisualizerHeader en su lugar

---

## 8. Datos de ejemplo para la UI estatica

La pagina se renderizara con datos hardcodeados para demostrar la UI:

- 8 filas de ejemplo (las mismas del diseno HTML)
- Headers: ID, Date, Product, Category, Quantity, Total Revenue
- Categorias: Electronics (azul), Furniture (naranja), Accessories (morado)
- Paginacion mostrando "Page 1 of 24", rows per page "10"
- Subtitulo: "Showing 50 rows from 12,403 total records"

---

## 9. Criterios de verificacion

1. La pagina `/visualizer` renderiza correctamente con el layout de AppLayout
2. El sidebar muestra "Visualizer" como item activo
3. El breadcrumb muestra "Home / Visualizer / sales_data_q3.csv"
4. La toolbar muestra titulo, subtitulo y los 3 controles
5. La tabla muestra 8 filas de ejemplo con zebra striping
6. Los badges de categoria tienen colores correctos por tipo
7. Los headers de tabla muestran iconos de sort
8. El boton de edit aparece solo en hover de fila
9. La paginacion muestra selector de rows-per-page y controles de pagina
10. No hay funcionalidad interactiva (todo estatico, solo UI)
11. Los elementos semanticos y ARIA estan presentes
12. La pagina no tiene errores de TypeScript (`pnpm astro check`)
13. El diseno coincide visualmente con el screenshot de referencia
