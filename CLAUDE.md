# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Astro 5 project with TypeScript, intended to be a CSV viewer application. Currently contains the default Astro Basics starter template.
Always respond in Spanish.

## Commands

```bash
pnpm dev        # Start dev server at localhost:4321
pnpm build      # Build production site to ./dist/
pnpm preview    # Preview production build locally
pnpm astro      # Run Astro CLI commands (e.g., astro add, astro check)
```

## Architecture

**Framework:** Astro 5 con TypeScript (strict) + Tailwind CSS 4
**Rendering:** SSR con adaptador Vercel
**Dependencias clave:** `csv-parse`, `xlsx` (exportación Excel)

### Estructura de directorios

```
src/
├── lib/              # Lógica de negocio y utilidades
│   ├── types.ts      # Tipos compartidos (CSVFile, CSVParseResult)
│   ├── indexeddb.ts  # API de persistencia (saveFile, getFile, deleteFiles, getAllFiles)
│   └── csvParser.ts  # Parser CSV (parseCSVString, soporta quotes/multiline)
├── scripts/          # Scripts client-side por página
│   └── filesPage.ts  # Lógica de upload/delete/selección en /files
├── components/       # Componentes Astro organizados por dominio
│   ├── ui/           # Genéricos (Button, Icon, SearchInput, ConfirmationModal)
│   ├── layout/       # Estructura (Header, Sidebar, MainContent)
│   ├── navigation/   # Navegación (Logo, NavMenu, NavItem)
│   ├── upload/       # Upload (UploadZone con drag & drop)
│   ├── files/        # Gestión archivos (FileTable, Pagination, RecentFiles)
│   └── visualizer/   # Visualización (CSVTable, DataToolbar, CategoryBadge)
├── layouts/
│   ├── Layout.astro      # Base HTML + ViewTransitions
│   └── AppLayout.astro   # Sidebar + contenido
└── pages/
    ├── index.astro       # Upload + archivos recientes
    ├── files.astro       # Gestión de archivos
    ├── visualizer.astro  # Visualización CSV (?file=<id>)
    └── settings.astro    # Configuración (futura)
```

### Flujo de datos

1. **Upload:** UploadZone (drag & drop) → guarda en **IndexedDB** vía `saveFile()`
2. **Almacenamiento:** IndexedDB (`CSVViewerDB`) con objetos `CSVFile`. Sin backend, todo client-side.
3. **Listado:** `/files` carga vía `getAllFiles()` → tabla con paginación y eliminación batch
4. **Visualización:** `/visualizer?file=<id>` → `getFile()` → `parseCSVString()` → tabla con filtros y exportación

### Patrones de comunicación

- **Props tipadas** (`interface Props`) entre componentes Astro, sin reactividad
- **Client scripts:** `<script>` inline o `src/scripts/` → comunicación vía DOM (event listeners)
- **Persistencia:** Imports directos de `src/lib/indexeddb.ts` (sin store global)
- **Navegación:** `<ViewTransitions />` de Astro + `window.location.href`

## Convenciones de código

**Nomenclatura de archivos:**
- Componentes Astro: `PascalCase.astro` (ej: `Button.astro`, `FileCard.astro`)
- Utilidades TypeScript: `camelCase.ts` (ej: `csvParser.ts`, `indexeddb.ts`)
- Scripts de página: `camelCase.ts` en `src/scripts/`
- Tipos compartidos: `types.ts` en `src/lib/`

**Imports:**
- Agrupar: (1) tipos (`import type`), (2) librerías externas, (3) componentes/utils locales
- En `.astro`: imports en frontmatter, ordenados por jerarquía (layouts → components → utils)

**Componentes Astro:**
- Definir `interface Props` al inicio del frontmatter
- Destructurar props con valores por defecto: `const { variant = 'primary' } = Astro.props as Props`
- Usar `class: className` en Props para pasar clases CSS

**Funciones:**
- `function` declarations en nivel raíz del archivo
- Arrow functions dentro de funciones, callbacks y event handlers

**Estilos:**
- Preferir Tailwind utility classes sobre CSS custom
- Bloques `<style>` solo para casos que Tailwind no cubre
- Variables CSS en `:root` de layouts principales, no por componente

**TypeScript:**
- Tipar explícitamente parámetros de función y valores de retorno
- Usar `Record<string, T>` para objetos dinámicos

## Design project

All designs are in the `/design` folder

## Agentes personalizados

Definidos en `.claude/agents/`. Usar segun el tipo de tarea:

- **planner** — Planificacion de features, refactoring y arquitectura. Solo escribe en `docs/`. Nunca escribe codigo. Analiza el stack, busca en internet y produce planes detallados.
- **implementer** — Implementacion de codigo siguiendo planes de `docs/`. Reutiliza codigo existente, aplica patrones cuando es necesario y se documenta en las APIs oficiales si le falta contexto. Se detiene y pregunta ante ambiguedades.
- **code-reviewer** — Revision de codigo post-implementacion. Analiza calidad, seguridad, rendimiento y cumplimiento del plan. Nunca modifica archivos, solo reporta problemas por severidad.

### Flujo recomendado

1. Usar `planner` para disenar la solucion → genera `docs/plan-<nombre>.md`
2. Usar `implementer` para ejecutar el plan paso a paso
3. Usar `code-reviewer` para revisar los cambios antes de merge
