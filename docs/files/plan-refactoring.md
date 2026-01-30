# Plan: Refactorización y Modularización de filesPage.ts

## Resumen Ejecutivo

El archivo `src/scripts/filesPage.ts` contiene **568 líneas** con múltiples responsabilidades entrelazadas:
- Renderizado de tabla y paginación (107 líneas)
- Gestión de estado de selección (77 líneas)
- Eventos de eliminación individual (62 líneas)
- Eventos de eliminación masiva y modal (96 líneas)
- Navegación e inicialización (75 líneas)

**Objetivo**: Modularizar en 4-5 módulos independientes, mejorar testabilidad, reutilización y mantenimiento.

---

## 1. Análisis del Estado Actual

### 1.1 Bloques Lógicos Identificados

| Bloque | Líneas | Responsabilidad | Dependencias |
|--------|--------|-----------------|--------------|
| **Rendering** | 95 | Renderizar tabla y paginación | `renderFileRow()`, `renderTable()` |
| **State Management** | 77 | Selección múltiple, páginas, archivos | `allFiles`, `selectedFiles`, `currentPage` |
| **Delete Individual** | 62 | Confirmación inline de 1 archivo | Estado `pendingDeleteId` |
| **Delete Batch** | 96 | Modal y eliminación masiva | `selectedFiles`, modal DOM |
| **Event Listeners** | 142 | Setup de listeners en DOM | Todos los anteriores |
| **Initialization** | 75 | Carga inicial y setup | `onPageLoad` |

### 1.2 Problemas Identificados

**Acoplamiento:**
- `renderTable()` llama a `setupDeleteButtons()`, `setupCheckboxes()`, etc. (acoplamiento vertical)
- Múltiples funciones manipulan estado global de la misma forma
- Event listeners re-creados en cada re-render

**Falta de abstracción:**
- Selectores DOM hardcodeados en múltiples lugares
- Lógica de paginación en `updatePagination()` y `renderTable()` (duplicación)
- No hay separación entre lógica de negocio y manipulación DOM

**Testabilidad:**
- Funciones con efectos secundarios (DOM, IndexedDB, timers)
- Estado global mutante sin historial
- Sin inyección de dependencias

**Memoria:**
- `confirmTimeout` se sobreescribe sin siempre limpiar
- Listeners añadidos repetidamente sin desuscribirse

---

## 2. Propuesta de Arquitectura Modular

### 2.1 Estructura de Módulos Propuesta

```
src/scripts/filesPage/
├── index.ts                      # Entry point (orquestación)
├── core/
│   ├── fileStore.ts              # Gestión de estado de archivos
│   ├── selectionManager.ts        # Gestión de selección múltiple
│   └── paginationManager.ts       # Gestión de paginación
├── delete/
│   ├── singleDelete.ts            # Lógica de eliminación individual
│   ├── batchDelete.ts             # Lógica de eliminación masiva
│   └── deleteConfirm.ts           # Estados de confirmación
├── rendering/
│   ├── tableRenderer.ts           # Renderizado de tabla
│   ├── paginationRenderer.ts      # Renderizado de paginación
│   └── selectionBarRenderer.ts    # Renderizado de barra selección
├── events/
│   ├── tableEventManager.ts       # Event delegation para tabla
│   ├── selectionEventManager.ts   # Events de selección
│   ├── deleteEventManager.ts      # Events de eliminación
│   └── paginationEventManager.ts  # Events de paginación
└── utils/
    ├── domSelectors.ts            # Constantes de selectores
    ├── rowAnimations.ts           # Animaciones de filas
    └── fileFormatting.ts          # Formato de filas (con escaping)
```

### 2.2 Módulos Detallados

#### **`core/fileStore.ts`** - Gestión de Estado
**Responsabilidad**: Mantener estado de archivos y proveedor de acceso controlado

```typescript
// Types
export interface FileStoreState {
  allFiles: CSVFile[];
  currentPage: number;
  itemsPerPage: number;
}

// Interfaz
export class FileStore {
  private state: FileStoreState;

  getFiles(): CSVFile[]
  getCurrentPage(): number
  setCurrentPage(page: number): void
  loadFiles(): Promise<void>
  deleteFile(id: string): Promise<void>
  deleteFiles(ids: string[]): Promise<void>
  getTotalPages(): number
  getCurrentPageFiles(): CSVFile[]
  resetState(): void
}
```

**Ventajas:**
- Acceso controlado al estado
- Métodos tipados y predecibles
- Facilita testing (mock FileStore)

---

#### **`core/selectionManager.ts`** - Selección Múltiple
**Responsabilidad**: Gestionar qué archivos están seleccionados

