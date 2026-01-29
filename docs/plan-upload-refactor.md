# Plan: Refactorizacion de UploadZone

## Resumen del problema

El componente `UploadZone.astro` contiene ~110 lineas de logica JavaScript inline en un bloque `<script>`. Esto viola la separacion de responsabilidades del proyecto, donde la logica client-side deberia vivir en `src/scripts/` o `src/lib/`. Ademas, existen bugs funcionales y discrepancias entre el UI y el comportamiento real.

## Analisis del estado actual

### Problemas identificados

| # | Problema | Severidad |
|---|---------|-----------|
| 1 | **Script monolitico inline**: toda la logica (drag & drop, validacion, upload, feedback UI) esta en un solo bloque `<script>` dentro del componente | Media |
| 2 | **Discrepancia UI vs funcionalidad**: el badge dice "Supports: .csv, .xls, .json" y el `accept` del input incluye `.xls,.xlsx,.json`, pero `uploadFiles()` solo procesa archivos `.csv` (linea 142) | Alta |
| 3 | **`window.location.reload()` como mecanismo de actualizacion**: fuerza recarga completa en lugar de actualizar el DOM o emitir un evento custom | Media |
| 4 | **Logica de upload duplicada**: `filesPage.ts` (lineas 13-40) tiene su propia version de upload con la misma logica de leer archivo + `saveFile()`, duplicando codigo | Alta |
| 5 | **Sin validacion de tamano**: el UI menciona "Max 50MB" pero no hay validacion de tamano en el codigo | Media |
| 6 | **Non-null assertions (`!`)**: uso de `uploadText!.innerText` en multiples lugares sin guard previo | Baja |
| 7 | **Import dinamico innecesario**: `await import("../../lib/indexeddb")` dentro de `uploadFiles()` cuando podria ser un import estatico al inicio del script extraido | Baja |
| 8 | **Boton Browse redundante**: el `browseButton` hace `fileInput.click()` manualmente, pero ya esta dentro de un `<label for="file-upload">`, por lo que el click del label ya dispara el input | Baja |

### Logica de upload compartida (duplicacion)

`UploadZone.astro` y `filesPage.ts` comparten este patron:

1. Iterar `FileList`
2. Filtrar solo `.csv`
3. Leer contenido con `file.text()`
4. Construir objeto `CSVFile` con `crypto.randomUUID()`
5. Llamar `saveFile()`
6. Hacer `window.location.reload()`

## Solucion propuesta

### 1. Extraer logica de upload a `src/lib/fileUpload.ts`

Crear un modulo reutilizable que encapsule la logica de procesamiento y persistencia de archivos. Este modulo sera usado tanto por `UploadZone` como por `filesPage.ts`.

**Archivo: `src/lib/fileUpload.ts`**

Debe exportar:

- **`SUPPORTED_EXTENSIONS`**: array con las extensiones soportadas (inicialmente solo `[".csv"]`). Centraliza la fuente de verdad.
- **`MAX_FILE_SIZE`**: constante con el limite en bytes (50 * 1024 * 1024).
- **`validateFile(file: File): ValidationResult`**: valida extension y tamano. Retorna `{ valid: boolean; error?: string }`.
- **`uploadFiles(files: FileList): Promise<UploadResult>`**: orquesta validacion, lectura y persistencia. Retorna `{ uploaded: number; skipped: number; errors: string[] }`.

Tipos necesarios (agregar en `src/lib/types.ts`):

- `ValidationResult`: `{ valid: boolean; error?: string }`
- `UploadResult`: `{ uploaded: number; skipped: number; errors: string[] }`

### 2. Extraer logica de drag & drop a `src/scripts/uploadZone.ts`

Mover el script inline a un archivo dedicado. Este script se encarga exclusivamente de:

- Obtener referencias DOM (`drop-zone`, `file-upload`, `upload-text`)
- Registrar event listeners de drag & drop (dragenter, dragover, dragleave, drop)
- Manejar highlight/unhighlight visual
- Delegar a `uploadFiles()` de `src/lib/fileUpload.ts`
- Mostrar feedback en el UI (texto de progreso, exito, error)
- Emitir un `CustomEvent("files-uploaded")` en `document` en lugar de `window.location.reload()`

