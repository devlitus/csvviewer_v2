# Plan: UI estatica de la pagina My Files

## Resumen

Implementar la UI presentacional de la pagina `/files` (My Files) siguiendo el diseno de referencia en `desing/csv_processor_home_and_upload_files/`. Solo UI estatica con datos mock, sin logica ni interactividad.

## Estado actual

- La pagina `src/pages/files.astro` **no existe** todavia.
- El layout `AppLayout.astro` ya provee sidebar + header con breadcrumb y buscador. Se reutiliza directamente.
- No existe directorio `src/components/files/` con componentes de tabla (solo `RecentFileCard.astro` y `RecentFilesSection.astro` que son para la pagina de upload, no para la tabla de archivos).

## Solucion propuesta

### Arquitectura de componentes

```
src/pages/files.astro                    -- Pagina principal (CREAR)
src/components/files/FileTable.astro     -- Contenedor tabla con borde y scroll (CREAR)
src/components/files/FileTableRow.astro  -- Fila individual de la tabla (CREAR)
src/components/files/StatusBadge.astro   -- Badge de estado (Processed/Mapping Needed/Error) (CREAR)
src/components/files/FileIcon.astro      -- Icono con fondo de color por tipo (CREAR)
src/components/files/Pagination.astro    -- Footer de paginacion (CREAR)
```

No se necesita modificar ningun componente existente. El `AppLayout` ya maneja sidebar, header con breadcrumb y search.

---

### 1. Crear `src/pages/files.astro`

Responsabilidad: Ensamblar la pagina usando AppLayout y los componentes de files.

**Estructura conceptual:**
- Importar `AppLayout` con `title="My Files"`
- Seccion de titulo: "My Files" (h1, `text-3xl font-black tracking-tight`) + descripcion + boton "Upload New"
- Componente `FileTable` con datos mock pasados por props

**Titulo y boton Upload New:**
- Contenedor `flex items-end justify-between`
- Lado izquierdo: h1 "My Files" + parrafo descriptivo
- Lado derecho: boton azul con icono `upload` y texto "Upload New"
  - Clases: `bg-vibrant-blue hover:bg-primary-hover text-white text-sm font-bold h-10 px-6 rounded-lg shadow-md flex items-center gap-2 transition-all`

**IMPORTANTE sobre el layout:** El `AppLayout` ya envuelve el contenido en un div con `px-8 py-8`. La pagina de files necesita que la tabla ocupe todo el alto disponible. Para esto, el slot content del AppLayout debe recibir un contenedor flex-col con `h-full` para que la tabla se expanda. Revisar si el `flex-1 overflow-y-auto px-8 py-8` del AppLayout es compatible con este requisito. Si no, hay dos opciones:

- **Opcion A (preferida):** Agregar `class` prop a AppLayout para customizar el contenedor del slot (ej: quitar overflow-y-auto y dejar que la tabla lo maneje internamente).
- **Opcion B:** Usar el contenido tal cual y que la tabla tenga max-height calculado.

Analizando el diseno de referencia, el area principal tiene: titulo fijo arriba + tabla que ocupa el resto con scroll interno. El `overflow-y-auto` de AppLayout deberia funcionar si la tabla usa `flex-1 overflow-hidden` dentro de un contenedor `h-full`. **Sin embargo**, como AppLayout ya aplica `py-8`, y el diseno muestra `pt-8 pb-8` con la tabla ocupando el resto, la solucion mas simple es:

**Modificar `AppLayout.astro`:** Agregar prop opcional `contentClass` para permitir customizar las clases del contenedor del slot. Por defecto mantiene `flex-1 overflow-y-auto px-8 py-8`. Para la pagina de files se pasaria algo como `flex-1 overflow-hidden flex flex-col px-8 pt-8`.

**Cambio en AppLayout.astro:**
- Agregar `contentClass?: string` a la interface Props
- Usar `contentClass` si se proporciona, o el valor por defecto `"flex-1 overflow-y-auto px-8 py-8"` si no

**Datos mock** (definidos en el frontmatter de files.astro):

```
Archivo mock con estructura:
{
  filename: string,
  date: string,
  size: string,
  status: "processed" | "mapping-needed" | "error",
  icon: string,        // Material Symbols icon name
  iconColor: string    // "green" | "blue" | "purple" | "red" | "gray"
}
```

6 archivos mock (exactos del diseno):

