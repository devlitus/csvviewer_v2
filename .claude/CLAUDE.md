# CLAUDE.md

Guía para Claude al trabajar en este repositorio.
**Sistema operativo:** Windows

## Descripción del Proyecto

**CSV Viewer v2** es una aplicación web client-side para visualizar, gestionar y exportar archivos CSV.

- **Framework:** Astro 5 + TypeScript (strict) + Tailwind CSS 4
- **Persistencia:** IndexedDB (sin backend, todo client-side)
- **Interfaz:** Dark mode, responsive, componentes modulares
- **Estado:** Implementación en progreso (Fase 3 - Visualizer)

**Idioma:** Responde siempre en español.

## Comandos Principales

```bash
# Desarrollo
pnpm install    # Instalar dependencias
pnpm dev        # Servidor dev en http://localhost:4321
pnpm build      # Build producción → ./dist/
pnpm preview    # Previsualizar build producción

# Utilidades
pnpm commit     # Crear commits con Conventional Commits interactivo
```

**Nota:** En Windows, usar `pnpm` en PowerShell (ya instalado en el proyecto).

## Arquitectura

### Stack Tecnológico

- **Frontend Framework:** Astro 5 (SSR-ready con Vercel adapter)
- **Lenguaje:** TypeScript strict mode
- **Estilos:** Tailwind CSS 4 con tokens dark
- **Persistencia:** IndexedDB (cliente)
- **Parser CSV:** Custom `parseCSVString()` (sin librerías externas como csv-parse)
- **Iconos:** Material Symbols (Google Fonts)

### Estructura de Directorios

```text
src/
├── lib/                          # Lógica de negocio reutilizable
│   ├── types.ts                  # Tipos compartidos (CSVFile, CSVParseResult)
│   ├── indexeddb.ts              # API IndexedDB (saveFile, getFile, getAllFiles, deleteFiles)
│   ├── csvParser.ts              # Parser CSV custom con soporte quotes/multiline
│   ├── fileUpload.ts             # Validación de archivos (max 50MB, .csv solo)
│   ├── formatters.ts             # Formateo de datos (fechas, tamaños)
│   ├── htmlUtils.ts              # Utilidades HTML
│   └── pageInit.ts               # Inicialización de páginas (onPageLoad)
│
├── scripts/                      # Scripts client-side por página
│   ├── uploadPage.ts             # Drag & drop, upload, vista recientes
│   ├── filesPage.ts              # Entry point → delega a filesPage/
│   ├── filesPage/                # Módulos de filesPage
│   │   ├── index.ts              # Barrel export
│   │   ├── config.ts
│   │   ├── core/                 # Estado y selección
│   │   │   ├── index.ts
│   │   │   ├── fileStore.ts
│   │   │   ├── paginationManager.ts
│   │   │   └── selectionManager.ts
│   │   ├── delete/               # Lógica de eliminación
│   │   │   ├── index.ts
│   │   │   ├── singleDelete.ts
│   │   │   └── batchDelete.ts
│   │   ├── events/               # Manejo de eventos
│   │   │   ├── index.ts
│   │   │   ├── tableEventManager.ts
│   │   │   ├── deleteEventManager.ts
│   │   │   ├── selectionEventManager.ts
│   │   │   └── paginationEventManager.ts
│   │   ├── rendering/            # Renderizado dinámico
│   │   │   ├── index.ts
│   │   │   ├── tableRenderer.ts
│   │   │   ├── paginationRenderer.ts
│   │   │   ├── selectionBarRenderer.ts
│   │   │   └── emptyStateRenderer.ts
│   │   └── utils/                # Utilidades
│   │       ├── index.ts
│   │       ├── domSelectors.ts
│   │       ├── fileFormatting.ts
│   │       └── rowAnimations.ts
│   └── visualizerPage/           # Módulos del visualizador
│       ├── index.ts              # Entry point (patrón cleanup + init)
│       ├── config.ts
│       ├── core/                 # Estado de datos y paginación
│       │   ├── index.ts
│       │   ├── dataStore.ts
│       │   ├── paginationManager.ts
│       │   └── columnVisibilityManager.ts
│       ├── events/               # Manejo de eventos
│       │   ├── index.ts
│       │   ├── columnVisibilityEventManager.ts
│       │   ├── paginationEventManager.ts
│       │   └── rowsPerPageEventManager.ts
│       ├── rendering/            # Renderizado dinámico
│       │   ├── index.ts
│       │   ├── tableRenderer.ts
│       │   ├── headerRenderer.ts
│       │   ├── paginationRenderer.ts
│       │   ├── toolbarRenderer.ts
│       │   └── columnVisibilityRenderer.ts
│       ├── ui/                   # Estado UI
│       │   ├── index.ts
│       │   └── stateManager.ts
│       └── utils/                # Utilidades
│           ├── index.ts
│           ├── dataLoader.ts
│           └── domSelectors.ts
│
├── components/                   # Componentes Astro organizados por dominio
│   ├── ui/                       # Componentes genéricos reutilizables
│   │   ├── Button.astro
│   │   ├── SearchInput.astro
│   │   └── ConfirmationModal.astro
│   ├── layout/                   # Estructura principal
│   │   ├── PageHeader.astro
│   │   └── Sidebar.astro
│   ├── navigation/               # Navegación
│   │   └── NavItem.astro
│   ├── upload/                   # Feature: Upload
│   │   └── UploadZone.astro
│   ├── files/                    # Feature: Gestión de archivos
│   │   ├── FileTable.astro
│   │   ├── FileTableRow.astro
│   │   ├── FileIcon.astro
│   │   ├── StatusBadge.astro
│   │   ├── Pagination.astro
│   │   ├── RecentFileCard.astro
│   │   ├── RecentFilesSection.astro
│   │   └── SelectionBar.astro
│   └── visualizer/               # Feature: Visualización CSV
│       ├── CSVTable.astro
│       ├── CSVTableHeader.astro
│       ├── CSVTableRow.astro
│       ├── DataToolbar.astro
│       ├── ColumnFilterInput.astro
│       ├── FilterButton.astro
│       ├── ExportButton.astro
│       ├── CategoryBadge.astro
│       ├── TablePagination.astro
│       └── VisualizerHeader.astro
│
├── layouts/
│   ├── Layout.astro              # Base HTML, ViewTransitions, estilos globales
│   └── AppLayout.astro           # Sidebar + header + contenido
│
├── pages/
│   ├── index.astro               # / — Upload + archivos recientes
│   ├── files.astro               # /files — Gestión de archivos
│   ├── visualizer.astro          # /visualizer?file=<id> — Visualización
│   └── settings.astro            # /settings — Configuración (futura)
│
├── styles/
│   └── global.css                # Tokens de diseño, @theme Tailwind
└── assets/                       # Imágenes y recursos estáticos

docs/                             # Documentación de planes
├── README.md                     # Índice central
├── upload/
│   ├── plan-ui.md
│   └── plan-drag-drop-feature.md
├── files/
│   ├── plan-ui.md
│   ├── plan-indexeddb-integration.md
│   ├── plan-delete-feature.md
│   └── plan-refactoring.md
├── visualizer/
│   ├── plan-ui.md
│   ├── plan-indexeddb-integration.md
│   ├── plan-column-visibility-feature.md
│   ├── plan-fix-column-visibility-dropdown.md
│   └── plan-refactoring.md
└── validation/
    └── fase3-validation.md
```