### 3. Actualizar `UploadZone.astro`

- Eliminar el bloque `<script>` inline completo
- Agregar `<script src="../../scripts/uploadZone.ts"></script>` (o inline con un import)
- Corregir el badge de formatos soportados para que refleje la realidad (solo `.csv` por ahora)
- Actualizar el atributo `accept` del input para que coincida con `SUPPORTED_EXTENSIONS`
- Eliminar el boton Browse redundante o quitar el `<label for>` (elegir uno de los dos mecanismos, no ambos)

### 4. Actualizar `filesPage.ts`

- Eliminar la logica de upload duplicada (lineas 1-40)
- Importar y usar `uploadFiles()` de `src/lib/fileUpload.ts`
- Escuchar `CustomEvent("files-uploaded")` para refrescar la lista en lugar de `window.location.reload()`

### 5. Reemplazar `window.location.reload()`

En las paginas que contienen `UploadZone` (index, files):

- El script de upload emite `document.dispatchEvent(new CustomEvent("files-uploaded", { detail: { uploaded: N } }))`
- Los scripts de pagina escuchan ese evento y actualizan la parte relevante del DOM (recargar tabla de archivos, actualizar archivos recientes)
- **Nota**: dado que Astro es MPA sin reactividad, la alternativa mas pragmatica es usar `Astro.ViewTransitions` con `navigate()` de `astro:transitions/client` para hacer una navegacion suave a la misma pagina, evitando el reload completo pero actualizando el contenido server-rendered

## Archivos a crear/modificar

| Archivo | Accion | Descripcion |
|---------|--------|-------------|
| `src/lib/types.ts` | Modificar | Agregar tipos `ValidationResult` y `UploadResult` |
| `src/lib/fileUpload.ts` | Crear | Modulo con `validateFile()`, `uploadFiles()`, constantes `SUPPORTED_EXTENSIONS` y `MAX_FILE_SIZE` |
| `src/scripts/uploadZone.ts` | Crear | Script client-side con drag & drop, highlight visual y feedback UI |
| `src/components/upload/UploadZone.astro` | Modificar | Eliminar `<script>` inline, referenciar script externo, corregir badge de formatos y atributo `accept` |
| `src/scripts/filesPage.ts` | Modificar | Eliminar logica de upload duplicada, importar `uploadFiles()` del modulo compartido |

## Dependencias nuevas

Ninguna. Todo se resuelve con el stack existente.

## Riesgos y consideraciones

1. **ViewTransitions y scripts**: al extraer el script a un archivo separado, verificar que funcione correctamente con `<ViewTransitions />` de Astro. Los scripts con `src` se re-ejecutan en navegacion por defecto, pero conviene probarlo.
2. **Soporte futuro de .xls/.json**: la arquitectura propuesta (constante `SUPPORTED_EXTENSIONS` + `validateFile()`) facilita agregar nuevos formatos sin tocar multiples archivos. Cuando se implemente, bastara con extender la constante y agregar logica de parsing en `fileUpload.ts`.
3. **Evento custom vs reload**: el cambio a `CustomEvent` requiere que cada pagina que use `UploadZone` tenga un listener que actualice su contenido. Si alguna pagina no implementa el listener, el usuario no vera los cambios. Como fallback, usar `navigate()` de ViewTransitions.

## Criterios de verificacion

- [ ] `UploadZone.astro` no contiene logica JavaScript inline (solo referencia a script externo)
- [ ] Subir un archivo CSV desde drag & drop funciona correctamente
- [ ] Subir un archivo CSV desde el boton Browse funciona correctamente
- [ ] Archivos no-CSV son rechazados con mensaje descriptivo
- [ ] Archivos mayores a 50MB son rechazados con mensaje descriptivo
- [ ] El badge de formatos muestra solo los formatos realmente soportados
- [ ] No hay logica de upload duplicada entre `uploadZone.ts` y `filesPage.ts`
- [ ] Despues de upload exitoso, la pagina se actualiza sin reload completo (o con navegacion suave via ViewTransitions)
- [ ] No hay regresiones en la pagina `/files` (seleccion, eliminacion batch)
