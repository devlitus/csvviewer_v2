# Plan: Integración IndexedDB en Visualizer

## Resumen

Conectar la página `/visualizer` con IndexedDB para cargar y mostrar los datos reales del archivo CSV seleccionado mediante el query parameter `?file=<id>`, reemplazando los datos hardcodeados actuales.

---

## Análisis del Estado Actual

### Flujo Existente (Funcional)
```
RecentFileCard (index.astro)
       ↓ click
uploadPage.ts → window.location.href = `/visualizer?file=${file.id}`
       ↓
visualizer.astro (datos hardcodeados)
```

### Componentes del Visualizer (Hardcodeados)

| Componente | Datos Hardcodeados | Ubicación |
|------------|-------------------|-----------|
| `visualizer.astro` | `fileName="sales_data_q3.csv"` | Props fijos |
| `VisualizerHeader.astro` | `fileName` por defecto | Props |
| `DataToolbar.astro` | `showingRows=50`, `totalRecords=12403` | Props |
| `CSVTable.astro` | Array `exampleRows` con 8 filas | Frontmatter |
| `CSVTableHeader.astro` | Array de 7 columnas fijas | Frontmatter |
| `CSVTableRow.astro` | Estructura fija (id, date, product, category, quantity, revenue) | Template |
| `TablePagination.astro` | `currentPage=1`, `totalPages=24` | Props |

### APIs Disponibles

```typescript
// IndexedDB (src/lib/indexeddb.ts)
getFile(id: string): Promise<CSVFile | undefined>

// Parser (src/lib/csvParser.ts)  
parseCSVString(content: string): CSVParseResult
// Retorna: { data: Record<string, string>[], rowCount: number, error?: string }

// Tipos (src/lib/types.ts)
interface CSVFile {
  id: string;
  filename: string;
  content: string;  // CSV raw
  size: number;
  uploadDate: number;
}
```

### Problema Principal

Astro frontmatter es **server-side**, pero IndexedDB es **client-side only**. No se puede:
```astro
---
// ❌ ESTO NO FUNCIONA
import { getFile } from "../lib/indexeddb";
const file = await getFile(fileId); // IndexedDB no existe en server
---
```

**Solución:** Renderizar estructura vacía en servidor → cargar datos con `<script>` client-side.

---

## Requisitos

### Funcionales
1. Leer `?file=<id>` de la URL en el cliente
2. Obtener archivo de IndexedDB con `getFile(id)`
3. Parsear contenido CSV con `parseCSVString()`
4. Renderizar dinámicamente:
   - Nombre del archivo en header
   - Columnas dinámicas (extraídas del CSV)
   - Filas de datos reales
   - Contadores actualizados (rows showing / total)
5. Manejar errores:
   - Archivo no encontrado (404-like)
   - Error de parseo
   - URL sin parámetro `file`

### No Funcionales
1. Mostrar loading state mientras carga
2. Mantener estilos actuales (dark mode, responsive)
3. Paginación funcional (client-side)
4. Transiciones suaves al cargar datos

---

## Pasos de Implementación

### Fase 1: Crear Script del Visualizer

**Archivo:** `src/scripts/visualizerPage.ts`

```
Responsabilidades:
├── Leer query param ?file=<id>
├── Llamar getFile(id) de IndexedDB
├── Llamar parseCSVString(content)
├── Renderizar header con filename
├── Extraer columnas del primer registro
├── Renderizar filas en tbody
├── Actualizar contadores en toolbar
├── Implementar paginación client-side
└── Manejar estados: loading, error, empty
```

**Funciones principales:**
1. `initVisualizerPage()` - Entry point
2. `loadFileData(fileId: string)` - Carga desde IndexedDB
3. `renderTable(data: Record<string, string>[], columns: string[])` - Genera HTML de filas
4. `renderHeader(columns: string[])` - Genera HTML de headers dinámicos
5. `updateToolbar(showing: number, total: number)` - Actualiza contadores
6. `setupPagination(totalRows: number, rowsPerPage: number)` - Eventos de paginación
7. `showLoadingState()` / `showErrorState(message)` - Estados UI

### Fase 2: Modificar Componentes Astro

