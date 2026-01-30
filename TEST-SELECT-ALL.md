# Test Manual: Select-All Checkbox Fix

## Prerequisitos

1. Tener archivos en IndexedDB (cargar algunos archivos primero en `/`)
2. Haber ejecutado `pnpm dev` para iniciar el servidor

## Pasos de Test

### Test 1: Verificar que Select-All funciona

1. Navegar a `http://localhost:4321/files`
2. Esperar que aparezca la tabla con archivos
3. **Clickear el checkbox en el header de la tabla** (a la izquierda de "File Name")
4. Verificar que:
   - [ ] TODOS los checkboxes de las filas se marcan como "checked" visualmente (azul)
   - [ ] La barra de selección aparece en la parte SUPERIOR con el contador (ej: "3 selected")
   - [ ] Los iconos en la barra de selección son visibles (X para cancelar, trash para borrar)

**Resultado esperado:** Los 3 checkboxes (o N archivos) están marcados, barra de selección visible

### Test 2: Deseleccionar todos

1. Desde la pantalla anterior (con todos seleccionados)
2. **Clickear el checkbox del header nuevamente** para deseleccionar
3. Verificar que:
   - [ ] Todos los checkboxes de las filas se desmarcan
   - [ ] La barra de selección desaparece
   - [ ] El checkbox del header vuelve a estar desmarcado

**Resultado esperado:** Todos deseleccionados, barra desaparece

### Test 3: Seleccionar individual + Select-All indeterminate

1. Clickear en el checkbox de **una sola fila** (no el del header)
2. Verificar que:
   - [ ] Solo ese checkbox aparece "checked"
   - [ ] El checkbox del header aparece con un "dash" visual (estado indeterminado)
   - [ ] La barra de selección muestra "1 selected"

3. Clickear el checkbox del header
4. Verificar que:
   - [ ] Todos los checkboxes se marcan
   - [ ] El checkbox del header ya NO tiene el "dash"
   - [ ] La barra muestra "N selected" (donde N es total de archivos)

**Resultado esperado:** Indeterminate state funciona correctamente

### Test 4: Delete masivo

1. Clickear el checkbox del header para seleccionar todos
2. Verificar que aparece la barra de selección
3. Clickear el botón **trash icon** en la barra de selección
4. Verificar que:
   - [ ] Un modal de confirmación aparece
   - [ ] El modal pregunta por eliminar N archivos
5. Clickear **"Confirm"** en el modal
6. Verificar que:
   - [ ] Los archivos desaparecen de la tabla
   - [ ] La barra de selección desaparece
   - [ ] Si no hay más archivos, aparece el "empty state"

**Resultado esperado:** Eliminación masiva funciona completamente

### Test 5: Select-All en página 2 (si hay paginación)

1. Cargar varios archivos para tener 2+ páginas
2. Navegar a página 1
3. Clickear select-all en página 1
4. Verificar que solo se seleccionan archivos de página 1
5. Navegar a página 2
6. Verificar que:
   - [ ] Los archivos de página 1 YA NO están seleccionados
   - [ ] El checkbox del header de página 2 está desmarcado
   - [ ] La barra de selección desaparece

**Nota:** Esto es comportamiento correcto (select-all solo selecciona la página actual)

## Debug Console

Si algo no funciona, abrir DevTools (F12) y revisar:

```javascript
// Ver si hay errores en consola
console.log("Check console for [FilesPage] debug messages");

// El evento debería logged si DEBUG está activo:
// [FilesPage] Select all change: true
// [FilesPage] Checkbox change: <id>
```

## Qué verificar si no funciona

| Síntoma | Causa probable | Solución |
|---------|-----------------|----------|
| Checkbox del header no tiene `[data-file-table]` en el parent `<table>` | DOM no actualizó | Limpiar caché del navegador, F5 hard refresh |
| El evento `change` nunca se dispara | El listener no está en `<table>` | Verificar que `index.ts` pasa `TABLE_SELECTOR` a `SelectionEventManager` |
| Solo se seleccionan algunos archivos | El state del SelectionManager no actualiza | Revisar que `selectPage()` agrega todos los IDs |
| La barra no aparece pero hay selección | `renderUI()` no se ejecuta | Verificar que el observable está suscrito en `connectObservables()` |

## Archivos a revisar si hay problemas

```
src/
├── components/files/FileTable.astro                       (data-file-table ✓)
└── scripts/filesPage/
    ├── index.ts                                           (TABLE_SELECTOR ✓)
    ├── utils/domSelectors.ts                              (TABLE_SELECTOR ✓)
    └── events/selectionEventManager.ts                    (tableElement ✓)
```

---

## Commits relacionados

Este fix fue implementado en la rama `feature/files-page-ui` y corrige el bug crítico donde el select-all checkbox no funcionaba debido a un problema en la delegación de eventos.

**Cambios mínimos:**
- 1 atributo en Astro component
- 1 selector en domSelectors
- 3 cambios de variable en SelectionEventManager
- 1 cambio en index.ts

**Build:** Pasó sin errores (verificado con `pnpm build`)
