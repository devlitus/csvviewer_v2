# Plan: Fix Column Visibility Dropdown Not Opening

## 1. Resumen

El dropdown de visibilidad de columnas (FilterButton) no se abre al hacer click en el boton trigger. El problema raiz es una **doble inicializacion** del visualizer page causada por `pageInit.ts`, que registra el callback tanto en `astro:page-load` como ejecuta inmediatamente si el DOM ya cargo. Esto duplica los event listeners del trigger, causando que el dropdown se abra y cierre en el mismo click (doble toggle).

## 2. Analisis del Estado Actual

### Causa raiz identificada

En `src/lib/pageInit.ts`, la funcion `onPageLoad()` hace lo siguiente:

1. Registra el callback en `astro:page-load` (linea 29)
2. Si `document.readyState !== 'loading'`, ejecuta el callback inmediatamente (linea 37)

Cuando Astro con ViewTransitions carga la pagina:
- `astro:page-load` se dispara en la carga inicial (documentado en Astro)
- Si el script se ejecuta cuando el DOM ya esta listo, `callback()` se ejecuta inmediatamente

**Resultado:** `initVisualizerPage()` se ejecuta **dos veces**:
- Una vez inmediatamente (linea 37 de pageInit.ts)
- Una vez cuando `astro:page-load` se dispara

### Efecto de la doble inicializacion

En la segunda ejecucion de `initVisualizerPage()`:
- Se crean **nuevas instancias** de todos los managers (lineas 64-75 de index.ts)
- Las variables module-level (`columnVisibilityEvents`, etc.) se sobreescriben con las nuevas instancias
- Los **listeners de la primera ejecucion nunca se limpian** -- `cleanup()` solo se llama en `onBeforeSwap`, no entre inicializaciones
- Los elementos DOM son los mismos, asi que el boton trigger ahora tiene **dos** click listeners
- Cada click hace toggle dos veces: abre -> cierra inmediatamente

### Archivos involucrados

| Archivo | Rol en el problema |
|---------|-------------------|
| `src/lib/pageInit.ts` | Causa la doble ejecucion del callback |
| `src/scripts/visualizerPage/index.ts` | No limpia estado previo antes de reinicializar |
| `src/scripts/visualizerPage/events/columnVisibilityEventManager.ts` | Registra listeners duplicados en el trigger |

### Confirmacion del diagnostico

Para confirmar, se puede agregar un `console.log("initVisualizerPage called")` al inicio de la funcion y verificar que aparece dos veces en la consola del navegador.

## 3. Solucion Propuesta

### Opcion A (Recomendada): Guard de inicializacion en index.ts

Agregar un guard que llame `cleanup()` al inicio de `initVisualizerPage()` para limpiar listeners previos antes de reinicializar. Esta solucion es defensiva y funciona independientemente de cuantas veces se llame.

**Justificacion:** Es la solucion mas segura porque protege contra cualquier escenario de doble inicializacion (ViewTransitions, hot reload, etc.) sin modificar `pageInit.ts` que otros modulos pueden usar.

### Opcion B: Corregir pageInit.ts

Modificar `onPageLoad()` para que no duplique la ejecucion. Usar un flag o detectar si `astro:page-load` ya se va a disparar.

**Problema:** Modificar `pageInit.ts` afecta a todos los scripts que lo usan (`uploadPage.ts`, `filesPage.ts`). Requiere verificar que ninguno dependa del comportamiento actual.

### Opcion C: Combinar A + B

Aplicar ambas correcciones para maxima robustez.

**Recomendacion:** Implementar **Opcion A** como fix inmediato. La Opcion B se puede evaluar como mejora posterior, verificando primero que `uploadPage.ts` y `filesPage.ts` no tengan el mismo problema de doble inicializacion.

## 4. Detalles de Implementacion

### Paso 1: Agregar cleanup defensivo en initVisualizerPage()

**Archivo:** `src/scripts/visualizerPage/index.ts`

**Cambio:** Al inicio de `initVisualizerPage()`, antes de crear nuevas instancias, llamar `cleanup()` para limpiar cualquier estado previo. Agregar una verificacion de que los managers existan antes de limpiarlos.

Ubicacion: linea 62, inmediatamente despues de `try {`, agregar:

```
// Cleanup previous initialization if any (defensive against double-init)
if (columnVisibilityEvents) cleanup();
```

Esto asegura que si `initVisualizerPage()` se llama dos veces, la segunda ejecucion limpia los listeners de la primera antes de crear nuevos.

### Paso 2 (Opcional): Usar flag de inicializacion

**Archivo:** `src/scripts/visualizerPage/index.ts`

**Cambio:** Agregar una variable `let initialized = false;` a nivel de modulo. Al inicio de `initVisualizerPage()`, si `initialized` es true, llamar cleanup y resetear. Al final, poner `initialized = true`.

Esto es mas explicito que solo el cleanup defensivo.

### Paso 3 (Mejora futura): Corregir pageInit.ts

**Archivo:** `src/lib/pageInit.ts`

**Cambio:** Evitar la doble ejecucion. Opciones:
- Eliminar el bloque `else { callback() }` y confiar solo en `astro:page-load` (que ya se dispara en carga inicial)
- O agregar un flag para que `astro:page-load` no ejecute si ya se ejecuto manualmente

**Nota importante:** `astro:page-load` se dispara en la carga inicial de pagina segun la documentacion de Astro. Por lo tanto, el bloque `else { callback() }` es redundante y causa la doble ejecucion. La correccion correcta seria:

```
// Solo registrar astro:page-load, que cubre tanto carga inicial como navegacion SPA
document.addEventListener('astro:page-load', callback);
```

Sin embargo, esto requiere verificar que `astro:page-load` siempre se dispare (incluso sin ViewTransitions habilitadas). Si hay un escenario donde no se dispara, el fallback `DOMContentLoaded` seria necesario, pero deberia ser **mutuamente excluyente** con `astro:page-load`.

## 5. Criterios de Validacion

1. **Abrir el dropdown:** Click en el boton "Columns" debe mostrar el panel dropdown
2. **Cerrar el dropdown:** Segundo click en "Columns" debe cerrarlo
3. **Click fuera:** Click fuera del dropdown debe cerrarlo
4. **Tecla Escape:** Presionar Escape con dropdown abierto debe cerrarlo
5. **Select All / Deselect All:** Los botones dentro del dropdown deben funcionar
6. **Checkboxes:** Marcar/desmarcar columnas debe actualizar la tabla
7. **Contador:** El badge "X/Y" debe reflejar las columnas visibles
8. **Console check:** Solo debe aparecer un log de inicializacion (no dos)
9. **Navegacion SPA:** Navegar a otra pagina y volver al visualizer debe funcionar correctamente
10. **Recarga completa:** F5 en la pagina del visualizer debe funcionar correctamente

## 6. Riesgos y Consideraciones

| Riesgo | Mitigacion |
|--------|-----------|
| Otros scripts (`uploadPage.ts`, `filesPage.ts`) pueden tener el mismo bug de doble inicializacion | Verificar si tienen sintomas similares; si es asi, aplicar el mismo patron de cleanup defensivo |
| Modificar `pageInit.ts` puede romper otros scripts | Por eso se recomienda Opcion A primero (solo modifica index.ts del visualizer) |
| El cleanup al inicio de init podria causar un flash visual si el contenido se muestra brevemente | No deberia pasar porque `showLoading()` se llama inmediatamente despues |
| Astro ViewTransitions podria cambiar comportamiento en futuras versiones | El cleanup defensivo es robusto ante cambios de timing |
