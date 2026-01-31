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

```
src/
├── lib/                          # Lógica de negocio reutilizable
│   ├── types.ts                  # Tipos compartidos (CSVFile, CSVParseResult)
│   ├── indexeddb.ts              # API IndexedDB (saveFile, getFile, getAllFiles, deleteFiles)
│   ├── csvParser.ts              # Parser CSV custom con soporte quotes/multiline
│   ├── fileUpload.ts             # Validación de archivos (max 50MB, .csv solo)
│   ├── formatters.ts             # Formateo de datos (fechas, tamaños)
│   ├── htmlUtils.ts              # Utilidades HTML
│   └── pageInit.ts               # Inicialización de páginas
│
├── scripts/                      # Scripts client-side por página
│   ├── uploadPage.ts             # Drag & drop, upload, vista recientes
│   ├── filesPage.ts              # Tabla, paginación, eliminación (568 líneas)
│   └── filesPage/                # Módulos de filesPage
│       ├── config.ts
│       ├── core/                 # Estado y selección
│       │   ├── fileStore.ts
│       │   ├── paginationManager.ts
│       │   └── selectionManager.ts
│       ├── delete/               # Lógica de eliminación
│       │   ├── singleDelete.ts
│       │   └── batchDelete.ts
│       ├── events/               # Manejo de eventos
│       │   ├── tableEventManager.ts
│       │   ├── deleteEventManager.ts
│       │   ├── selectionEventManager.ts
│       │   └── paginationEventManager.ts
│       ├── rendering/            # Renderizado dinámico
│       │   ├── tableRenderer.ts
│       │   ├── paginationRenderer.ts
│       │   ├── selectionBarRenderer.ts
│       │   └── emptyStateRenderer.ts
│       └── utils/                # Utilidades
│
├── components/                   # Componentes Astro organizados por dominio
│   ├── ui/                       # Componentes genéricos reutilizables
│   │   ├── Button.astro
│   │   ├── SearchInput.astro
│   │   ├── ConfirmationModal.astro
│   │   └── ...otros
│   ├── layout/                   # Estructura principal
│   │   ├── PageHeader.astro
│   │   └── Sidebar.astro
│   ├── navigation/               # Navegación
│   │   └── NavItem.astro
│   ├── upload/                   # Feature: Upload
│   │   └── UploadZone.astro      # Drag & drop, input file
│   ├── files/                    # Feature: Gestión de archivos
│   │   ├── FileTable.astro       # Tabla de archivos
│   │   ├── FileTableRow.astro    # Fila individual
│   │   ├── FileIcon.astro        # Icono con color
│   │   ├── StatusBadge.astro     # Badge de estado
│   │   ├── Pagination.astro      # Footer de paginación
│   │   ├── RecentFileCard.astro  # Card para vista recientes
│   │   ├── RecentFilesSection.astro
│   │   └── SelectionBar.astro    # Barra flotante de selección
│   └── visualizer/               # Feature: Visualización CSV
│       ├── CSVTable.astro        # Tabla de datos
│       ├── CSVTableHeader.astro  # Headers sortables
│       ├── CSVTableRow.astro     # Fila con estilos
│       ├── DataToolbar.astro     # Filtros y exportación
│       ├── ColumnFilterInput.astro
│       ├── FilterButton.astro
│       ├── ExportButton.astro
│       ├── CategoryBadge.astro   # Badge de categoría
│       ├── TablePagination.astro
│       └── VisualizerHeader.astro
│
├── layouts/                      # Layouts Astro
│   ├── Layout.astro              # Base HTML, ViewTransitions, estilos globales
│   └── AppLayout.astro           # Sidebar + header + contenido
│
├── pages/                        # Páginas (rutas)
│   ├── index.astro               # / — Upload + archivos recientes
│   ├── files.astro               # /files — Gestión de archivos
│   ├── visualizer.astro          # /visualizer?file=<id> — Visualización
│   └── settings.astro            # /settings — Configuración (futura)
│
├── assets/                       # Imágenes y recursos estáticos
├── styles/                       # Estilos globales
│   └── global.css               # Tokens de diseño, @theme Tailwind
└── public/                       # Archivos públicos
    └── images/

docs/                            # Documentación de planes
├── README.md                     # Índice central
├── upload/                       # Módulo Upload
├── files/                        # Módulo Files
├── visualizer/                   # Módulo Visualizer
└── validation/                   # Checklists de validación
```

### Flujo de Datos Principal

