---
description: Generate a structured commit message following Conventional Commits format for CSV Viewer v2
name: commit
agent: agent
model: Claude Haiku 4.5
tools: ['read', 'edit', 'web/githubRepo', 'github/*']
---

# Commit Message Generator for CSV Viewer v2

Genera mensajes de commit estructurados siguiendo **Conventional Commits** y las convenciones del proyecto.

## Contexto del Proyecto

- **Stack**: Astro 5 + TypeScript (strict) + Tailwind CSS 4
- **Storage**: IndexedDB (sin backend)
- **Patrón**: View Transitions, componentes reutilizables, event delegation
- **Lenguaje**: Español para el cuerpo del commit

## Estructura del Commit

Sigue este formato SIEMPRE:

```
<type>(<scope>): <description>

<body>

<footer>
```

### 1. Tipo (type) - Obligatorio

Elige UNO de los siguientes:
- **feat**: Nueva funcionalidad
- **fix**: Corrección de bug
- **refactor**: Refactorización de código sin cambios funcionales
- **perf**: Mejora de performance
- **style**: Cambios de formato, missing semicolons, etc. (NO lógica)
- **docs**: Cambios en documentación
- **test**: Agregar o actualizar tests
- **ci**: Cambios en CI/CD configuration
- **chore**: Cambios en deps, tooling, build (NO código de app)

### 2. Scope (scope) - Obligatorio

Especifica QUÉ parte del proyecto afecta:
- **upload**: Página de upload y componentes relacionados
- **files**: Página My Files y file table
- **visualizer**: Página de visualización de CSV
- **indexeddb**: Persistencia de datos
- **formatters**: Utilidades de formateo
- **ui**: Componentes genéricos (Button, Modal, etc.)
- **layout**: Layout principal y estructura
- **navigation**: Navegación y routing
- **scripts**: Page-specific scripts
- **styles**: Estilos globales y Tailwind
- **types**: Type definitions
- **deps**: Dependencias

### 3. Description (description) - Obligatorio

- **Máximo 50 caracteres**
- **Imperativo, present tense**: "add", "fix", "implement" (NO "added", "fixed")
- **Minúscula inicial**
- **NO punto final (.)**

✅ Correcto: `fix(upload): prevent duplicate event listeners on navigation`
❌ Incorrecto: `fix(upload): Fixed the duplicate event listeners.`

### 4. Body - Recomendado

- **Explica QUÉ y POR QUÉ, NO CÓMO**
- **Línea vacía antes del body**
- **Máximo 72 caracteres por línea**
- **Markdown format allowed**
- **Responde estas preguntas**:
  - ¿Qué problema resuelve?
  - ¿Por qué era necesario?
  - ¿Qué cambios se hicieron?

### 5. Footer - Según corresponda

**Para breaking changes**:
```
BREAKING CHANGE: description of what broke
```

**Para referencias a issues**:
```
Fixes #123
Closes #456
Related to #789
```

**Para deprecaciones**:
```
DEPRECATED: old-feature-name in favor of new-feature-name
```

## Ejemplos

### Ejemplo 1: Nueva Feature
```
feat(files): implement dynamic file loading from IndexedDB

Load CSV files from IndexedDB in My Files page instead of mock data.
Includes paginación (6 items/page), empty state, and file navigation to visualizer.

Implements:
- renderFileRow() to generate HTML for each file
- renderTable() to populate tbody with paginated rows
- updatePagination() to manage page controls
- Event delegation for table row navigation

Fixes #42
```

### Ejemplo 2: Bug Fix con Memory Leak
```
fix(files): prevent memory leaks in pagination buttons

Buttons were accumulating event listeners on each renderTable() call because
new listeners were added without removing old ones.

Solution: Clone pagination buttons using cloneNode() before replacing in DOM
to ensure all old event listeners are garbage collected.

Related to #38
```

### Ejemplo 3: Refactoring con Extraction
```
refactor(upload): extract escapeHtml to shared utility

Move duplicate escapeHtml() function from uploadPage.ts and filesPage.ts
to new src/lib/htmlUtils.ts for code reuse and maintainability.

Also updated uploadPage.ts imports to use the shared function.

No functional changes.
```

### Ejemplo 4: Performance Improvement
```
perf(files): use event delegation for table row clicks

Reduced event listener count from N (one per row) to 1 (one per tbody).
Improves memory usage and initialization speed for tables with many rows.

Implementation:
- setupTableNavigation() adds single click listener to tbody
- Uses closest('[data-file-id]') to delegate to clicked row
```

## Convenciones Específicas del Proyecto

- **Siempre importar tipos**: `import type { CSVFile }`
- **Escapar HTML en strings**: Usar función centralizada en htmlUtils.ts
- **View Transitions**: Usar `onPageLoad()` para inicialización
- **Event cleanup**: Usar tracking pattern o event delegation
- **Componentes**: Nombrar en PascalCase.astro
- **Utilities**: Nombrar en camelCase.ts
- **Selectores**: Data attributes: `[data-element-name]`

## Checklist Antes de Commit

Antes de generar el mensaje, verifica:
- ✅ El tipo es uno de los 9 tipos válidos
- ✅ El scope es específico y relevante
- ✅ Description tiene máx 50 caracteres
- ✅ Description en modo imperativo presente
- ✅ Description sin punto final
- ✅ Body explica QUÉ y POR QUÉ
- ✅ Footer incluye referencias a issues si aplica
- ✅ Código sigue convenciones del proyecto
- ✅ No hay console.log o código comentado

## Variables Disponibles

- `${selectedText}`: Cambios realizados en el editor (diff)
- `${fileBasename}`: Archivo actual
- `${workspaceFolder}`: Raíz del workspace

## Instrucciones de Uso

1. Haz cambios en tu código
2. En Chat, escribe: `/commit` + descripción de qué hiciste
3. O abre este archivo y presiona el botón play en la esquina superior
4. Revisa el commit generado y cópialo a tu terminal o git UI