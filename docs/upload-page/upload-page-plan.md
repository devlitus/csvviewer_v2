# Plan de Implementación - Diseño CSV Viewer (Upload Page)

## Objetivo
Implementar el diseño visual de la página "Upload" del CSV Viewer siguiendo una arquitectura modular con Astro 5 y Tailwind CSS v4.

---

## 1. Configuración Inicial

### 1.1 Instalar Tailwind CSS v4
```bash
pnpm add tailwindcss @tailwindcss/vite
```

### 1.2 Configurar Vite Plugin
**Archivo:** `astro.config.mjs`
```javascript
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
});
```

### 1.3 Crear archivo de estilos globales
**Archivo:** `src/styles/global.css`

Contenido:
- Import de Google Fonts (Inter, Material Symbols)
- Import de Tailwind![alt text](image.png)
- Configuración `@theme` con colores personalizados
- Variante `@custom-variant dark`
- Estilos base (scrollbar, fuente)

---

## 2. Arquitectura de Componentes

### Estructura de directorios propuesta:
```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.astro
│   │   ├── Header.astro
│   │   └── MainContent.astro
│   ├── navigation/
│   │   ├── Logo.astro
│   │   ├── NavItem.astro
│   │   └── NavMenu.astro
│   ├── ui/
│   │   ├── Button.astro
│   │   ├── SearchInput.astro
│   │   ├── Breadcrumb.astro
│   │   └── Icon.astro
│   ├── upload/
│   │   └── UploadZone.astro
│   ├── files/
│   │   ├── FileCard.astro
│   │   └── RecentFiles.astro
│   └── user/
│       └── UserProfile.astro
├── layouts/
│   └── AppLayout.astro
├── pages/
│   └── index.astro
└── styles/
    └── global.css
```

---

## 3. Definición de Componentes

### 3.1 Layout Principal (`AppLayout.astro`)
- Estructura flex con sidebar + main
- Importa estilos globales
- Define slots para contenido dinámico
- Meta tags y configuración de dark mode

### 3.2 Componentes de Layout

#### `Sidebar.astro`
- Contenedor lateral fijo (w-64)
- Integra: Logo, NavMenu, Button "New Project", UserProfile
- Border y background según diseño

#### `Header.astro`
- Barra superior del área principal
- Props: `currentPage` para breadcrumb
- Integra: Breadcrumb, SearchInput

#### `MainContent.astro`
- Wrapper del contenido principal
- Esquinas redondeadas (rounded-tl-2xl)
- Slot para contenido de página

### 3.3 Componentes de Navegación

#### `Logo.astro`
- Icono con fondo azul vibrante
- Título "DataFlow" + subtítulo "Processor v2.0"

#### `NavItem.astro`
- Props: `href`, `icon`, `label`, `isActive`
- Estados: default, hover, active
- Iconos de Material Symbols

#### `NavMenu.astro`
- Lista de NavItems
- Items: Upload, My Files, Visualizer, Settings

### 3.4 Componentes UI

#### `Button.astro`
- Props: `variant` (primary/secondary), `size`, `fullWidth`
- Estilos: sombra, hover, active:scale

#### `SearchInput.astro`
- Input con icono de búsqueda
- Estados focus con ring azul

#### `Breadcrumb.astro`
- Props: `items` (array de {label, href?})
- Icono home + separadores

#### `Icon.astro`
- Wrapper para Material Symbols
- Props: `name`, `size`, `filled`

### 3.5 Componentes de Upload

#### `UploadZone.astro`
- Zona drag & drop con borde dashed
- Icono cloud_upload centrado
- Texto descriptivo
- Badge de formatos soportados
- Botón "Browse Files"
- Efecto hover glow

### 3.6 Componentes de Archivos

#### `FileCard.astro`
- Props: `filename`, `size`, `date`, `status`, `icon`, `iconColor`
- Icono con fondo de color
- Menú de 3 puntos
- Badge de estado (Processed/Mapping Needed)
- Hover: borde azul, texto "Open File"

#### `RecentFiles.astro`
- Título "Recent Files" + link "View all"
- Grid responsivo de FileCards
- Props: `files` (array)

### 3.7 Componentes de Usuario

#### `UserProfile.astro`
- Avatar circular con ring
- Nombre + email
- Hover state

---

## 4. Configuración de Tema (global.css)

