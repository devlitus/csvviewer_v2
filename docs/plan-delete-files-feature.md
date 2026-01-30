# Plan: Funcionalidad de Eliminación de Archivos en My Files

## Resumen

Implementar una funcionalidad intuitiva y creativa para eliminar archivos desde la página `/files` (My Files). El diseño incluirá dos modos de eliminación:

1. **Eliminación individual**: Botón de eliminar en cada fila con confirmación inline sutil
2. **Eliminación masiva**: Modo de selección con checkboxes y barra de acciones flotante

El enfoque prioriza la **seguridad** (evitar borrados accidentales) con una **UX fluida** (sin modales invasivos para acciones simples).

---

## Análisis del Estado Actual

### Código existente relevante

| Archivo | Función |
|---------|---------|
| [src/lib/indexeddb.ts](../src/lib/indexeddb.ts) | Ya tiene `deleteFiles(ids: string[])` que acepta array de IDs |
| [src/scripts/filesPage.ts](../src/scripts/filesPage.ts) | Renderiza tabla dinámicamente con `renderFileRow()`, maneja paginación |
| [src/pages/files.astro](../src/pages/files.astro) | Página con header, tabla y empty state |
| [src/components/files/FileTable.astro](../src/components/files/FileTable.astro) | Contenedor de tabla con thead sticky |
| [src/components/files/Pagination.astro](../src/components/files/Pagination.astro) | Footer de paginación |

### Observaciones

- La columna de **Actions** ya existe con un botón `more_vert` (tres puntos) que actualmente no hace nada
- Las filas tienen `data-file-id` para identificar cada archivo
- El sistema de renderizado es completamente dinámico (JavaScript genera las filas)
- Ya existe la función `deleteFiles()` en IndexedDB, solo falta la UI

---

## Requisitos

### Funcionales

1. **RF-01**: El usuario puede eliminar un archivo individual desde la fila de la tabla
2. **RF-02**: El usuario puede seleccionar múltiples archivos y eliminarlos en lote
3. **RF-03**: Debe existir una confirmación antes de eliminar para prevenir accidentes
4. **RF-04**: El estado de la tabla se actualiza inmediatamente tras eliminar
5. **RF-05**: Si se eliminan todos los archivos de una página, navegar a la página anterior (o mostrar empty state)

### No Funcionales

1. **RNF-01**: La confirmación no debe ser un modal bloqueante para eliminación individual (UX fluida)
2. **RNF-02**: Para eliminación masiva, usar confirmación más explícita (modal o barra de confirmación)
3. **RNF-03**: Animaciones sutiles para feedback visual (fade out de filas eliminadas)
4. **RNF-04**: Accesibilidad: botones con `aria-label`, focus visible, soporte de teclado

---

## Diseño de la Solución

### Concepto de UX: "Delete with Confidence"

```
┌─────────────────────────────────────────────────────────────────────────┐
│  My Files                                              [Upload New]     │
├─────────────────────────────────────────────────────────────────────────┤
│  ☐  │ File Name        │ Date       │ Size   │ Status    │ Actions     │
├─────────────────────────────────────────────────────────────────────────┤
│  ☐  │ 📊 sales.csv     │ 2 days ago │ 1.2 MB │ Processed │ [🗑️]       │
│  ☐  │ 📊 users.csv     │ 5 days ago │ 456 KB │ Processed │ [🗑️]       │
│  ☑  │ 📊 inventory.csv │ 1 week ago │ 2.1 MB │ Processed │ [🗑️]       │  ← Seleccionado
│  ☑  │ 📊 orders.csv    │ 1 week ago │ 890 KB │ Processed │ [🗑️]       │  ← Seleccionado
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  ███  2 files selected              [Cancel]  [Delete Selected]  🗑️    │  ← Barra flotante
└─────────────────────────────────────────────────────────────────────────┘
```

### Flujo 1: Eliminación Individual (Hover + Confirm Inline)

1. Usuario hace hover en una fila → aparece botón de delete (icono `delete`)
2. Click en delete → el botón cambia a estado de confirmación con texto "Delete?" y color rojo
3. Click de nuevo → se elimina el archivo con animación fade-out
4. Click fuera o 3 segundos → el botón vuelve a estado normal

**Ventaja**: No interrumpe el flujo con modales para acciones simples.

### Flujo 2: Eliminación Masiva (Selección + Barra Flotante)

1. La tabla tiene checkboxes en la primera columna (ocultos por defecto, aparecen al hover)
2. Al seleccionar al menos 1 archivo → aparece barra flotante en la parte inferior
3. La barra muestra: contador de seleccionados + botón "Cancel" + botón "Delete Selected"
4. Click en "Delete Selected" → muestra confirmación en la misma barra: "Delete 3 files? [Yes] [No]"
5. Confirmar → elimina todos, actualiza tabla, oculta barra

