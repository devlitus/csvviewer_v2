# GitHub Copilot Instructions - CSV Viewer v2

## 🎯 Descripción General del Proyecto

**CSV Viewer v2** es una aplicación web **100% client-side** para visualizar, gestionar y exportar archivos CSV.

| Aspecto | Detalles |
|--------|----------|
| **Framework** | Astro 5 + TypeScript (strict) |
| **Estilos** | Tailwind CSS 4 con tokens dark |
| **Persistencia** | IndexedDB (sin backend ni API) |
| **Interfaz** | Dark mode, responsive, componentes modulares |
| **Hosting** | SSR-ready con Vercel adapter |
| **Estado** | Fase 3 en progreso (Visualizer) |

**Idioma:** Responde siempre en español cuando comuniques con el usuario.

---

## 🏗️ Arquitectura & Flujo de Datos

### Patrón de Almacenamiento Client-Side

**CRÍTICO:** Todos los archivos CSV se guardan en **IndexedDB** (`CSVViewerDB`), NO en un servidor:

```
┌─────────────────────────────────────────┐
│        USER ACTION (Browser)             │
└─────────────────────────────────────────┘
         ↓                    ↓
    Upload CSV         Browse Archivos
         ↓                    ↓
   validateFile()      getAllFiles()
         ↓                    ↓
   parseCSVString()    getFile(id)
         ↓                    ↓
  saveFile() to        Renderizar
  IndexedDB            Tabla
         ↓                    ↓
  Actualizar           ¿Visualizar?
  RecentFiles              ↓
                     /visualizer?file=id
                            ↓
                     CSVTable + Filtros
                            ↓
                       Exportar CSV/Excel
```

### IndexedDB API (`src/lib/indexeddb.ts`)

Promise-based, todas retornan Promise:

```typescript
// Guardar archivo
saveFile(csvFile: CSVFile): Promise<string>  // Retorna UUID

// Obtener uno
getFile(id: string): Promise<CSVFile | undefined>

// Obtener todos
getAllFiles(): Promise<CSVFile[]>

// Eliminar lote
deleteFiles(ids: string[]): Promise<void>
```

**Tipo `CSVFile`:**
```typescript
{
  id: string              // UUID generado con crypto.randomUUID()
  filename: string        // Nombre original
  content: string         // CSV raw (completo)
  size: number           // Bytes
  uploadDate: number     // Timestamp
  rowCount?: number      // Opcional
}
```

### Parser CSV (`src/lib/csvParser.ts`)

**Usar SIEMPRE `parseCSVString()`, NO `csv-parse` library:**

```typescript
parseCSVString(content: string): CSVParseResult

// Retorna:
{
  data: Record<string, string>[]  // Array de rows (obj con keys = columnas)
  rowCount: number
  error?: string
}
```

**Características:**
- ✅ Maneja comillas entrecomilladas correctamente
- ✅ Soporta multiline dentro de campos
- ✅ Escape sequences (`\"`, `\\`)
- ✅ No requiere librerías externas
- ✅ Parser custom, ligero y rápido

### Validación (`src/lib/fileUpload.ts`)

```typescript
validateFile(file: File): ValidationResult

// Validaciones:
- Extensión .csv (case-insensitive)
- Tamaño ≤ 50MB
- Tipo MIME text/csv (recomendado)

// Retorna:
{ valid: boolean, error?: string }
```

---

## 📁 Estructura del Proyecto

### `src/lib/` — Lógica Reutilizable

| Archivo | Propósito |
|---------|-----------|
| `types.ts` | Tipos TypeScript compartidos |
| `indexeddb.ts` | API IndexedDB con CRUD completo |
| `csvParser.ts` | Parser CSV custom |
| `fileUpload.ts` | Validación de archivos |
| `formatters.ts` | Formateo (fechas, tamaños) |
| `htmlUtils.ts` | Utilidades HTML |
| `pageInit.ts` | Inicialización de páginas |

### `src/scripts/` — Scripts Client-Side

| Archivo | Página | Responsabilidad |
|---------|--------|-----------------|
| `uploadPage.ts` | `/` | Drag & drop, upload, vista recientes |
| `filesPage.ts` | `/files` | Tabla, paginación, eliminación (568 líneas) |
| `filesPage/` | `/files` | Módulos modularizados (core, delete, events, rendering, utils) |

### `src/components/` — Componentes Astro

**Organización por dominio:**