#### 2.1 `visualizer.astro`
- Remover props hardcodeados
- Agregar data attributes para targeting
- Agregar `<script src="../scripts/visualizerPage.ts">`
- Agregar contenedor de loading/error states

#### 2.2 `VisualizerHeader.astro`
- Agregar `data-filename` para actualización dinámica
- Mantener estructura, solo placeholder inicial

#### 2.3 `DataToolbar.astro`
- Agregar `data-showing-rows` y `data-total-records`
- Valores iniciales: "—" o "Loading..."

#### 2.4 `CSVTable.astro`
- Remover `exampleRows` hardcodeado
- Agregar `data-csv-table-container`
- Pasar `columns={[]}` y `rows={[]}` vacíos
- El script llenará `<tbody>` dinámicamente

#### 2.5 `CSVTableHeader.astro`
- Agregar `data-table-header`
- Modificar para aceptar array vacío y renderizar desde script

#### 2.6 `CSVTableRow.astro`
- **No modificar** - se generará HTML desde script
- Copiar estructura HTML al script para consistencia

#### 2.7 `TablePagination.astro`
- Agregar data attributes: `data-current-page`, `data-total-pages`
- Agregar a botones: `data-pagination-first`, `data-pagination-prev`, etc.

### Fase 3: Implementar Estados de UI

**Loading State:**
```html
<div data-loading-state class="flex items-center justify-center h-64">
  <div class="animate-spin ...">...</div>
  <p>Loading file...</p>
</div>
```

**Error State:**
```html
<div data-error-state class="hidden flex items-center justify-center h-64">
  <span class="material-symbols-outlined text-red-400">error</span>
  <p data-error-message>File not found</p>
  <a href="/">Go back</a>
</div>
```

**Empty State (archivo sin datos):**
```html
<div data-empty-state class="hidden ...">
  <p>This CSV file has no data rows</p>
</div>
```

### Fase 4: Paginación Client-Side

**Estado en script:**
```typescript
interface PaginationState {
  currentPage: number;
  rowsPerPage: number;
  totalRows: number;
  totalPages: number;
}
```

**Lógica:**
1. Almacenar todos los datos parseados en memoria
2. Calcular `totalPages = Math.ceil(totalRows / rowsPerPage)`
3. En cada cambio de página: `slice(startIndex, endIndex)` y re-renderizar
4. Actualizar texto "Page X of Y"
5. Habilitar/deshabilitar botones en límites

---

## Archivos a Modificar

| Archivo | Acción | Cambios |
|---------|--------|---------|
| `src/scripts/visualizerPage.ts` | **Crear** | Script principal (~300 líneas) |
| `src/pages/visualizer.astro` | Modificar | Agregar script, data attrs, loading states |
| `src/components/visualizer/VisualizerHeader.astro` | Modificar | Data attribute para filename |
| `src/components/visualizer/DataToolbar.astro` | Modificar | Data attributes para contadores |
| `src/components/visualizer/CSVTable.astro` | Modificar | Remover datos hardcodeados, data attrs |
| `src/components/visualizer/CSVTableHeader.astro` | Modificar | Data attr, aceptar array vacío |
| `src/components/visualizer/TablePagination.astro` | Modificar | Data attrs en controles |

---

## Dependencias

No se requieren nuevas dependencias. Se usa:
- `src/lib/indexeddb.ts` (existente)
- `src/lib/csvParser.ts` (existente)
- `src/lib/types.ts` (existente)
- `src/lib/pageInit.ts` (existente, para View Transitions)

---

## Riesgos y Consideraciones

### 1. Archivos CSV Grandes
**Riesgo:** CSVs con miles de filas pueden causar lag al renderizar.
**Mitigación:** 
- Paginación obligatoria (máx 50-100 filas visibles)
- Lazy rendering solo de página actual
- Considerar virtualización en futuro (fuera de scope)

### 2. Columnas Dinámicas
**Riesgo:** CSVs con muchas columnas pueden romper el layout.
**Mitigación:**
- Scroll horizontal en tabla
- Truncar nombres de columnas largos
- Tooltip con nombre completo

### 3. Tipos de Datos
**Riesgo:** Todo viene como `string` del parser, no hay detección de tipos.
**Mitigación:**
- Fase 1: Mostrar todo como texto
- Futuro: Detectar números/fechas para formateo (fuera de scope actual)