**Variante creativa**: El checkbox del header permite "Select All" en la página actual.

---

## Pasos de Implementación

### Fase 1: Estructura Base

#### Paso 1.1: Agregar columna de checkbox a la tabla
- Modificar `FileTable.astro`: agregar `<th>` para checkbox en el header
- Modificar `renderFileRow()` en `filesPage.ts`: agregar `<td>` con checkbox al inicio

#### Paso 1.2: Actualizar botón de acciones por fila
- Reemplazar el icono `more_vert` por `delete` 
- Agregar clases para mostrar solo en hover: `opacity-0 group-hover:opacity-100`
- Agregar `data-delete-button` y `data-file-id` al botón

### Fase 2: Eliminación Individual

#### Paso 2.1: Implementar lógica de confirmación inline
En `filesPage.ts`:
```typescript
// Estado para tracking de confirmación
let pendingDeleteId: string | null = null;
let confirmTimeout: number | null = null;

function handleDeleteClick(fileId: string, button: HTMLButtonElement): void {
  if (pendingDeleteId === fileId) {
    // Segundo click: confirmar eliminación
    confirmDelete(fileId);
  } else {
    // Primer click: mostrar estado de confirmación
    showDeleteConfirm(fileId, button);
  }
}
```

#### Paso 2.2: Implementar estados visuales del botón
- Estado normal: icono `delete` gris
- Estado confirmar: texto "Delete?" + fondo rojo semitransparente
- Usar clases de Tailwind para la transición

#### Paso 2.3: Implementar función de eliminación
```typescript
async function confirmDelete(fileId: string): Promise<void> {
  await deleteFiles([fileId]);
  // Animar fade-out de la fila
  // Recargar tabla
}
```

### Fase 3: Selección Múltiple

#### Paso 3.1: Implementar estado de selección
```typescript
let selectedFiles: Set<string> = new Set();

function toggleFileSelection(fileId: string): void {
  if (selectedFiles.has(fileId)) {
    selectedFiles.delete(fileId);
  } else {
    selectedFiles.add(fileId);
  }
  updateSelectionUI();
}
```

#### Paso 3.2: Crear componente de barra flotante
Nuevo archivo: `src/components/files/SelectionBar.astro`
```
┌──────────────────────────────────────────────────────────────┐
│ 🔵 X files selected              [Cancel]  [Delete Selected] │
└──────────────────────────────────────────────────────────────┘
```
- Posición: `fixed bottom-6 left-1/2 -translate-x-1/2`
- Animación de entrada: `translate-y-full → translate-y-0`
- Fondo oscuro con blur: `bg-surface-dark/95 backdrop-blur-sm`

#### Paso 3.3: Lógica de Select All
- Checkbox en header con estado indeterminado si selección parcial
- Click selecciona/deselecciona todos los de la página actual

### Fase 4: Modal de Confirmación (para eliminación masiva)

#### Paso 4.1: Crear componente ConfirmationModal
Nuevo archivo: `src/components/ui/ConfirmationModal.astro`
- Modal genérico reutilizable
- Props: `title`, `message`, `confirmText`, `cancelText`, `variant` (danger/warning)
- Controlado por data attributes y JavaScript

#### Paso 4.2: Integrar modal con eliminación masiva
- Click en "Delete Selected" → abre modal
- Modal muestra: "Delete X files? This action cannot be undone."
- Confirmar → ejecuta `deleteFiles()` con todos los IDs seleccionados

### Fase 5: Feedback Visual

#### Paso 5.1: Animación de eliminación
```css
.file-row-deleting {
  animation: fadeOutRow 300ms ease-out forwards;
}

@keyframes fadeOutRow {
  to {
    opacity: 0;
    transform: translateX(-20px);
    height: 0;
    padding: 0;
  }
}
```

#### Paso 5.2: Toast de confirmación (opcional)
- Después de eliminar: "X file(s) deleted" con icono check
- Auto-dismiss en 3 segundos

---

## Archivos a Modificar/Crear

### Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/components/files/FileTable.astro` | Agregar columna de checkbox en header |
| `src/scripts/filesPage.ts` | Toda la lógica de selección, confirmación y eliminación |
| `src/pages/files.astro` | Agregar SelectionBar y ConfirmationModal |
| `src/styles/global.css` | Agregar keyframes de animación (opcional) |

### Archivos a Crear

| Archivo | Propósito |
|---------|-----------|
| `src/components/files/SelectionBar.astro` | Barra flotante para acciones masivas |
| `src/components/ui/ConfirmationModal.astro` | Modal de confirmación reutilizable |

---

## Dependencias

No se requieren nuevas dependencias. Todo se implementa con:
- TypeScript nativo
- Tailwind CSS (ya instalado)
- Material Symbols (ya configurado)
- IndexedDB API existente