### Flujo de Datos Principal

```text
1. UPLOAD (index.astro)
   Arrastra/selecciona CSV → validateFile → parseCSVString → saveFile(IndexedDB)

2. GESTIÓN (files.astro)
   getAllFiles() → tabla con paginación/selección/eliminación → click → /visualizer?file=<id>

3. VISUALIZACIÓN (visualizer.astro)
   getFile(id) → parseCSVString() → CSVTable con filtros, ordenamiento, visibilidad de columnas, exportación
```

### Patrones de Almacenamiento

**IndexedDB (`CSVViewerDB`):**

- Store: `files`
- Estructura `CSVFile`:

  ```typescript
  {
    id: string (UUID),
    filename: string,
    content: string (CSV raw),
    size: number (bytes),
    uploadDate: number (timestamp),
    rowCount?: number
  }
  ```

**API disponible:**

- `saveFile(csvFile: CSVFile)` → Promise<string> (id)
- `getFile(id: string)` → Promise<CSVFile | undefined>
- `getAllFiles()` → Promise<CSVFile[]>
- `deleteFiles(ids: string[])` → Promise<void>

### Comunicación Entre Componentes

| Patrón | Ejemplo |
|--------|---------|
| **Props Astro** | `<Button variant="primary" />` |
| **Data Attributes** | `[data-file-id]`, `[data-page-input]` para selección DOM |
| **Event Listeners** | `click`, `dragover`, `change` en scripts client-side |
| **Direct Imports** | `import { getAllFiles } from '../lib/indexeddb'` |
| **ViewTransitions** | `<ViewTransitions />` en Layout.astro para navegación SPA |

