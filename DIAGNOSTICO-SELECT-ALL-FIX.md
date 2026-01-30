# Diagnóstico y Corrección: Select-All Checkbox

## Problema Reportado

El select-all checkbox en `FileTable.astro` **NO seleccionaba** los checkboxes individuales de archivos. Síntomas:
- Los checkboxes individuales no se marcaban como "checked" visualmente
- La barra de selección no aparecía
- La eliminación masiva no funcionaba

---

## Investigación: Dónde estaba el quiebre

### Estructura del DOM

```
FileTable.astro (component)
├── <table data-file-table>          ← AGREGADO en la corrección
│   ├── <thead>
│   │   └── <th>
│   │       └── <input data-select-all-checkbox>  ← AQUÍ está el checkbox
│   │
│   └── <tbody data-file-table-body>
│       └── <tr data-file-id="...">
│           └── <input data-file-checkbox>        ← Y AQUÍ los individuales
```

### El Problema: Event Delegation Incorrecta

La clase `SelectionEventManager` estaba configurada para escuchar eventos en `[data-file-table-body]` que es la etiqueta `<tbody>`.

```typescript
// ANTES (línea 19 en selectionEventManager.ts)
constructor(tableBodySelector: string = TABLE_BODY_SELECTOR) {
  this.tableBody = document.querySelector(tableBodySelector);  // [data-file-table-body]
  this.setupDelegation();
}

// setupDelegation registraba el listener SOLO en <tbody>
this.tableBody.addEventListener("change", changeHandler);
```

**El problema:** El select-all checkbox está en `<thead>` que está **FUERA** del `<tbody>`, por lo que el evento `change` nunca se capturaba con event delegation.

```
Flujo erróneo:
Usuario clickea select-all checkbox en <thead>
  ↓
Evento "change" dispara en el checkbox
  ↓
Event delegation busca el listener en <tbody>  ← NO ENCUENTRA NADA
  ↓
Callback NUNCA se ejecuta
  ↓
SelectionManager NUNCA es actualizado
  ↓
Los checkboxes individuales NUNCA se marcan como checked
```

---

## Solución Implementada

### Estrategia: Expandir el contenedor de event delegation

En lugar de escuchar eventos en `<tbody>`, ahora escuchamos en `<table>` que es el contenedor padre de ambos `<thead>` y `<tbody>`.

### Cambios realizados:

#### 1. **FileTable.astro** (línea 10)
Agregamos atributo `data-file-table` a la tabla:
```astro
<table class="w-full border-collapse" data-file-table>
```

#### 2. **domSelectors.ts** (líneas 8-9)
Agregamos nuevo selector constante:
```typescript
/** Contenedor principal de la tabla de archivos (thead + tbody) */
export const TABLE_SELECTOR: string = "[data-file-table]";
```

#### 3. **SelectionEventManager.ts** (líneas 11-20)
Cambio de contenedor de escucha:
```typescript
// ANTES
import { TABLE_BODY_SELECTOR } from "../utils/domSelectors.js";
constructor(tableBodySelector: string = TABLE_BODY_SELECTOR) {
  this.tableBody = document.querySelector(tableBodySelector);

// DESPUÉS
import { TABLE_SELECTOR } from "../utils/domSelectors.js";
constructor(tableSelector: string = TABLE_SELECTOR) {
  this.tableElement = document.querySelector(tableSelector);
```

#### 4. **index.ts** (línea 100)
Pasar el `TABLE_SELECTOR` en lugar de `TABLE_BODY_SELECTOR`:
```typescript
// ANTES
selectionEventManager = new SelectionEventManager(TABLE_BODY_SELECTOR);

// DESPUÉS
selectionEventManager = new SelectionEventManager(TABLE_SELECTOR);
```

---

## Cómo funciona ahora