---

## Riesgos y Consideraciones

### Riesgo 1: Pérdida accidental de datos
**Mitigación**: 
- Confirmación obligatoria para eliminación masiva
- El botón de confirmar inline requiere dos clicks
- Timeout de 3 segundos para cancelar confirmación individual

### Riesgo 2: Estado inconsistente con paginación
**Mitigación**:
- Al eliminar, recalcular `totalPages`
- Si `currentPage > totalPages`, navegar a la última página válida
- Limpiar selección después de cada eliminación

### Riesgo 3: Conflicto con navegación de filas
**Mitigación**:
- Los clicks en checkboxes y botón delete deben usar `e.stopPropagation()` 
- Evitar que el click en controles dispare navegación al visualizador

### Riesgo 4: Accesibilidad
**Mitigación**:
- Checkboxes con `aria-label="Select file {filename}"`
- Botón delete con `aria-label="Delete file {filename}"`
- Modal con `role="dialog"` y `aria-modal="true"`
- Focus trap en modal abierto

---

## Testing

### Tests Manuales Requeridos

| ID | Escenario | Pasos | Resultado Esperado |
|----|-----------|-------|-------------------|
| T01 | Eliminar archivo individual | Hover en fila → Click delete → Click "Delete?" | Archivo eliminado, fila desaparece con animación |
| T02 | Cancelar eliminación individual | Click delete → Esperar 3s | Botón vuelve a estado normal |
| T03 | Seleccionar múltiples archivos | Click en checkboxes de 3 filas | Barra flotante muestra "3 files selected" |
| T04 | Eliminar selección | Con 3 seleccionados → Click "Delete Selected" → Confirmar en modal | Los 3 archivos eliminados, barra desaparece |
| T05 | Select All | Click checkbox del header | Todos los archivos de la página seleccionados |
| T06 | Deselect All | Con todos seleccionados → Click checkbox header | Todos deseleccionados, barra desaparece |
| T07 | Eliminar última página | En página 2 con 1 archivo → Eliminar | Navega a página 1 automáticamente |
| T08 | Eliminar todos los archivos | Seleccionar todos → Eliminar | Empty state visible |
| T09 | Cancelar eliminación masiva | Click "Delete Selected" → Click "No" en modal | Modal cierra, nada eliminado |
| T10 | Click en fila con checkbox | Click en área de la fila (no checkbox/delete) | Navega al visualizador (comportamiento actual) |

### Tests de Accesibilidad

| ID | Verificación |
|----|--------------|
| A01 | Navegación con Tab entre checkboxes y botones |
| A02 | Enter/Space activan checkbox y botones |
| A03 | Escape cierra modal de confirmación |
| A04 | Screen reader anuncia correctamente los labels |

---

## Mockup Visual de Estados

### Botón Delete - Estados

```
Normal (hover):     [ 🗑️ ]           → gris, opacity 70%
Confirmar:          [ Delete? ]      → fondo rojo/10, texto rojo, border rojo
Eliminando:         [ ⏳ ]           → spinner o pulse animation
```

### Fila en proceso de eliminación

```
┌────────────────────────────────────────────────────────┐
│  ☐  │ 📊 sales.csv │ ... │ Processed │ [🗑️]          │  ← Normal
├────────────────────────────────────────────────────────┤
│  ☐  │ 📊 sales.csv │ ... │ Processed │ [Delete?]     │  ← Confirmando
├────────────────────────────────────────────────────────┤
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  ← Eliminando (fade)
└────────────────────────────────────────────────────────┘
```

### Barra de Selección Flotante

```
┌──────────────────────────────────────────────────────────────────────┐
│  ●  3 files selected                    [Cancel]  [🗑️ Delete (3)]   │
└──────────────────────────────────────────────────────────────────────┘

Estilos:
- Fondo: bg-surface-card border border-border-dark
- Sombra: shadow-lg shadow-black/20
- Esquinas: rounded-xl
- Padding: px-6 py-3
- Botón Delete: bg-red-500 hover:bg-red-600 text-white
- Botón Cancel: border border-border-dark text-text-light-gray
```

---

## Orden de Implementación Sugerido

1. **Sprint 1 - MVP de eliminación individual** (Pasos 1.2, 2.1, 2.2, 2.3)
   - Modificar botón de acciones
   - Implementar confirmación inline
   - Conectar con `deleteFiles()`
   
2. **Sprint 2 - Selección múltiple** (Pasos 1.1, 3.1, 3.2, 3.3)
   - Agregar checkboxes
   - Crear SelectionBar
   - Implementar Select All

3. **Sprint 3 - Modal y polish** (Pasos 4.1, 4.2, 5.1)
   - Crear ConfirmationModal
   - Agregar animaciones
   - Testing y ajustes finales