```typescript
export interface SelectionState {
  selectedIds: Set<string>;
}

export class SelectionManager {
  private state: SelectionState;

  toggle(fileId: string): void
  select(fileId: string): void
  deselect(fileId: string): void
  isSelected(fileId: string): boolean
  getSelectedCount(): number
  getSelectedIds(): string[]
  selectPage(pageFiles: CSVFile[]): void
  deselectAll(): void
  getPageSelectState(pageFiles): 'none' | 'partial' | 'all'

  // Observer pattern
  subscribe(callback: (state: SelectionState) => void): () => void
}
```

**Ventajas:**
- Lógica de selección desacoplada
- Observer pattern para cambios
- Métodos puros (excepto side effects explícitos)

---

#### **`core/paginationManager.ts`** - Paginación
**Responsabilidad**: Calcular y gestionar estados de paginación

```typescript
export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
}

export class PaginationManager {
  private state: PaginationState;

  getCurrentPage(): number
  setCurrentPage(page: number): void
  getTotalPages(): number
  getPageRange(): [start: number, end: number]
  getDisplayRange(total: number): [start: number, end: number]
  canPrevious(): boolean
  canNext(): boolean
  previousPage(): void
  nextPage(): void
  goToPage(page: number): void
  reset(): void
}
```

**Ventajas:**
- Lógica de paginación centralizada
- Fácil de probar (funciones puras)
- Validación de boundaries en un solo lugar

---

#### **`delete/singleDelete.ts`** - Eliminación Individual
**Responsabilidad**: Lógica de confirmación y eliminación de 1 archivo

```typescript
export interface SingleDeleteState {
  pendingDeleteId: string | null;
  confirmTimeout: NodeJS.Timeout | null;
}

export class SingleDeleteManager {
  private state: SingleDeleteState;
  private fileStore: FileStore;

  handleDeleteClick(fileId: string): void
  confirmDelete(fileId: string): Promise<void>
  cancelDelete(): void
  getPendingDeleteId(): string | null

  subscribe(callback): () => void
}
```

---

#### **`delete/batchDelete.ts`** - Eliminación Masiva
**Responsabilidad**: Lógica de eliminación de múltiples archivos

```typescript
export class BatchDeleteManager {
  async deleteSelected(ids: string[], fileStore: FileStore): Promise<void>

  // Interacción con modal
  showConfirmationModal(count: number): Promise<boolean>
  closeConfirmationModal(): void
}
```

---

#### **`rendering/tableRenderer.ts`** - Renderizado de Tabla
**Responsabilidad**: Generar HTML de fila y tabla

```typescript
export interface RowRenderContext {
  file: CSVFile;
  isSelected: boolean;
  isPendingDelete: boolean;
}

export class TableRenderer {
  renderRow(context: RowRenderContext): string
  renderTable(
    files: CSVFile[],
    selectedIds: Set<string>,
    pendingDeleteId: string | null
  ): void
  clearTable(): void

  // Métodos privados
  private renderFileRow(context): string
  private escapeHtml(text: string): string
}
```

**Ventajas:**
- HTML generado en un solo lugar
- Reutilizable en otros contextos
- Fácil de actualizar template

---

#### **`events/tableEventManager.ts`** - Event Delegation
**Responsabilidad**: Setup de listeners con event delegation

```typescript
export class TableEventManager {
  constructor(private tableSelector: string) {}

  onDeleteClick(callback: (fileId: string) => void): () => void
  onCheckboxChange(callback: (fileId: string) => void): () => void
  onRowClick(callback: (fileId: string) => void): () => void

  cleanup(): void
}
```

**Ventajas:**
- Event delegation eficiente
- Fácil de desuscribirse
- Centraliza selectores

---

### 2.3 Diagrama de Dependencias

```
┌─────────────────────────────────────┐
│   filesPage/index.ts (Orchestrator) │ ← Entry point
└─────────────────────────────────────┘
         ↓        ↓         ↓
    ┌────┴────┬────┴────┬────┴────┐
    ↓         ↓         ↓         ↓
  Core      Delete   Rendering  Events
    │         │         │         │
    ├─FileStore│      │         │
    ├─Selection├─SingleDelete   │
    │ Manager  ├─BatchDelete    │
    └─Paging───┤      │         │
              └──────┴─────────┘
                     ↓
                  utils/
```

---

## 3. Plan de Implementación Paso a Paso

### Fase 1: Crear Infraestructura (Sin afectar código actual)

**Paso 1.1**: Crear estructura de directorios
```bash
mkdir -p src/scripts/filesPage/{core,delete,rendering,events,utils}
```