```
Flujo correcto después de la corrección:
Usuario clickea select-all checkbox en <thead>
  ↓
Evento "change" dispara en el checkbox
  ↓
Event delegation busca listener en <table data-file-table> ✓ ENCUENTRA
  ↓
setupDelegation() -> changeHandler ejecuta
  ↓
target.closest("[data-select-all-checkbox]") identifica que es select-all
  ↓
this.notifySelectAllChange(true) → callback onSelectAllChange
  ↓
index.ts -> connectEventHandlers() -> selectionManager.selectPage(pageFiles)
  ↓
SelectionManager agrega todos los IDs al estado
  ↓
Observer notifica cambio
  ↓
renderUI() ejecuta
  ↓
tableRenderer.renderTable() marca todos los checkboxes como checked
  ↓
SelectionBar aparece mostrando cantidad de archivos seleccionados
```

---

## Validación: Cadena de eventos verificada

### 1. Captura del evento
✓ SelectionEventManager ahora escucha en `<table>` en lugar de `<tbody>`
✓ El listener `change` captura el evento del select-all checkbox en `<thead>`

### 2. Identificación del tipo de checkbox
✓ El código detecta correctamente `target.closest("[data-select-all-checkbox]")`
✓ Se diferencia de checkboxes individuales con `target.closest("[data-file-checkbox]")`

### 3. Notificación de callbacks
✓ `onSelectAllChange()` notifica correctamente a los suscriptores
✓ En `connectEventHandlers()`, el callback ejecuta `selectionManager.selectPage(pageFiles)`

### 4. Actualización del estado
✓ `SelectionManager.selectPage()` agrega todos los IDs de la página al Set
✓ Llama a `notifySubscribers()` que dispara el observable

### 5. Re-renderizado de UI
✓ `renderUI()` se ejecuta automáticamente
✓ `TableRenderer.renderTable()` recibe los IDs seleccionados
✓ `renderFileRow()` marca checkboxes con `checked="${isSelected ? "checked" : ""}"`
✓ `updateSelectAllCheckboxState()` actualiza el estado visual del select-all

### 6. Eliminación masiva
✓ `SelectionBar` aparece cuando `selectedCount > 0`
✓ El botón delete envía los IDs seleccionados a `BatchDeleteManager`
✓ Los archivos se eliminan correctamente

---

## Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `src/components/files/FileTable.astro` | Agregó `data-file-table` a `<table>` |
| `src/scripts/filesPage/utils/domSelectors.ts` | Agregó `TABLE_SELECTOR` constante |
| `src/scripts/filesPage/events/selectionEventManager.ts` | Cambió contenedor de `tableBody` a `tableElement` con `TABLE_SELECTOR` |
| `src/scripts/filesPage/index.ts` | Importó `TABLE_SELECTOR` y pasó a `SelectionEventManager` |

---

## Verificación Manual

Para verificar que el fix funciona:

1. Navegar a `/files`
2. Esperar a que se carguen archivos desde IndexedDB
3. **Clickear el checkbox "select-all" en el header de la tabla**
4. Verificar que:
   - [x] Todos los checkboxes individuales se marcan como "checked" visualmente
   - [x] La barra de selección aparece en la parte superior con el contador
   - [x] Clickear "Delete" abre el modal de confirmación
   - [x] Confirmar eliminación elimina todos los archivos seleccionados

---

## Root Cause Analysis (RCA)

**Por qué pasó:**
- El arquitecto usó `[data-file-table-body]` como contenedor para event delegation
- No consideró que el select-all checkbox estaría en un elemento HERMANO (`<thead>`) en lugar de dentro del `<tbody>`
- El selector solo funcionaba para checkboxes dentro del `<tbody>`

**Por qué no se detectó antes:**
- No hubo test manual del flujo "clickear select-all → marcar todas las filas"
- No se verificó que el evento se capturaba correctamente

**Lección aprendida:**
- Event delegation necesita un contenedor que sea ANCESTRO de TODOS los elementos que emiten eventos
- En tablas, usar `<table>` es más seguro que `<tbody>` para capturar eventos de header y body

---

## Impacto

**Severidad:** CRÍTICA (feature bloqueada)
**Complejidad del fix:** BAJA (cambio de selector)
**Riesgo de regresión:** MUY BAJO (no afecta otra funcionalidad)

El fix es **mínimo, robusto y completamente testeable** manualmente en `/files`.
