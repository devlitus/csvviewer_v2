# Plan: UI de la pagina Upload

## Resumen

Implementar la interfaz visual de la pagina de Upload basada en el diseno de referencia (`desing/csv_processor_home_and_upload_upload/`). Solo estructura HTML y estilos con Tailwind. Sin logica funcional de upload, parsing ni persistencia.

## Analisis del estado actual

- `src/pages/index.astro`: Placeholder vacio (`<h1>Welcome to CSV Viewer</h1>`), sin layout.
- `src/layouts/Layout.astro`: Layout base minimo (solo `<slot />`), sin estilos globales del tema dark.
- No existen componentes Astro aun (directorio `src/components/` vacio).
- Existen libs de logica (`fileUpload.ts`, `indexeddb.ts`, `csvParser.ts`, `types.ts`) pero NO se usaran en este plan.
- Tailwind CSS 4 configurado via `@tailwindcss/vite`.

## Diseno de referencia

El diseno muestra un layout dark con:

1. **Sidebar izquierdo** (w-64): Logo "DataFlow", navegacion (Upload activo, My Files, Visualizer, Settings), boton "New Project", perfil de usuario.
2. **Area principal** con esquinas redondeadas top-left, fondo `#1A1C1E`:
   - **Header**: breadcrumb (Home / Upload) + barra de busqueda.
   - **Titulo**: "Upload & Process" con descripcion.
   - **Zona de drop**: borde dashed, icono cloud_upload, texto "Drag & drop your CSV here", formatos soportados, boton "Browse Files".
   - **Recent Files**: grid 3 columnas con tarjetas de archivo (icono, nombre, tamano, fecha, estado).

### Paleta de colores (variables CSS)

| Token | Valor |
|---|---|
| primary | #007AFF |
| primary-hover | #0062CC |
| vibrant-blue | #3B82F6 |
| background-dark | #121212 |
| surface-dark | #1A1C1E |
| surface-card | #24272B |
| text-off-white | #F5F5F7 |
| text-light-gray | #A1A1AA |
| border-dark | #2D2F36 |
| accent-glow | rgba(0, 122, 255, 0.15) |

### Tipografia

- Font: Inter (400, 500, 600, 700, 900)
- Iconos: Material Symbols Outlined (Google Fonts)

## Solucion propuesta

### 1. Configuracion del tema

**Archivo: `src/styles/global.css`** (crear)

Definir los custom colors de Tailwind CSS 4 usando `@theme`. Incluir:
- Todos los colores de la paleta como custom theme tokens.
- Font family: Inter.
- Estilos globales para scrollbar custom y `body` base.

**Archivo: `src/layouts/Layout.astro`** (modificar)

- Importar `../styles/global.css`.
- Agregar `class="dark"` en `<html>`.
- Agregar clases base en `<body>`: `bg-background-dark text-text-off-white antialiased overflow-hidden`.
- Cargar la fuente Inter desde Google Fonts.
- Cargar Material Symbols Outlined desde Google Fonts.
- Actualizar `<title>` a "DataFlow - CSV Processor".

### 2. Layout de aplicacion

**Archivo: `src/layouts/AppLayout.astro`** (crear)

Layout que envuelve paginas con sidebar + area principal. Usa `Layout.astro` como base.

Estructura:
```
<Layout>
  <div class="flex h-screen w-full overflow-hidden">
    <Sidebar />
    <main class="flex-1 flex flex-col h-full bg-surface-dark overflow-hidden relative rounded-tl-2xl shadow-2xl border-l border-border-dark my-2 mr-2">
      <PageHeader />
      <div class="flex-1 overflow-y-auto px-8 py-8">
        <slot />
      </div>
    </main>
  </div>
</Layout>
```

Props:
- `title: string` -- texto del breadcrumb activo (ej: "Upload")
- `showSearch?: boolean` -- mostrar barra de busqueda en header (default true)

### 3. Componentes

Crear los siguientes componentes organizados por dominio:

#### `src/components/layout/Sidebar.astro`

Sidebar fijo con:
- Logo: icono `view_kanban` en cuadrado azul + "DataFlow" / "Processor v2.0"
- Navegacion: lista de NavItems. Recibe el path actual para marcar el activo.
- Boton "New Project" en la parte inferior.
- Perfil de usuario mockeado (avatar, nombre, email) -- datos hardcodeados.

Props: `currentPath: string`

#### `src/components/navigation/NavItem.astro`

Item individual de navegacion del sidebar.

Props:
- `href: string`
- `icon: string` -- nombre del icono Material Symbols
- `label: string`
- `active?: boolean`
- `filled?: boolean` -- si el icono usa variante filled

Estilos:
- Activo: `bg-vibrant-blue/10 text-vibrant-blue font-semibold`, icono filled.
- Inactivo: `text-text-light-gray hover:bg-white/5 hover:text-text-off-white font-medium`.

#### `src/components/layout/PageHeader.astro`

Header superior del area principal con breadcrumb y busqueda.

Props:
- `title: string`
- `showSearch?: boolean`

Estructura:
- Breadcrumb: icono home + "/" + titulo.
- Input de busqueda con icono search (solo visual, sin funcionalidad).

#### `src/components/upload/UploadZone.astro`

Zona de drag & drop (solo visual).

Estructura:
- `<label>` con borde dashed, altura h-72.
- Icono `cloud_upload` en circulo azul con animacion de escala en hover.
- Texto "Drag & drop your CSV here" + "or click to browse from your computer".
- Badge con formatos soportados: ".csv, .xls, .json" + "Max 50MB".
- Boton "Browse Files" (visual, sin `<input>` funcional; incluir el input hidden para estructura).
- Clase custom `upload-glow` para el efecto de sombra en hover.

