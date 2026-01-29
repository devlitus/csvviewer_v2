# Plan: Drag & Drop funcional en UploadZone

## Resumen del problema

La pagina de upload (`/index.astro`) tiene un componente `UploadZone.astro` puramente visual y una seccion `RecentFilesSection.astro` con datos mockeados. Se necesita implementar la funcionalidad completa: drag & drop de archivos CSV, validacion, persistencia en IndexedDB y actualizacion dinamica de la UI.

## Analisis del estado actual

### Lo que ya existe y funciona
- **`UploadZone.astro`**: Markup completo con `<label>` + `<input type="file" accept=".csv">`. Ya tiene estilos hover. No tiene `data-*` attributes ni script asociado.
- **`indexeddb.ts`**: API completa (`saveFile`, `getAllFiles`, `deleteFiles`). `saveFile` recibe un objeto `CSVFile`.
- **`csvParser.ts`**: `parseCSVString(content)` retorna `CSVParseResult` con `data`, `rowCount` y `error` opcional.
- **`types.ts`**: `CSVFile` tiene `id`, `filename`, `content`, `size`, `uploadDate` (timestamp).
- **`RecentFilesSection.astro`**: Array hardcodeado de 3 archivos. Renderiza `RecentFileCard.astro`.
- **`RecentFileCard.astro`**: Props: `filename`, `size`, `date`, `icon`, `iconColorClass`, `status`, `statusColorClass`, `statusIcon`.

### Lo que falta
- Script client-side para manejar drag & drop y click-to-browse.
- Conexion de `RecentFilesSection` con IndexedDB (actualmente datos mock).
- Estados visuales de carga, exito y error en `UploadZone`.
- No existe `src/scripts/` (directorio vacio o inexistente).

## Solucion propuesta

### Arquitectura del flujo

```
Usuario arrastra archivo
  -> dragenter/dragover: highlight visual en UploadZone
  -> drop: captura File object
  -> Validacion: extension .csv, tamano <= 10MB
  -> FileReader.readAsText()
  -> parseCSVString() para validar contenido
  -> Construir objeto CSVFile con id (crypto.randomUUID), metadata
  -> saveFile() en IndexedDB
  -> Renderizar nueva card en RecentFiles via DOM
  -> dragleave/drop: remover highlight
```

### Justificacion de decisiones
- **Sin librerias adicionales**: La File API + drag events nativos son suficientes.
- **Validacion doble**: Extension del archivo + parseo del contenido para garantizar que es CSV valido.
- **Renderizado DOM directo**: Como Astro es SSR y no hay framework reactivo, las cards nuevas se insertan via `innerHTML` en el grid existente. Esto sigue el patron ya establecido en el proyecto (scripts DOM vanilla).
- **`crypto.randomUUID()`** para IDs: Disponible en todos los navegadores modernos, sin dependencias.

---

## Archivos a crear

### 1. `src/scripts/uploadPage.ts`

Script client-side principal. Responsabilidades:

- **Inicializacion**: Al cargar la pagina, consultar `getAllFiles()` y renderizar las cards reales en el contenedor de Recent Files (reemplazando el markup estatico).
- **Drag & drop handlers** sobre el elemento `UploadZone` (identificado por `data-upload-zone`):
  - `dragenter` / `dragover`: Prevenir default, agregar clase CSS `drag-over` al contenedor.
  - `dragleave`: Remover clase `drag-over`.
  - `drop`: Prevenir default, remover clase `drag-over`, procesar archivos.
- **Click-to-browse**: El `<input type="file">` ya esta dentro del `<label>`, asi que el click funciona nativamente. Escuchar evento `change` en el input para procesar archivos.
- **Funcion `processFile(file: File)`**:
  1. Validar extension (`.csv`) y tamano (`<= 10MB`). Si falla, mostrar error no mostrar alert.
  2. Mostrar estado loading en UploadZone (cambiar contenido a spinner + texto "Processing...").
  3. Leer contenido con `FileReader.readAsText()`.
  4. Llamar `parseCSVString(content)` para validar estructura. Si hay `error`, mostrar mensaje y restaurar zona.
  5. Construir objeto `CSVFile`: `{ id: crypto.randomUUID(), filename: file.name, content, size: file.size, uploadDate: Date.now() }`.
  6. Llamar `saveFile(csvFile)`.
  7. Restaurar estado idle de UploadZone.
  8. Insertar nueva card en el grid de Recent Files usando `renderFileCard()`.
  9. Mostrar feedback de exito breve (toast o highlight de la card).
- **Funcion `renderFileCard(file: CSVFile): string`**: Genera HTML de una card compatible con el markup de `RecentFileCard.astro`. Calcula tamano legible y fecha relativa.
- **Funcion `showError(message: string)`**: Muestra mensaje de error debajo de UploadZone (elemento con `data-upload-error`), auto-oculta despues de 5 segundos.
- **Funcion `formatFileSize(bytes: number): string`**: Convierte bytes a KB/MB.
- **Funcion `formatRelativeDate(timestamp: number): string`**: Convierte timestamp a "Just now", "2 hours ago", etc.

### 2. `src/components/ui/LoadingSpinner.astro` (opcional, baja prioridad)