```
┌─────────────────────────────────────────────────────────────┐
│                    CSV VIEWER v2 FLOW                        │
└─────────────────────────────────────────────────────────────┘

1. UPLOAD (index.astro)
   User: Arrastra CSV o selecciona archivo
     ↓
   UploadZone: Validación (validateFile)
     ↓
   parseCSVString: Parsea contenido CSV
     ↓
   IndexedDB: saveFile() → genera UUID, almacena CSVFile
     ↓
   UI: Actualiza RecentFilesSection

2. GESTIÓN (files.astro)
   filesPage.ts: Carga getAllFiles() → renderiza tabla
     ↓
   Interacción: Seleccionar, paginar, eliminar
     ↓
   deleteFiles(ids) → refresca tabla
     ↓
   Navegación: Click en archivo → /visualizer?file=<id>

3. VISUALIZACIÓN (visualizer.astro)
   URL query: file=<id>
     ↓
   getFile(id) → obtiene CSVFile
     ↓
   parseCSVString() → convierte a tabla
     ↓
   CSVTable: Renderiza con filtros, ordenamiento, badges
     ↓
   ExportButton: Descarga CSV o Excel
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

| Patrón | Uso | Ejemplo |
|--------|-----|---------|
| **Props Astro** | Pasar datos entre componentes | `<Button variant="primary" />` |
| **Frontmatter Astro** | Server-side logic en páginas | `const files = await getAllFiles()` |
| **Data Attributes** | Selección DOM en scripts | `[data-file-id]`, `[data-page-input]` |
| **Event Listeners** | Interactividad client-side | `click`, `dragover`, `change` |
| **Direct Imports** | Lógica compartida | `import { getAllFiles } from '../lib/indexeddb'` |
| **ViewTransitions** | Navegación sin reload | `<ViewTransitions />` en Layout.astro |

### Patrones de Inicialización de Página

Para evitar listeners duplicados y race conditions de ViewTransitions, se recomienda el siguiente patrón en scripts de página (`uploadPage.ts`, `filesPage.ts`, `visualizerPage/index.ts`):

```typescript
// ✅ Correcto - Cleanup ANTES de init
onPageLoad(() => {
  cleanup();  // Elimina listeners y resetea estado
  initPage().catch(err => {
    console.error("Failed to initialize page:", err);
  });
});

// Con flag de inicialización para async
let isInitializing = false;

async function initPage(): Promise<void> {
  // Previene race conditions de llamadas asincrónicas concurrentes
  if (isInitializing) {
    console.warn("Page initialization already in progress, skipping");
    return;
  }

  isInitializing = true;

  try {
    // Lógica de inicialización
  } catch (err) {
    console.error("Initialization error:", err);
  } finally {
    isInitializing = false;  // Resetear flag siempre
  }
}
```

**Por qué este patrón:**
1. **Cleanup ANTES de init** → Garantiza que se limpien listeners anteriores incluso si hay errores
2. **Flag `isInitializing`** → Previene múltiples inicializaciones concurrentes
3. **Try-catch-finally** → Resetea el flag en cualquier escenario (éxito o error)
4. **Promise.catch()** → Maneja errores sin romper la cadena de inicialización

Este patrón se implementa actualmente en `visualizerPage/index.ts`. Los módulos `uploadPage.ts` y `filesPage.ts` usan variantes parciales. Se recomienda adoptar este patrón completo en todos los scripts de página para máxima robustez contra ViewTransitions y race conditions.

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

**Tipografía:**
- Font: Inter (cargada en Layout.astro)
- Heading: `text-xl font-bold tracking-tight`
- Body: `text-sm text-text-off-white`
- Secondary: `text-xs text-text-light-gray`
- Mono (IDs, precios): `font-mono`

**Componentes UI:**
- Botones: `bg-primary hover:bg-primary-hover transition-colors`
- Inputs: `bg-background-dark border-border-dark`
- Modales: `bg-surface-dark border border-border-dark rounded-lg`
- Badges: Colores dinámicos por categoría (blue/orange/purple)

## Convenciones de Código

### Nomenclatura de Archivos
- **Componentes Astro:** `PascalCase.astro` (ej: `Button.astro`, `FileTable.astro`)
- **Utilidades TypeScript:** `camelCase.ts` (ej: `csvParser.ts`, `indexeddb.ts`)
- **Scripts de página:** `camelCase.ts` en `src/scripts/` (ej: `uploadPage.ts`, `filesPage.ts`)
- **Módulos:** `camelCase.ts` en carpetas por responsabilidad (ej: `core/`, `delete/`, `events/`)
- **Tipos:** `types.ts` en `src/lib/` (centralizado)

### Estructura de Componentes Astro

```astro
---
// 1. Type imports primero
import type { CSVFile } from "../lib/types";