| filename | date | size | status | icon | iconColor |
|---|---|---|---|---|---|
| sales_data_q3.csv | 2 hours ago | 2.4 MB | processed | table_view | green |
| inventory_list_2023.xlsx | Yesterday, 4:20 PM | 840 KB | processed | inventory_2 | blue |
| client_contacts.csv | Oct 24, 2023 | 1.2 MB | mapping-needed | contacts | purple |
| monthly_report_v2.csv | Oct 22, 2023 | 4.5 MB | error | error | red |
| archived_marketing_leads.csv | Sep 15, 2023 | 12.1 MB | processed | analytics | gray |
| customer_feedback_survey.csv | Sep 08, 2023 | 3.1 MB | processed | dataset | blue |

---

### 2. Crear `src/components/files/StatusBadge.astro`

**Props:**
```typescript
interface Props {
  status: "processed" | "mapping-needed" | "error";
}
```

**Mapeo de status a estilos:**

| status | label | bg | text | border | dot |
|---|---|---|---|---|---|
| processed | Processed | bg-green-500/10 | text-green-400 | border-green-500/20 | bg-green-400 |
| mapping-needed | Mapping Needed | bg-orange-500/10 | text-orange-400 | border-orange-500/20 | bg-orange-400 |
| error | Error | bg-red-500/10 | text-red-400 | border-red-500/20 | bg-red-400 |

**Estructura HTML:**
- `span.inline-flex.items-center.gap-1.5.px-2.5.py-1.rounded-full.text-xs.font-medium.border`
- Dentro: dot (`span.w-1.5.h-1.5.rounded-full`) + texto del label

---

### 3. Crear `src/components/files/FileIcon.astro`

**Props:**
```typescript
interface Props {
  icon: string;
  color: "green" | "blue" | "purple" | "red" | "gray";
}
```

**Mapeo de color a clases:**

| color | bg | text |
|---|---|---|
| green | bg-green-500/10 | text-green-400 |
| blue | bg-vibrant-blue/10 | text-vibrant-blue |
| purple | bg-purple-500/10 | text-purple-400 |
| red | bg-red-500/10 | text-red-400 |
| gray | bg-gray-500/10 | text-gray-400 |

**Estructura HTML:**
- `div.p-2.rounded-lg` con clases de bg y text segun color
- Dentro: `span.material-symbols-outlined` con font-size 22px y el icono

---

### 4. Crear `src/components/files/FileTableRow.astro`

**Props:**
```typescript
interface Props {
  filename: string;
  date: string;
  size: string;
  status: "processed" | "mapping-needed" | "error";
  icon: string;
  iconColor: "green" | "blue" | "purple" | "red" | "gray";
}
```

**Estructura HTML:**
- `tr.hover:bg-white/5.transition-colors.cursor-pointer.group`
- 5 columnas (`td.px-6.py-4`):
  1. **File Name:** `div.flex.items-center.gap-3` con `FileIcon` + nombre (`span.text-sm.font-semibold.text-text-off-white.group-hover:text-vibrant-blue.transition-colors`)
  2. **Date:** `text-sm.text-text-light-gray`
  3. **Size:** `text-sm.text-text-light-gray`
  4. **Status:** `StatusBadge` con el status correspondiente
  5. **Actions:** boton `more_vert` (solo visual, sin funcionalidad) con `text-text-light-gray.hover:text-text-off-white.p-1.rounded-md.hover:bg-white/10.transition-colors`

---

### 5. Crear `src/components/files/FileTable.astro`

**Props:**
```typescript
interface Props {
  files: Array<{
    filename: string;
    date: string;
    size: string;
    status: "processed" | "mapping-needed" | "error";
    icon: string;
    iconColor: "green" | "blue" | "purple" | "red" | "gray";
  }>;
}
```

**Estructura HTML:**
- Contenedor: `div.flex-1.border.border-border-dark/50.rounded-xl.bg-background-dark.overflow-hidden.flex.flex-col`
- Area scrollable: `div.overflow-y-auto.flex-1`
  - `table.w-full.text-left.border-collapse`
  - `thead.sticky.top-0.bg-background-dark.border-b.border-border-dark.z-10`
    - 4 columnas visibles + 1 vacia para acciones
    - Headers: `th.px-6.py-4.text-xs.font-semibold.text-text-light-gray.uppercase.tracking-wider`
    - Textos: "FILE NAME", "DATE UPLOADED", "FILE SIZE", "STATUS"
  - `tbody.divide-y.divide-border-dark/40`
    - Iterar `files` y renderizar `FileTableRow` por cada uno