```
components/
├── ui/                                # Genéricos reutilizables
│   ├── Button.astro
│   ├── SearchInput.astro
│   ├── ConfirmationModal.astro
│   └── [otros]
├── layout/                            # Estructura principal
│   ├── PageHeader.astro
│   └── Sidebar.astro
├── navigation/                        # Navegación
│   └── NavItem.astro
├── upload/                            # Feature: Upload
│   └── UploadZone.astro               # Drag & drop, input file
├── files/                             # Feature: Gestión de Archivos
│   ├── FileTable.astro
│   ├── FileTableRow.astro
│   ├── FileIcon.astro
│   ├── StatusBadge.astro
│   ├── Pagination.astro
│   ├── RecentFileCard.astro
│   ├── RecentFilesSection.astro
│   └── SelectionBar.astro
└── visualizer/                        # Feature: Visualización CSV
    ├── CSVTable.astro
    ├── CSVTableHeader.astro
    ├── CSVTableRow.astro
    ├── DataToolbar.astro
    ├── ColumnFilterInput.astro
    ├── FilterButton.astro
    ├── ExportButton.astro
    ├── CategoryBadge.astro
    ├── TablePagination.astro
    └── VisualizerHeader.astro
```

### `src/pages/` — Rutas Astro

```
pages/
├── index.astro           # / — Upload + archivos recientes
├── files.astro           # /files — Gestión de archivos
├── visualizer.astro      # /visualizer?file=<id> — Visualización
└── settings.astro        # /settings — Configuración (futura)
```

### `docs/` — Documentación de Planes (Reorganizada)

```
docs/
├── README.md                          # Índice central
├── upload/
│   ├── plan-ui.md
│   └── plan-drag-drop-feature.md
├── files/
│   ├── plan-ui.md
│   ├── plan-indexeddb-integration.md
│   ├── plan-delete-feature.md
│   └── plan-refactoring.md
├── visualizer/
│   └── plan-ui.md
└── validation/
    └── fase3-validation.md
```

---

## 💻 Convenciones de Código

### Nomenclatura de Archivos

| Tipo | Patrón | Ejemplo |
|------|--------|---------|
| **Componentes Astro** | `PascalCase.astro` | `FileTable.astro`, `ExportButton.astro` |
| **Utilidades/Lib** | `camelCase.ts` | `csvParser.ts`, `indexeddb.ts` |
| **Scripts de página** | `camelCase.ts` en `src/scripts/` | `uploadPage.ts`, `filesPage.ts` |
| **Módulos** | `camelCase.ts` en carpetas | `tableRenderer.ts`, `deleteEventManager.ts` |
| **Tipos centrales** | `types.ts` | `src/lib/types.ts` |

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
  onDelete?: (id: string) => Promise<void>;
}

// 5. Destructure con defaults
const { variant = 'primary', className = '' } = Astro.props as Props;
---

<!-- HTML -->
<div class={`base-styles ${className}`}>
  <slot />
</div>
```

### TypeScript Patterns

```typescript
// ✅ CORRECTO: función con tipos explícitos
function parseCSVString(content: string): CSVParseResult {
  return { data, rowCount, error };
}

// ✅ CORRECTO: arrow functions en callbacks
button.addEventListener('click', () => {
  handleDelete(fileId);
});

// ✅ CORRECTO: tipos dinámicos con Record
const row: Record<string, string> = { name: 'John', email: 'john@example.com' };

// ❌ INCORRECTO: función sin tipos
function parse(content) { ... }

// ❌ INCORRECTO: any type
const data: any = { ... };
```

### Estilos con Tailwind

**Preferencia:** Utilities > Design tokens > Custom CSS

```astro
<!-- ✅ CORRECTO: Tailwind utilities -->
<button class="bg-primary hover:bg-primary-hover transition-colors px-4 py-2 rounded">
  Click
</button>

<!-- ✅ CORRECTO: Design tokens de global.css -->
<div class="bg-surface-dark border border-border-dark">
  Contenido
</div>