**Paso 1.2**: Crear `utils/domSelectors.ts`
- Centralizar todos los selectores DOM
- Exported constants: `TABLE_BODY_SELECTOR`, etc.

**Paso 1.3**: Crear `utils/rowAnimations.ts`
- Función `animateRowDelete(element)` con keyframes
- Promesa que resuelve cuando termina animación

**Paso 1.4**: Crear `utils/fileFormatting.ts`
- Extraer `renderFileRow()` como función pura
- Parámetro de contexto `RowRenderContext`

---

### Fase 2: Implementar Capas Core (Estado)

**Paso 2.1**: Crear `core/fileStore.ts`
- Clase `FileStore` con estado privado
- Métodos públicos para acceso controlado
- Integración con `getAllFiles()`, `deleteFiles()`

**Paso 2.2**: Crear `core/selectionManager.ts`
- Clase `SelectionManager`
- Métodos de toggle, select, deselect
- Observer pattern con `subscribe()`

**Paso 2.3**: Crear `core/paginationManager.ts`
- Clase `PaginationManager`
- Lógica de cálculos de páginas

---

### Fase 3: Implementar Capas Delete

**Paso 3.1**: Crear `delete/singleDelete.ts`
- Clase `SingleDeleteManager`
- Lógica de `handleDeleteClick()` y `confirmDelete()`
- Gestión de timeout con cleanup

**Paso 3.2**: Crear `delete/batchDelete.ts`
- Clase `BatchDeleteManager`
- Interacción con modal genérico

---

### Fase 4: Implementar Capas Rendering

**Paso 4.1**: Crear `rendering/tableRenderer.ts`
- Clase `TableRenderer`
- Métodos `renderRow()` y `renderTable()`

**Paso 4.2**: Crear `rendering/paginationRenderer.ts`
- Clase `PaginationRenderer`
- Renderizado separado de paginación

**Paso 4.3**: Crear `rendering/selectionBarRenderer.ts`
- Clase `SelectionBarRenderer`
- Actualización dinámica de barra

---

### Fase 5: Implementar Capas Events

**Paso 5.1**: Crear `events/tableEventManager.ts`
- Event delegation con `addEventListener()`
- Retorna función de unsubscribe

**Paso 5.2**: Crear `events/selectionEventManager.ts`
- Listeners de checkboxes
- Select all logic

**Paso 5.3**: Crear `events/paginationEventManager.ts`
- Listeners de botones prev/next
- Listeners de números de página

---

### Fase 6: Integración (Nuevo Entry Point)

**Paso 6.1**: Crear `filesPage/index.ts`
- Orquestación de todos los módulos
- Llama a `onPageLoad()` con setup centralizado

**Paso 6.2**: Migración de `src/scripts/filesPage.ts`
```typescript
import { initFilesPage } from './filesPage/index.js';

onPageLoad(() => {
  initFilesPage();
});
```

---

## 4. Beneficios de la Modularización

| Beneficio | Cómo se logra |
|-----------|---------------|
| **Testabilidad** | Clases con métodos puros, mocks fáciles |
| **Reutilización** | `FileStore` usable en `uploadPage.ts` |
| **Mantenimiento** | Cambios localizados en un módulo |
| **Escalabilidad** | Agregar features (ej: export) sin tocar core |
| **Performance** | Event delegation eficiente, menos re-renders |
| **Documentación** | Interfaces claras, responsabilidades bien definidas |
| **Debugging** | Stack traces claros, métodos nombres explícitos |

---

## 5. Patrones Aplicados

### 5.1 Observer Pattern
`SelectionManager` notifica cambios a subscribers:
```typescript
const unsub = selectionManager.subscribe((state) => {
  updateSelectionUI(); // Re-render cuando cambia selección
});
```

### 5.2 Event Delegation
`TableEventManager` centraliza listeners:
```typescript
const unsubDelete = tableEventManager.onDeleteClick((fileId) => {
  singleDeleteManager.handleDeleteClick(fileId);
});
```

### 5.3 Dependency Injection
Inyectar dependencias en constructores:
```typescript
const singleDelete = new SingleDeleteManager(fileStore);
```

### 5.4 Separation of Concerns
- **Core**: Estado puro
- **Delete**: Lógica de negocio
- **Rendering**: Generación HTML
- **Events**: Interacción usuario
- **Utils**: Helpers

---

## 6. Consideraciones Especiales

### 6.1 View Transitions (Astro)
- `onPageLoad()` se dispara múltiples veces
- **Solución**: `cleanup()` en cada módulo, `reset()` en stores
- Registrar cleanup en `onBeforeSwap()`