- Footer: componente `Pagination`

---

### 6. Crear `src/components/files/Pagination.astro`

**Props:**
```typescript
interface Props {
  currentPage?: number;
  totalPages?: number;
  showing?: string;
  totalFiles?: number;
}
```

Todos con valores por defecto (1, 7, "1-6", 42) para datos mock.

**Estructura HTML:**
- `div.border-t.border-border-dark.px-6.py-4.flex.items-center.justify-between.bg-background-dark.mt-auto`
- Lado izquierdo: "Showing **1-6** of **42** files" (`text-xs.text-text-light-gray`, numeros en `text-text-off-white.font-medium`)
- Lado derecho: `div.flex.items-center.gap-2`
  - Boton prev (chevron_left) deshabilitado: `p-1.5.rounded-lg.border.border-border-dark.text-text-light-gray.disabled:opacity-30`
  - Boton pagina activa (1): `px-3.py-1.5.rounded-lg.border.border-vibrant-blue.bg-vibrant-blue/10.text-vibrant-blue.text-xs.font-bold`
  - Botones paginas inactivas (2, 3): `px-3.py-1.5.rounded-lg.border.border-border-dark.text-text-light-gray.hover:bg-white/5.text-xs.font-medium`
  - Elipsis "..."
  - Boton next (chevron_right): mismas clases que prev pero sin disabled

---

## Orden de implementacion

1. Modificar `src/layouts/AppLayout.astro` -- agregar prop `contentClass`
2. Crear `src/components/files/StatusBadge.astro`
3. Crear `src/components/files/FileIcon.astro`
4. Crear `src/components/files/FileTableRow.astro`
5. Crear `src/components/files/Pagination.astro`
6. Crear `src/components/files/FileTable.astro`
7. Crear `src/pages/files.astro`

## Archivos a modificar

| Archivo | Accion | Descripcion |
|---|---|---|
| `src/layouts/AppLayout.astro` | MODIFICAR | Agregar prop `contentClass` opcional |
| `src/components/files/StatusBadge.astro` | CREAR | Badge de estado con 3 variantes |
| `src/components/files/FileIcon.astro` | CREAR | Icono con fondo de color |
| `src/components/files/FileTableRow.astro` | CREAR | Fila de tabla con todos los datos |
| `src/components/files/Pagination.astro` | CREAR | Paginacion estatica mock |
| `src/components/files/FileTable.astro` | CREAR | Tabla completa con header y body |
| `src/pages/files.astro` | CREAR | Pagina completa ensamblada |

## Dependencias nuevas

Ninguna. Todo se resuelve con Astro + Tailwind CSS + Material Symbols (ya cargados).

## Riesgos y consideraciones

1. **Colores Tailwind arbitrarios:** Las clases `bg-green-500/10`, `text-green-400`, `bg-purple-500/10`, etc. usan colores del sistema de Tailwind que no estan definidos en el theme custom. En Tailwind CSS 4, estos colores estan disponibles por defecto. Verificar que funcionen correctamente en el build.

2. **Scroll de la tabla:** El diseno requiere que la tabla tenga scroll interno mientras el header de pagina (titulo + boton) permanece fijo. Esto requiere que el contenedor del slot en AppLayout permita un layout flex-col sin overflow propio. La modificacion de `contentClass` resuelve esto.

3. **Responsive:** El diseno de referencia es desktop-only. No se incluyen adaptaciones mobile en esta fase.

## Criterios de verificacion

1. La pagina `/files` renderiza sin errores
2. El sidebar muestra "My Files" como activo (ya funciona via `currentPath`)
3. El breadcrumb muestra "home / My Files"
4. El titulo "My Files" con descripcion y boton "Upload New" se muestra correctamente
5. La tabla muestra 6 filas con los datos mock exactos del diseno
6. Los iconos tienen el color correcto segun el tipo de archivo
7. Los badges de estado muestran los 3 estados distintos con colores correctos
8. La paginacion muestra "Showing 1-6 of 42 files" con botones de pagina
9. La tabla tiene scroll interno si el contenido excede el area visible
10. Los hovers funcionan: fila resalta, nombre cambia a azul, boton more_vert visible