Componente reutilizable de spinner. Sin embargo, dado que el estado loading se manejara via DOM en el script, puede implementarse como HTML inline dentro de `uploadPage.ts` en lugar de un componente Astro separado. **Recomendacion: no crear componente separado**, insertar el spinner via JS para mantener simplicidad.

---

## Archivos a modificar

### 1. `src/components/upload/UploadZone.astro`

**Cambios conceptuales:**
- Agregar `data-upload-zone` al `<label>` raiz para que el script lo localice.
- Agregar `data-upload-content` a un `<div>` wrapper del contenido interno (icono, textos, boton) para poder reemplazarlo con spinner durante loading.
- Agregar `id="file-upload-input"` al `<input>` (actualmente tiene `id="file-upload"`, se puede mantener).
- Agregar un `<div data-upload-error>` vacio debajo del label para mensajes de error.
- Agregar clases CSS para estado `drag-over` en el bloque `<style>`:
  - `.drag-over`: borde solido azul, fondo con glow mas intenso, escala sutil.
- Agregar clases CSS para estado `loading`:
  - `.loading`: cursor wait, pointer-events none.

### 2. `src/components/files/RecentFilesSection.astro`

**Cambios conceptuales:**
- Eliminar el array `recentFiles` hardcodeado del frontmatter.
- Eliminar el renderizado estatico de cards con `.map()`.
- El grid `<div>` debe tener `data-recent-files-grid` para que el script lo localice.
- Agregar un estado vacio visible por defecto: un `<div data-empty-state>` con mensaje "No files uploaded yet" que se muestre cuando no hay archivos.
- El script `uploadPage.ts` se encargara de popular el grid al cargar la pagina y al subir nuevos archivos.

### 3. `src/pages/index.astro`

**Cambios conceptuales:**
- Agregar tag `<script>` que importe `src/scripts/uploadPage.ts`:
  ```
  <script src="../scripts/uploadPage.ts"></script>
  ```
  Esto debe ir dentro del bloque de AppLayout, al final del contenido.

---

## Dependencias nuevas

Ninguna. Todo se resuelve con APIs nativas del navegador (File API, Drag & Drop API, FileReader, crypto.randomUUID, IndexedDB).

---

## Estados visuales detallados

### UploadZone - Estado Idle (default)
- Aspecto actual: borde dashed, icono cloud, textos, boton browse.

### UploadZone - Estado Drag Over
- Borde solido `border-vibrant-blue` (no dashed).
- Fondo con glow azul mas pronunciado (`bg-vibrant-blue/5`).
- Icono cloud con escala `scale-125`.
- Texto cambia a "Drop your file here".

### UploadZone - Estado Loading
- Contenido interno reemplazado por spinner animado (CSS `animate-spin` de Tailwind) + texto "Processing file...".
- `pointer-events: none` para evitar interacciones.
- Borde solido azul pulsante (animacion `pulse`).

### UploadZone - Estado Error
- Zona vuelve a idle.
- Aparece `<div data-upload-error>` debajo con fondo rojo sutil, icono `error` y mensaje descriptivo.
- Se auto-oculta despues de 5 segundos con transicion fade-out.

### UploadZone - Estado Success
- Zona vuelve a idle.
- La nueva card aparece en el grid de Recent Files con una animacion de entrada breve (fade-in + slide-up via clase CSS con transicion).

---

## Manejo de errores

| Escenario | Mensaje al usuario | Accion |
|---|---|---|
| Archivo no es .csv | "Only .csv files are supported" | Rechazar, mostrar error |
| Archivo > 10MB | "File exceeds the 10MB limit" | Rechazar, mostrar error |
| Archivo vacio | "The file is empty" | Rechazar (viene de parseCSVString) |
| CSV sin filas de datos | "No data rows found in the CSV" | Rechazar (viene de parseCSVString) |
| Error de IndexedDB (storage lleno) | "Could not save file. Storage may be full." | Mostrar error, no insertar card |
| Archivo duplicado (mismo nombre) | Permitir subida (IndexedDB usa UUID como key, no filename). Nota: se podria agregar warning futuro. |
| FileReader error | "Could not read the file" | Mostrar error |

---

## Criterios de verificacion

1. **Drag & drop funciona**: Arrastrar un .csv sobre la zona lo sube correctamente.
2. **Click browse funciona**: Hacer click en la zona abre el file picker, seleccionar un .csv lo sube.
3. **Validacion de formato**: Arrastrar un .txt o .xlsx muestra error, no se guarda.
4. **Validacion de tamano**: Archivo > 10MB muestra error.
5. **Feedback visual**: Se observa highlight en drag-over, spinner durante carga, y la card aparece al completar.
6. **Persistencia**: Recargar la pagina muestra los archivos previamente subidos en Recent Files.
7. **Archivos multiples**: Si se arrastran varios archivos, se procesan secuencialmente (o se muestra error si alguno falla, sin afectar los demas).
8. **Error recovery**: Despues de un error, la zona vuelve a estado idle y se puede intentar de nuevo.

---

## Orden de implementacion sugerido

1. Modificar `UploadZone.astro` (agregar data attributes y estilos de estados).
2. Modificar `RecentFilesSection.astro` (eliminar datos mock, agregar data attributes y estado vacio).
3. Crear `src/scripts/uploadPage.ts` con toda la logica.
4. Agregar tag `<script>` en `index.astro`.
5. Probar flujo completo manualmente.