// 2. External dependencies
import { ViewTransitions } from "astro:transitions";

// 3. Local imports (jerarquía: layouts → components → utils)
import AppLayout from "../layouts/AppLayout.astro";
import Button from "../components/ui/Button.astro";
import { getAllFiles } from "../lib/indexeddb";

// 4. Props interface
interface Props {
  variant?: 'primary' | 'secondary';
  className?: string;
}

// 5. Destructure con defaults
const { variant = 'primary', className = '' } = Astro.props as Props;
---

<!-- HTML -->
<div class={`base-styles ${className}`}>
  <slot />
</div>
```

### Importaciones
- Agrupar: (1) `import type {...}`, (2) librerías externas, (3) componentes/utils locales
- En `.astro`: todos en frontmatter, antes del HTML
- Evitar circular imports (respetar jerarquía)

### Funciones TypeScript
- **Declaraciones:** `function myFunction(param: Type): ReturnType { ... }` (nivel raíz)
- **Callbacks:** Arrow functions `() => { ... }` en event listeners
- **Tipos explícitos:** Siempre tipear parámetros y retorno
- **Naming:** camelCase para funciones, UPPER_SNAKE_CASE para constantes

Ejemplos:
```typescript
// ✅ Correcto
function parseCSVString(content: string): CSVParseResult {
  return { data, rowCount, error };
}

button.addEventListener('click', () => {
  handleDelete();
});

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// ❌ Incorrecto
function parse_csv(content) { ... }  // snake_case
const parseCSV = (content) => { ... }  // arrow en nivel raíz
```

### Estilos y Tailwind

**Preferencias:**
1. **Tailwind utilities** → `bg-primary`, `hover:text-vibrant-blue`, `transition-colors`
2. **CSS custom properties** → `var(--color-primary)` en `global.css` para tokens
3. **Bloques `<style>`** → Solo para casos que Tailwind no cubre

```astro
<!-- ✅ Correcto -->
<button class="bg-primary hover:bg-primary-hover transition-colors">
  Click
</button>