#### `src/components/files/RecentFileCard.astro`

Tarjeta individual de archivo reciente.

Props:
- `filename: string`
- `size: string`
- `date: string`
- `icon: string` -- nombre del icono Material Symbols
- `iconColorClass: string` -- ej: "bg-green-500/10 text-green-400"
- `status: string` -- texto del estado (ej: "Processed")
- `statusColorClass: string` -- ej: "text-green-400"
- `statusIcon: string` -- ej: "check_circle" o "warning"
- `actionLabel?: string` -- texto del hover action (default "Open File")

Estructura:
- Card con fondo `surface-card`, borde, rounded-xl.
- Icono + menu contextual (tres puntos, solo visual).
- Nombre de archivo (bold, hover azul).
- Tamano + fecha separados por punto.
- Footer con estado + accion hover.

#### `src/components/files/RecentFilesSection.astro`

Seccion "Recent Files" con titulo, enlace "View all" y grid de tarjetas.

Props: ninguna (datos mockeados internamente).

Estructura:
- Header con "Recent Files" + boton "View all ->" (enlace a /files).
- Grid `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`.
- 3 tarjetas mockeadas:
  1. `sales_data_q3.csv` - 2.4MB - 2 hours ago - verde/Processed - icono table_view
  2. `inventory_list.csv` - 840KB - Yesterday - verde/Processed - icono inventory_2
  3. `client_contacts.csv` - 1.2MB - Oct 24, 2023 - naranja/Mapping Needed - icono contacts

### 4. Pagina Upload

**Archivo: `src/pages/index.astro`** (modificar)

Usar `AppLayout` con `title="Upload"`. Contenido:

```
<AppLayout title="Upload">
  <div class="max-w-[1000px] mx-auto flex flex-col gap-8">
    <!-- Titulo -->
    <div class="flex flex-col gap-2">
      <h1>Upload & Process</h1>
      <p>Get started by importing your data...</p>
    </div>

    <!-- Zona upload -->
    <UploadZone />

    <!-- Archivos recientes -->
    <RecentFilesSection />
  </div>
</AppLayout>
```

### 5. Navegacion del sidebar

Los items del sidebar deben apuntar a:
- Upload: `/` (activo en esta pagina)
- My Files: `/files`
- Visualizer: `/visualizer`
- Settings: `/settings`

## Archivos a crear/modificar

| Accion | Archivo | Descripcion |
|---|---|---|
| Crear | `src/styles/global.css` | Variables de tema, colores custom, scrollbar, fuentes |
| Modificar | `src/layouts/Layout.astro` | Importar global.css, cargar fuentes, clases base en body |
| Crear | `src/layouts/AppLayout.astro` | Layout con Sidebar + header + slot |
| Crear | `src/components/layout/Sidebar.astro` | Sidebar completo con logo, nav, boton, perfil |
| Crear | `src/components/layout/PageHeader.astro` | Header con breadcrumb y busqueda |
| Crear | `src/components/navigation/NavItem.astro` | Item de navegacion individual |
| Crear | `src/components/upload/UploadZone.astro` | Zona de drag & drop visual |
| Crear | `src/components/files/RecentFileCard.astro` | Tarjeta de archivo reciente |
| Crear | `src/components/files/RecentFilesSection.astro` | Seccion con grid de tarjetas mockeadas |
| Modificar | `src/pages/index.astro` | Usar AppLayout + componer componentes |

## Dependencias nuevas

Ninguna. Todo se resuelve con Tailwind CSS 4 y fuentes de Google Fonts via CDN.

**Nota sobre Tailwind CSS 4:** Los custom colors se definen con `@theme` en CSS, no en `tailwind.config.js`. Ejemplo:

```css
@import "tailwindcss";

@theme {
  --color-primary: #007AFF;
  --color-vibrant-blue: #3B82F6;
  --color-background-dark: #121212;
  /* etc */
}
```

## Riesgos y consideraciones

1. **Material Symbols via CDN**: Carga externa. Si se prefiere offline, considerar usar SVGs inline. Por ahora CDN es aceptable para fase UI.
2. **Inter via Google Fonts CDN**: Mismo caso. Aceptable para desarrollo.
3. **Datos mockeados**: Las tarjetas de "Recent Files" tienen datos hardcodeados. Cuando se implemente la logica, se reemplazaran por datos dinamicos de IndexedDB.
4. **Tailwind CSS 4 syntax**: Usar `@theme` para colores custom, no la config JS legacy. Verificar que `@tailwindcss/vite` soporta esta sintaxis (si, lo hace en v4).
5. **El boton "New Project"** del sidebar no tiene destino definido en el diseno. Dejarlo como boton sin accion.

## Criterios de verificacion

1. La pagina `index.astro` renderiza el layout completo (sidebar + contenido) sin errores.
2. El resultado visual coincide con `desing/csv_processor_home_and_upload_upload/screen.png`.
3. Los colores, tipografia y espaciado son consistentes con la paleta definida.
4. El sidebar marca "Upload" como item activo.
5. La zona de drop tiene efecto hover (borde azul, glow, escala del icono).
6. Las tarjetas de archivos recientes tienen hover con borde azul y texto "Open File" aparece.
7. El layout es responsive: grid de archivos colapsa a 1-2 columnas en pantallas menores.
8. No hay errores de TypeScript (`pnpm astro check`).
9. No se ejecuta ninguna logica de upload, IndexedDB ni parsing.