### 6.2 Memory Leaks
- Listeners no removidos
- **Solución**: Retornar funciones `unsubscribe()` de cada manager
- Llamar `cleanup()` antes de navegar

### 6.3 Compatibilidad Backwards
- El script seguirá siendo `src/scripts/filesPage.ts` desde la página
- **Solución**: Mantener como wrapper que llama a `filesPage/index.ts`
- Evita cambios en `files.astro`

---

## 7. Mapa de Migración (Código a Código)

| Función Original | Ubicación Nueva |
|------------------|-----------------|
| `renderFileRow()` | `utils/fileFormatting.ts` (función pura) |
| `renderTable()` | `rendering/tableRenderer.ts` |
| `updateEmptyState()` | `rendering/tableRenderer.ts` |
| `updatePagination()` | `rendering/paginationRenderer.ts` |
| `loadFiles()` | `core/fileStore.ts` |
| `handleDeleteClick()` | `delete/singleDelete.ts` |
| `confirmDelete()` | `delete/singleDelete.ts` |
| `toggleFileSelection()` | `core/selectionManager.ts` |
| `selectAllCurrentPage()` | `core/selectionManager.ts` |
| `deleteSelected()` | `delete/batchDelete.ts` |
| `setupDeleteButtons()` | `events/tableEventManager.ts` |
| `setupCheckboxes()` | `events/selectionEventManager.ts` |
| `setupTableNavigation()` | `events/tableEventManager.ts` |

---

## 8. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Severidad | Mitigación |
|--------|-------------|-----------|-----------|
| Regresión funcional | Media | Alta | Tests manuales exhaustivos antes de merge |
| Aumento de bundle size | Baja | Baja | Tree-shaking de modulos no usados |
| Curva de aprendizaje | Media | Baja | Documentar en cada módulo |
| Incompatibilidad View Transitions | Baja | Media | Testing en ambos modos de navegación |
| Performance peor | Muy baja | Media | Benchmarking antes/después |

---

## 9. Testing Post-Refactorización

### 9.1 Tests Funcionales (Manuales)
- [ ] Cargar página `/files` con archivos
- [ ] Seleccionar/deseleccionar individual
- [ ] Seleccionar todos en página
- [ ] Eliminar 1 archivo con confirmación inline
- [ ] Eliminar múltiples con modal
- [ ] Navegar entre páginas
- [ ] Eliminar último archivo (empty state)
- [ ] Navegar a visualizador desde tabla
- [ ] View Transitions funcionan correctamente

### 9.2 Tests Unitarios (Recomendado)
```typescript
// Ejemplo para FileStore
describe('FileStore', () => {
  it('should load files from IndexedDB', async () => {
    const store = new FileStore();
    await store.loadFiles();
    expect(store.getFiles()).toBeTruthy();
  });
});

// Ejemplo para SelectionManager
describe('SelectionManager', () => {
  it('should toggle selection', () => {
    const manager = new SelectionManager();
    manager.toggle('file-1');
    expect(manager.isSelected('file-1')).toBe(true);
  });
});
```

---

## 10. Orden de Prioridad Implementación

### Prioritario (MVP de refactorización)
1. `core/fileStore.ts` - Base para todo
2. `core/selectionManager.ts` - Independiente
3. `core/paginationManager.ts` - Independiente
4. `utils/fileFormatting.ts` - Utilidad

### Alto (Resto de core)
5. `delete/singleDelete.ts`
6. `delete/batchDelete.ts`

### Medio (Rendering)
7. `rendering/tableRenderer.ts`
8. `rendering/paginationRenderer.ts`
9. `rendering/selectionBarRenderer.ts`

### Bajo (Events - Más refactorización)
10. `events/tableEventManager.ts`
11. `events/selectionEventManager.ts`
12. `events/paginationEventManager.ts`

### Final (Integración)
13. `filesPage/index.ts` (Orquestador)
14. Actualizar `src/scripts/filesPage.ts` (Wrapper)

---

## 11. Archivos Críticos para Implementación

- **src/lib/types.ts** - Extender con tipos de managers
- **src/scripts/filesPage.ts** - Convertir en wrapper
- **src/pages/files.astro** - Cambios mínimos
- **src/components/files/FileTable.astro** - Posible refactorización futura

---

## 12. Conclusión

La refactorización modulariza responsabilidades claras, mejora testabilidad y prepara el codebase para:
- Agregar features (exports, filtros, búsqueda)
- Reutilizar lógica en otras páginas
- Optimizar performance sin miedo a regresiones
- Onboarding más fácil de nuevos desarrolladores

**Estado**: Plan completo y listo para implementación
**Próximo paso**: Usar agente `implementer` para desarrollar módulos en fase 1