<!-- ❌ Incorrecto -->
<button class="custom-button">Click</button>
<style>
  .custom-button { background: #007AFF; }
</style>
```

### TypeScript Tipos

```typescript
// ✅ Correcto
interface Props {
  files: CSVFile[];
  onDelete: (id: string) => Promise<void>;
}

const data: Record<string, string> = { name: 'John', email: 'john@example.com' };

type ValidationResult = { valid: boolean; error?: string };

// ❌ Incorrecto
interface Props {
  files: any;
  onDelete: Function;
}

const data: any = { ... };
```

### Manejo de DOM en Scripts

```typescript
// ✅ Correcto: usar data attributes
const element = document.querySelector('[data-file-id="123"]');
const rows = document.querySelectorAll('[data-file-row]');

rows.forEach(row => {
  row.addEventListener('click', (e) => {
    const fileId = (e.target as HTMLElement).closest('[data-file-row]')
      ?.getAttribute('data-file-id');
  });
});

// ❌ Incorrecto: IDs globales, clases para lógica
const element = document.getElementById('fileRow123');
document.querySelectorAll('.file-item').forEach(...);
```

### Commits (Conventional Commits)

Usar `pnpm commit` para crear commits interactivos:
```
type(scope): descripción

Cuerpo detallado explicando el por qué y cómo.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

**Tipos:** `feat`, `fix`, `refactor`, `docs`, `test`, `style`, `chore`, `ci`, `perf`

**Scopes:** `upload`, `files`, `visualizer`, `ui`, `lib`, `parser`, `db`, `layout`, `build`, `docs`, `types`

Ejemplo:
```
feat(visualizer): agregar exportación a Excel

Permite usuarios exportar datos CSV a XLSX usando la librería xlsx.
Se agrega ExportButton en la toolbar con dropdown de opciones.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

## Documentación y Recursos

### Documentación del Proyecto

La carpeta `docs/` contiene **planes detallados** organizados por módulo:

```
docs/
├── README.md                             # Índice central de toda la documentación
├── upload/
│   ├── plan-ui.md                        # Diseño UI UploadZone
│   └── plan-drag-drop-feature.md         # Implementación drag & drop
├── files/
│   ├── plan-ui.md                        # Diseño UI My Files
│   ├── plan-indexeddb-integration.md     # Cargar archivos reales
│   ├── plan-delete-feature.md            # Eliminación individual y masiva
│   └── plan-refactoring.md               # Modularización filesPage.ts
├── visualizer/
│   └── plan-ui.md                        # Diseño UI visualización CSV
└── validation/
    └── fase3-validation.md               # Checklist de validación
```

**Lectura recomendada:** Comienza con `docs/README.md` para entender el flujo completo del proyecto.

### Diseños de Referencia

Los diseños visuales están en la carpeta `desing/` (con typo intencional):
- `csv_processor_home_and_upload_upload/` — UploadZone
- `csv_processor_home_and_upload_files/` — Tabla de archivos
- `csv_processor_home_and_upload_visualizer/` — Visualización CSV
- `csv_processor_home_and_upload_settings/` — Settings (futura)

### Instrucciones Especiales

- **Copilot Instructions:** [.claude/copilot-instructions.md](./.claude/copilot-instructions.md)
  - Contexto del proyecto, patrones de desarrollo, DO's y DON'Ts
  - CRÍTICO: No crear rutas API (es cliente-only), no usar `csv-parse`, no acceder IndexedDB en Astro frontmatter
  
- **Guía de Commits:** [.claude/skills/commits/SKILL.md](./.claude/skills/commits/SKILL.md)
  - Flujo interactivo para commits profesionales siguiendo Conventional Commits

---

## Limitaciones y Restricciones Importantes

### ❌ NO HACER

| Restriction | Razón | Alternativa |
|-------------|-------|-------------|
| Crear rutas API (/api/...) | Es cliente-only, sin backend | Todo en IndexedDB client-side |
| Usar csv-parse library | Proyecto usa custom parser | Usar parseCSVString() de lib/csvParser.ts |
| Acceder IndexedDB en Astro frontmatter | Astro frontmatter es server-side | Usar <script> o archivos en src/scripts/ |
| Crear estado global (store) | No hay necesidad, cada página es independiente | Usar props, <script> con variables locales, o IndexedDB |
| Inline CSS masivo | Dificulta mantenimiento | Usar Tailwind utilities + global.css para tokens |
| Ciclado de imports | Rompe el módulo | Respetar jerarquía: lib → components → layouts → pages |

### ✅ HACER

| Patrón | Cuándo | Ejemplo |
|--------|--------|---------|
| Props interface | Siempre en componentes Astro | interface Props { files: CSVFile[] } |
| Data attributes | Seleccionar elementos en scripts | [data-file-id], [data-delete-btn] |
| Client scripts en /src/scripts/ | Lógica interactiva compleja | ilesPage.ts con 500+ líneas |
| Direct IndexedDB imports | Cargar datos en scripts | import { getAllFiles } from '../lib/indexeddb' |
| Tailwind utilities | Estilos | g-primary hover:bg-primary-hover |
| Explicit typing | TypeScript | unction save(file: CSVFile): Promise<string> |

---

## Debugging y Troubleshooting

### Verificaciones Útiles
`bash
# Verificar TypeScript errors
pnpm astro check

# Build production
pnpm build

# Preview build  
pnpm preview
`

### Problemas Comunes

**IndexedDB no persiste datos:**
- Verificar que estés en script client-side, no en Astro frontmatter
- Usar <script> tag en .astro o archivo en src/scripts/

**CSS Tailwind no aplica:**
- Confirmar elemento está en componente .astro dentro de src/components/
- Verificar que global.css esté importado en Layout.astro

**CSV parser falla o comportamiento extraño:**
- Testear con parseCSVString() en consola del navegador
- Revisar que el CSV no tenga encoding issues (UTF-8 recomendado)
- Validar quotes escapadas con csvParser.ts

---

## Estado Actual del Proyecto

- **Fase 1 (Upload):** ✅ Completada (drag & drop, validación, IndexedDB)
- **Fase 2 (File Management):** ✅ Completada (tabla, paginación, eliminación, refactoring)
- **Fase 3 (Visualizer):** 🔄 En progreso (UI con filtros, ordenamiento, exportación)

**Branch principal:** main (producción)
**Branch activa:** eature/visualizer (desarrollo Fase 3)

---

**Última actualización:** 30/01/2026
**Consulta siempre docs/README.md antes de empezar cualquier tarea.**
