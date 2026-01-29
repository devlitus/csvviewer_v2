# Plan: Migrar almacenamiento de Filesystem a IndexedDB

## Problema
En Vercel el filesystem es de solo lectura. Los archivos CSV se pierden entre requests. La solución es mover todo el almacenamiento al navegador con IndexedDB.

## Resumen del cambio
Eliminar los 3 endpoints API (`upload.ts`, `delete.ts`, `export.ts`) y el parser servidor (`utils/csvParser.ts`). Toda la lógica de archivos pasa al cliente usando IndexedDB.

---

## Fases de implementación

### Fase 1: Crear infraestructura cliente

**Crear `src/lib/indexeddb.ts`** - Servicio CRUD para IndexedDB:
- `initDB()` - Abrir/crear DB "CSVViewerDB" con store "files"
- `saveFile(file)` - Guardar archivo CSV (contenido como string)
- `getFile(id)` - Obtener archivo por ID
- `getFileByName(filename)` - Obtener por nombre
- `getAllFiles()` - Listar todos (ordenados por fecha)
- `deleteFiles(ids)` - Eliminar múltiples archivos

**Crear `src/lib/csvParser.ts`** - Parser CSV para el navegador:
- `parseCSVString(content: string)` - Parsea string CSV, retorna `{ data, rowCount, error? }`
- Usar `csv-parse/sync` (compatible con browser) o `papaparse`

**Crear `src/lib/types.ts`** - Interfaces compartidas:
```typescript
interface CSVFile {
  id: string;
  filename: string;
  content: string;
  size: number;
  uploadDate: number;
}
```

### Fase 2: Migrar Upload y Delete al cliente

**Modificar `src/scripts/filesPage.ts`**:
- Upload: leer archivo con `FileReader.readAsText()` → guardar en IndexedDB
- Delete: llamar `deleteFiles()` directamente
- En lugar de `window.location.reload()`, disparar `CustomEvent('files-updated')` para actualizar UI

### Fase 3: Migrar listado de archivos (SSR → CSR)

**Modificar `src/components/files/FileTable.astro`**:
- Eliminar `fs.readdirSync` del frontmatter
- Renderizar tabla vacía con estructura HTML
- Agregar `<script>` que carga archivos desde IndexedDB y renderiza filas dinámicamente
- Escuchar evento `files-updated` para re-renderizar

**Modificar `src/components/files/RecentFiles.astro`**:
- Mismo enfoque: de SSR a carga dinámica desde IndexedDB

### Fase 4: Migrar Visualizer (el cambio más crítico)

**Modificar `src/pages/visualizer.astro`**:
- Eliminar toda la lógica de lectura CSV del frontmatter
- Mantener layout/estructura HTML base con estados: loading, error, datos
- Agregar `<script>` que:
  1. Lee `?file=ID` de la URL
  2. Obtiene archivo de IndexedDB
  3. Parsea CSV con el parser cliente
  4. Renderiza tabla, toolbar y paginación dinámicamente

**Modificar `src/components/files/FileTableRow.astro`**:
- Cambiar enlaces de `?file=nombre.csv` a `?file=ID`

### Fase 5: Migrar Export al cliente

**Modificar `src/components/visualizer/DataToolbar.astro`**:
- Import `xlsx` en el script del cliente
- Leer archivo de IndexedDB → parsear → generar CSV/XLSX → descargar con `Blob` + `URL.createObjectURL`

### Fase 6: Limpieza

**Eliminar archivos:**
- `src/pages/api/upload.ts`
- `src/pages/api/delete.ts`
- `src/pages/api/export.ts`
- `src/utils/csvParser.ts`

---

## Archivos afectados

| Archivo | Acción |
|---------|--------|
| `src/lib/indexeddb.ts` | CREAR |
| `src/lib/csvParser.ts` | CREAR |
| `src/lib/types.ts` | CREAR |
| `src/scripts/filesPage.ts` | MODIFICAR |
| `src/components/files/FileTable.astro` | MODIFICAR |
| `src/components/files/RecentFiles.astro` | MODIFICAR |
| `src/components/files/FileTableRow.astro` | MODIFICAR |
| `src/pages/visualizer.astro` | MODIFICAR |
| `src/components/visualizer/DataToolbar.astro` | MODIFICAR |
| `src/pages/api/upload.ts` | ELIMINAR |
| `src/pages/api/delete.ts` | ELIMINAR |
| `src/pages/api/export.ts` | ELIMINAR |
| `src/utils/csvParser.ts` | ELIMINAR |

---

## Verificación

1. `pnpm dev` - Confirmar que compila sin errores
2. Subir un CSV → verificar que aparece en la lista
3. Recargar página → verificar que el archivo persiste
4. Click en archivo → visualizer carga correctamente con paginación
5. Exportar a CSV y XLSX → descargan correctamente
6. Eliminar archivos → desaparecen de la lista
7. `pnpm build` - Confirmar build de producción exitoso