```css
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap");

@import "tailwindcss";

@theme {
  /* Colores principales */
  --color-primary: #007AFF;
  --color-primary-hover: #0062CC;
  --color-vibrant-blue: #3B82F6;

  /* Fondos */
  --color-background-dark: #121212;
  --color-surface-dark: #1A1C1E;
  --color-surface-card: #24272B;

  /* Textos */
  --color-text-off-white: #F5F5F7;
  --color-text-light-gray: #A1A1AA;

  /* Bordes */
  --color-border-dark: #2D2F36;

  /* Acentos */
  --color-accent-glow: rgba(0, 122, 255, 0.15);

  /* Status colors */
  --color-status-success: #22C55E;
  --color-status-warning: #F97316;
  --color-status-info: #A855F7;

  /* Tipografía */
  --font-display: "Inter", sans-serif;
  --font-body: "Inter", sans-serif;
}

@custom-variant dark (&:where(.dark, .dark *));
```

---

## 5. Orden de Implementación

### Fase 1: Fundamentos
1. Instalar y configurar Tailwind v4
2. Crear `global.css` con tema
3. Crear `AppLayout.astro` base

### Fase 2: Layout Structure
4. Crear `Icon.astro` (dependencia de otros componentes)
5. Crear `Sidebar.astro` (estructura)
6. Crear `Header.astro`
7. Crear `MainContent.astro`

### Fase 3: Componentes de Navegación
8. Crear `Logo.astro`
9. Crear `NavItem.astro`
10. Crear `NavMenu.astro`
11. Crear `UserProfile.astro`
12. Crear `Button.astro` (para "New Project")

### Fase 4: Componentes UI
13. Crear `SearchInput.astro`
14. Crear `Breadcrumb.astro`

### Fase 5: Componentes de Contenido
15. Crear `UploadZone.astro`
16. Crear `FileCard.astro`
17. Crear `RecentFiles.astro`

### Fase 6: Integración
18. Actualizar `index.astro` para componer la página Upload

---

## 6. Archivos a Modificar/Crear

| Archivo | Acción |
|---------|--------|
| `astro.config.mjs` | Modificar |
| `src/styles/global.css` | Crear |
| `src/layouts/AppLayout.astro` | Crear (reemplaza Layout.astro) |
| `src/components/layout/Sidebar.astro` | Crear |
| `src/components/layout/Header.astro` | Crear |
| `src/components/layout/MainContent.astro` | Crear |
| `src/components/navigation/Logo.astro` | Crear |
| `src/components/navigation/NavItem.astro` | Crear |
| `src/components/navigation/NavMenu.astro` | Crear |
| `src/components/ui/Button.astro` | Crear |
| `src/components/ui/SearchInput.astro` | Crear |
| `src/components/ui/Breadcrumb.astro` | Crear |
| `src/components/ui/Icon.astro` | Crear |
| `src/components/upload/UploadZone.astro` | Crear |
| `src/components/files/FileCard.astro` | Crear |
| `src/components/files/RecentFiles.astro` | Crear |
| `src/components/user/UserProfile.astro` | Crear |
| `src/pages/index.astro` | Modificar |
| `src/layouts/Layout.astro` | Eliminar |

---

## 7. Verificación

### Comandos para verificar:
```bash
pnpm dev          # Iniciar servidor de desarrollo
pnpm build        # Verificar build de producción
pnpm astro check  # Verificar tipos TypeScript
```

### Checklist visual:
- [ ] Dark mode aplicado correctamente
- [ ] Sidebar con navegación visible
- [ ] Logo y branding correctos
- [ ] Zona de upload con efectos hover
- [ ] Cards de archivos con estados
- [ ] Responsividad del grid
- [ ] Tipografía Inter aplicada
- [ ] Iconos Material Symbols visibles
- [ ] Colores según diseño original

---

## Notas Técnicas

- **Tailwind v4**: Usar configuración CSS-first con `@theme`, no `tailwind.config.js`
- **Iconos**: Material Symbols via Google Fonts CDN (más simple, menos configuración)
- **Sin funcionalidad**: Solo markup y estilos, sin lógica de JavaScript
- **Props tipados**: Usar interfaces TypeScript en el frontmatter de cada componente
- **Slots**: Usar named slots donde sea necesario para flexibilidad
- **Layout.astro**: Se eliminará completamente, reemplazado por AppLayout.astro