<!-- ❌ INCORRECTO: CSS inline masivo -->
<button class="custom-btn">Click</button>
<style>
  .custom-btn { background: #007AFF; padding: 8px 16px; ... }
</style>
```

**Design Tokens (en `src/styles/global.css`):**
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

### Selección DOM en Scripts

```typescript
// ✅ CORRECTO: usar data attributes
const element = document.querySelector('[data-file-id="123"]');
const rows = document.querySelectorAll('[data-file-row]');

rows.forEach(row => {
  row.addEventListener('click', (e) => {
    const fileId = (e.target as HTMLElement)
      .closest('[data-file-row]')
      ?.getAttribute('data-file-id');
  });
});

// ❌ INCORRECTO: IDs globales, clases para lógica
const element = document.getElementById('fileRow123');
document.querySelectorAll('.file-item').forEach(...);
```

### Commits (Conventional Commits)

Usar `pnpm commit` para flujo interactivo:

```
type(scope): descripción

Cuerpo detallado (opcional).

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

**Tipos válidos:**
- `feat` — Nueva funcionalidad
- `fix` — Corrección de bug
- `refactor` — Reorganización sin cambios funcionales
- `docs` — Cambios en documentación
- `style` — Formato, linting (no afecta funcionalidad)
- `chore` — Dependencias, configuración
- `test` — Tests
- `ci` — CI/CD

**Scopes válidos:**
- `upload`, `files`, `visualizer` — Features
- `ui`, `layout`, `nav` — Componentes
- `lib`, `parser`, `db` — Utilidades
- `styles`, `build`, `docs`, `types` — Otros

---

## 🔧 Flujo de Desarrollo

### Comandos

```bash
pnpm install    # Instalar dependencias
pnpm dev        # Servidor dev http://localhost:4321
pnpm build      # Build producción → ./dist/
pnpm preview    # Previsualizar build
pnpm commit     # Commits interactivos (Conventional Commits)
```

### Documentación

**Consulta SIEMPRE estos archivos ANTES de empezar:**
- [`.claude/CLAUDE.md`](./../.claude/CLAUDE.md) — Guía completa del proyecto
- [`docs/README.md`](./../docs/README.md) — Índice de planes
- [`desing/`](./../desing/) — Mockups de UI (nota: typo intencional)

### Diseños de Referencia

Los diseños visuales están en `/desing/`:
- `csv_processor_home_and_upload_upload/` — UploadZone
- `csv_processor_home_and_upload_files/` — Tabla de archivos
- `csv_processor_home_and_upload_visualizer/` — Visualización CSV
- `csv_processor_home_and_upload_settings/` — Settings (futura)

---

## 🔗 Patrones de Integración

### Astro View Transitions

- Habilitado en `Layout.astro` con `<ViewTransitions />`
- Navegación sin full reloads (UX tipo SPA)
- Ten cuidado con re-ejecución de scripts en transiciones

### Material Symbols Icons

- Cargado desde Google Fonts CDN en `Layout.astro`
- Uso: `<span class="material-symbols-outlined">cloud_upload</span>`
- Iconos comunes: `table_view`, `upload`, `delete`, `settings`, `more_vert`

---

## 📋 Patrones Comunes

### Cargar Archivos en Páginas

```typescript
// ❌ NO: Frontend en Astro frontmatter
import { getAllFiles } from "../lib/indexeddb";
const files = await getAllFiles();  // ¡No funciona server-side!
```

```astro
<!-- ✅ SÍ: Script client-side -->
<div data-recent-files-grid></div>
<script>
  import { getAllFiles } from "../lib/indexeddb";
  const grid = document.querySelector('[data-recent-files-grid]');
  const files = await getAllFiles();
  // Renderizar dinámicamente
</script>
```

### Validar CSV

```typescript
import { validateFile } from "../lib/fileUpload";
const validation = validateFile(file);
if (!validation.valid) {
  showError(validation.error);
  return;
}
```

### Manejo de Errores en UI

- Mostrar errores en zonas dedicadas: `[data-upload-error]`
- Auto-ocultar después de 5s con `setTimeout`
- Usar esquema rojo: `bg-red-500/10 border-red-500/30 text-red-400`

---

## ❌ Restricciones Críticas

| Restricción | Razón | Alternativa |
|------------|-------|-------------|
| Crear rutas API (`/api/...`) | Es cliente-only, sin backend | Todo en IndexedDB client-side |
| Usar `csv-parse` library | Proyecto usa custom parser | Usar `parseCSVString()` de `lib/csvParser.ts` |
| Acceder IndexedDB en Astro frontmatter | Frontmatter es server-side | Usar `<script>` o `src/scripts/` |
| Crear estado global (store) | No hay necesidad | Usar props, variables locales, o IndexedDB |
| Inline CSS masivo | Dificulta mantenimiento | Usar Tailwind utilities + `global.css` |
| Ciclado de imports | Rompe módulos | Respetar jerarquía: lib → components → pages |

---

## ✅ Quick Reference

### IndexedDB
- `saveFile(csvFile)` → Promise<string> (retorna UUID)
- `getFile(id)` → Promise<CSVFile | undefined>
- `getAllFiles()` → Promise<CSVFile[]>
- `deleteFiles(ids)` → Promise<void>

### CSV Parsing
- `parseCSVString(content)` → { data: Record<string, string>[], rowCount: number, error?: string }

### Validación
- `validateFile(file)` → { valid: boolean, error?: string }

### Tipos Principales
- `CSVFile` — Estructura de archivo
- `CSVParseResult` — Resultado del parser
- `ValidationResult` — Validación de archivo
- `UploadResult` — Resultado de subida

### Diseño de Sistema
- **Colores:** Definidos en `src/styles/global.css` `@theme` block
- **Tipografía:** Inter (cargada en `Layout.astro`)
- **Breakpoints:** Tailwind defaults
- **Iconos:** Material Symbols

---

**Estado Actual:** Fase 3 en progreso (Visualizer)
**Última actualización:** 30/01/2026