### 4. View Transitions
**Riesgo:** Script puede no re-ejecutarse en navegación SPA.
**Mitigación:** Usar `onPageLoad()` de `pageInit.ts` (patrón ya usado en `uploadPage.ts`)

### 5. Archivo No Encontrado
**Riesgo:** Usuario accede con ID inválido o archivo fue eliminado.
**Mitigación:** 
- Mostrar error state con mensaje claro
- Botón para volver a inicio
- Loggear en consola para debug

### 6. CSVTableRow Hardcodeado
**Riesgo:** El componente `CSVTableRow.astro` tiene estructura fija (id, date, product...).
**Mitigación:**
- Generar HTML de filas directamente en script
- Copiar estilos de `CSVTableRow.astro` al template string
- Renderizar columnas dinámicamente según headers del CSV

---

## Testing

### Tests Manuales

| # | Escenario | Pasos | Resultado Esperado |
|---|-----------|-------|-------------------|
| 1 | Carga exitosa | Upload CSV → Click en RecentFileCard | Visualizer muestra datos reales |
| 2 | Archivo no encontrado | Navegar a `/visualizer?file=invalid-id` | Error state con mensaje |
| 3 | Sin parámetro file | Navegar a `/visualizer` | Error state "No file specified" |
| 4 | CSV vacío | Upload CSV sin datos → Visualizar | Empty state |
| 5 | CSV con error | Upload CSV malformado → Visualizar | Error de parseo |
| 6 | Paginación | CSV con 100+ filas → Navegar páginas | Datos correctos por página |
| 7 | Cambiar rows per page | Seleccionar 10/25/50 | Re-renderiza con cantidad correcta |
| 8 | Columnas dinámicas | CSV con columnas diferentes | Headers y datos correctos |
| 9 | View Transition | Navegar Home → Visualizer → Home → Visualizer | Datos cargan correctamente |
| 10 | Múltiples archivos | Upload 2 CSVs → Abrir cada uno | Cada uno muestra sus datos |

### Validación de Datos

```typescript
// Verificar en consola del navegador:
const fileId = new URLSearchParams(window.location.search).get('file');
const file = await getFile(fileId);
console.log('File:', file);
console.log('Parsed:', parseCSVString(file.content));
```

---

## Diagrama de Flujo Final

```
┌─────────────────────────────────────────────────────────────────┐
│                    VISUALIZER PAGE FLOW                          │
└─────────────────────────────────────────────────────────────────┘

User clicks RecentFileCard
          ↓
window.location.href = /visualizer?file=<id>
          ↓
┌─────────────────────────────────────────┐
│  visualizer.astro (Server Render)       │
│  - Empty table structure                │
│  - Loading state visible                │
│  - Script tag loaded                    │
└─────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────┐
│  visualizerPage.ts (Client)             │
│  1. Read ?file param                    │
│  2. getFile(id) from IndexedDB          │
│  3. parseCSVString(content)             │
│  4. Hide loading, show table            │
│  5. Render headers dynamically          │
│  6. Render rows (paginated)             │
│  7. Update toolbar counters             │
│  8. Setup pagination events             │
└─────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────┐
│  User sees CSV data                     │
│  - Real filename in header              │
│  - Dynamic columns from CSV             │
│  - Paginated rows                       │
│  - Working pagination controls          │
└─────────────────────────────────────────┘
```

---

## Estimación de Esfuerzo

| Tarea | Complejidad | Tiempo Estimado |
|-------|-------------|-----------------|
| Crear `visualizerPage.ts` | Alta | 2-3 horas |
| Modificar componentes Astro | Media | 1-2 horas |
| Implementar paginación | Media | 1 hora |
| Estados loading/error | Baja | 30 min |
| Testing manual | Media | 1 hora |
| **Total** | | **5-7 horas** |

---

## Siguiente Fase (Fuera de Scope)

- Ordenamiento de columnas
- Filtros por columna
- Exportación funcional (CSV/Excel)
- Detección de tipos de datos
- Búsqueda global en datos
- Virtualización para archivos grandes

---

**Última actualización:** 30/01/2026
