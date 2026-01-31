# 📚 Documentación - CSV Viewer v2

Guía completa de planes, diseños e implementación del proyecto CSV Viewer.

---

## 📂 Estructura de Documentación

### 📤 [Módulo Upload](./upload/)

Funcionalidad de carga de archivos CSV con interfaz visual y drag & drop.

| Documento | Descripción |
|-----------|-------------|
| [plan-ui.md](./upload/plan-ui.md) | Diseño UI de la página Upload con UploadZone |
| [plan-drag-drop-feature.md](./upload/plan-drag-drop-feature.md) | Implementación de drag & drop y validación |

---

### 📁 [Módulo Files](./files/)

Gestión de archivos CSV con tabla, paginación y eliminación.

| Documento | Descripción |
|-----------|-------------|
| [plan-ui.md](./files/plan-ui.md) | Diseño UI de My Files - tabla estática |
| [plan-indexeddb-integration.md](./files/plan-indexeddb-integration.md) | Cargar archivos reales desde IndexedDB |
| [plan-delete-feature.md](./files/plan-delete-feature.md) | Eliminación individual y masiva de archivos |
| [plan-refactoring.md](./files/plan-refactoring.md) | Modularización de filesPage.ts |

---

### 📊 [Módulo Visualizer](./visualizer/)

Visualización interactiva de datos CSV con tabla, filtros y exportación.

| Documento | Descripción |
|-----------|-------------|
| [plan-ui.md](./visualizer/plan-ui.md) | Diseño UI para visualización de datos |

---

### ✅ [Validación](./validation/)

Pruebas y checklists de implementación.

| Documento | Descripción |
|-----------|-------------|
| [fase3-validation.md](./validation/fase3-validation.md) | Validación de implementación Fase 3 |

---

## 🚀 Orden de Lectura Recomendado

1. **Entiende el contexto general**
   - Lee el [README.md](../README.md) del proyecto
   - Revisa la [arquitectura client-side](../README.md#architecture)

2. **Comienza con Upload** (Fase 1)
   - [Upload UI](./upload/plan-ui.md)
   - [Drag & Drop Feature](./upload/plan-drag-drop-feature.md)

3. **Continúa con Files** (Fase 2)
   - [Files UI](./files/plan-ui.md)
   - [IndexedDB Integration](./files/plan-indexeddb-integration.md)
   - [Delete Feature](./files/plan-delete-feature.md)
   - [Refactoring](./files/plan-refactoring.md)

4. **Finaliza con Visualizer** (Fase 3)
   - [Visualizer UI](./visualizer/plan-ui.md)

5. **Valida la implementación**
   - [Validation Checklist](./validation/fase3-validation.md)

---

## 📋 Contenido Rápido por Módulo

### Upload

- **Objetivo**: Permitir usuarios subir CSV con drag & drop
- **Componentes**: UploadZone, RecentFilesSection, RecentFileCard
- **Tecnologías**: File API, IndexedDB, parseCSVString()
- **Estado**: ✅ Completado

### Files

- **Objetivo**: Administrar archivos CSV con tabla, paginación y eliminación
- **Componentes**: FileTable, FileTableRow, Pagination, StatusBadge, SelectionBar
- **Tecnologías**: IndexedDB, Event Management, Modal confirmation
- **Estado**: ✅ Completado

### Visualizer

- **Objetivo**: Visualizar datos CSV con filtros, ordenamiento y exportación
- **Componentes**: CSVTable, CSVTableHeader, DataToolbar, ExportButton, CategoryBadge
- **Tecnologías**: Astro transitions, Tailwind styling, IndexedDB integration
- **Estado**: ✅ Completado

---

## 🔗 Enlaces Útiles

- **Diseños de referencia**: [desing/](../desing/)
- **Código fuente**: [src/](../src/)
- **Configuración**: [astro.config.mjs](../astro.config.mjs), [tsconfig.json](../tsconfig.json)

---

## 📝 Convenciones de Documentación

- Todos los planes siguen el mismo formato: Análisis → Solución → Implementación
- Los nombres de archivos indican el tipo: `plan-*` para planes, `fase*` para validaciones
- Los scopes en commits deben coincidir con los nombres de módulos

---

**Última actualización**: 30/01/2026