### Patrón de Inicialización de Página

Para evitar listeners duplicados y race conditions con ViewTransitions:

```typescript
onPageLoad(() => {
  cleanup();  // Elimina listeners y resetea estado ANTES de init
  initPage().catch(err => console.error("Failed to initialize:", err));
});

let isInitializing = false;

async function initPage(): Promise<void> {
  if (isInitializing) return;
  isInitializing = true;
  try {
    // Lógica de inicialización
  } finally {
    isInitializing = false;
  }
}
```

Implementado en `visualizerPage/index.ts`. Los demás scripts usan variantes parciales.

### Sistema de Diseño

**Colores (tokens CSS en `global.css`):**

```css
--color-primary: #007AFF
--color-vibrant-blue: #3B82F6
--color-surface-dark: #1A1C1E
--color-surface-card: #24272B
--color-text-off-white: #F5F5F7
--color-text-light-gray: #A1A1AA
--color-border-dark: #2D2F36
--color-background-dark: #121212
```

**Tipografía:** Inter — Heading: `text-xl font-bold tracking-tight`, Body: `text-sm`, Secondary: `text-xs text-text-light-gray`, Mono: `font-mono`

**Componentes UI:** Botones `bg-primary hover:bg-primary-hover`, Inputs `bg-background-dark border-border-dark`, Modales `bg-surface-dark border-border-dark rounded-lg`, Badges por categoría (blue/orange/purple)

## Convenciones de Código

### Nomenclatura

- **Componentes Astro:** `PascalCase.astro`
- **TypeScript:** `camelCase.ts` (funciones camelCase, constantes UPPER_SNAKE_CASE)
- **Módulos:** Carpetas por responsabilidad (`core/`, `events/`, `rendering/`, `utils/`) con `index.ts` barrel export
- **Tipos:** Centralizados en `src/lib/types.ts`

### Estructura de Componentes Astro

```astro
---
// 1. Type imports
import type { CSVFile } from "../lib/types";
// 2. External dependencies
// 3. Local imports (jerarquía: layouts → components → utils)

interface Props { variant?: 'primary' | 'secondary'; }
const { variant = 'primary' } = Astro.props as Props;
---
<div><slot /></div>
```

### TypeScript

- **Funciones:** `function` declarations en nivel raíz, arrow functions solo en callbacks
- **Tipos:** Siempre explícitos en parámetros y retorno. Nunca `any` ni `Function`
- **DOM:** Usar `data-*` attributes para selección, nunca IDs globales ni clases CSS

### Estilos

Preferencia: Tailwind utilities > CSS custom properties > bloques `<style>` (solo si Tailwind no cubre)

### Commits (Conventional Commits)

```text
type(scope): descripción

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

**Tipos:** `feat`, `fix`, `refactor`, `docs`, `test`, `style`, `chore`, `ci`, `perf`
**Scopes:** `upload`, `files`, `visualizer`, `ui`, `lib`, `parser`, `db`, `layout`, `build`, `docs`, `types`

## Restricciones Importantes

### NO HACER

- Crear rutas API (`/api/...`) → es client-only, usar IndexedDB
- Usar `csv-parse` → usar `parseCSVString()` de `lib/csvParser.ts`
- Acceder IndexedDB en Astro frontmatter → usar `<script>` o `src/scripts/`
- Crear estado global (store) → cada página es independiente
- Circular imports → respetar jerarquía: `lib → components → layouts → pages`

### HACER

- Props interface en componentes Astro
- Data attributes para selección DOM (`[data-file-id]`, `[data-delete-btn]`)
- Client scripts en `src/scripts/` para lógica interactiva
- Explicit typing en TypeScript

## Debugging

```bash
pnpm astro check   # Verificar TypeScript errors
pnpm build          # Build producción
pnpm preview        # Previsualizar build
```

**Problemas comunes:**

- **IndexedDB no persiste:** Verificar que estés en script client-side, no en Astro frontmatter
- **Tailwind no aplica:** Verificar que global.css esté importado en Layout.astro
- **CSV parser falla:** Validar encoding UTF-8 y quotes escapadas

## Estado Actual del Proyecto

- **Fase 1 (Upload):** ✅ Completada
- **Fase 2 (File Management):** ✅ Completada
- **Fase 3 (Visualizer):** 🔄 En progreso (UI, filtros, ordenamiento, visibilidad de columnas, exportación)

**Branch principal:** `main`
**Branch activa:** `feature/visualizer`

---

**Última actualización:** 31/01/2026
**Consulta `docs/README.md` antes de empezar cualquier tarea.**
