# Plan UI - Página Settings

## Resumen

Implementar la interfaz de usuario para la página **Settings** (`/settings`), que permite gestionar preferencias de usuario, configuración de seguridad y gestión de datos. Esta página es **solo UI estática** sin funcionalidad interactiva completa (la lógica se implementará en fases posteriores).

---

## Análisis del Estado Actual

### Diseño de Referencia

- **Archivo:** `desing/csv_processor_home_and_upload_settings/code.html`
- **Screenshot:** `desing/csv_processor_home_and_upload_settings/screen.png`

### Stack Existente

- **Framework:** Astro 5 + TypeScript (strict)
- **Estilos:** Tailwind CSS 4 con tokens en `global.css`
- **Layout:** `AppLayout.astro` (sidebar + header + contenido)
- **Componentes UI:** `ConfirmationModal.astro` (reutilizable)

### Patrones de Otras Páginas

| Página | Patrón |
|--------|--------|
| `files.astro` | `AppLayout` + header con título/descripción + contenido principal |
| `visualizer.astro` | `AppLayout` con `showHeader=false` y header personalizado |

### Páginas Existentes

```
src/pages/
├── index.astro      # Upload
├── files.astro      # My Files
└── visualizer.astro # Visualizador CSV
```

> **Nota:** La página `settings.astro` **no existe**, debe crearse desde cero.

---

## Requisitos

### Requisitos Funcionales (UI)

1. **Página Settings** en ruta `/settings`
2. **Secciones de configuración:**
   - Profile Settings (avatar, nombre, email)
   - Preferences (tema, idioma)
   - Security (contraseña, 2FA)
   - Data Management (formato exportación, auto-save, eliminar datos)
3. **Diseño responsive** (mobile-first con breakpoints md/lg)
4. **Integración con sidebar** (item "Settings" activo)

### Requisitos No Funcionales

- Usar tokens de color existentes en `global.css`
- Reutilizar `AppLayout.astro` y componentes existentes
- Sin lógica interactiva real (solo estructura HTML/CSS)
- Accesibilidad básica (labels, aria-labels)

---

## Pasos de Implementación

### Fase 1: Crear Página Base

**1.1. Crear `src/pages/settings.astro`**

- Usar `AppLayout` con título "Settings"
- Header con breadcrumb y search input (estilo consistente)
- Contenedor principal con `max-w-4xl mx-auto`

**1.2. Estructura del Layout**

```
┌─────────────────────────────────────────┐
│ Sidebar │ Header (breadcrumb + search)  │
│         ├───────────────────────────────│
│         │ Settings Title + Description  │
│         │ ┌───────────────────────────┐ │
│         │ │ Profile Settings Card     │ │
│         │ └───────────────────────────┘ │
│         │ ┌───────────────────────────┐ │
│         │ │ Preferences Card          │ │
│         │ └───────────────────────────┘ │
│         │ ┌───────────────────────────┐ │
│         │ │ Security Card             │ │
│         │ └───────────────────────────┘ │
│         │ ┌───────────────────────────┐ │
│         │ │ Data Management Card      │ │
│         │ └───────────────────────────┘ │
└─────────┴───────────────────────────────┘
```

---

### Fase 2: Crear Componentes de Settings

**2.1. Componente `SettingsSection.astro`** (reutilizable)

```astro
Props:
- title: string
- icon: string (Material Symbol)
- slot: contenido interno
```

Estructura:

```html
<section class="bg-surface-card border border-border-dark rounded-xl p-6 shadow-sm">
  <h2 class="text-xl font-bold flex items-center gap-2 mb-6">
    <span class="material-symbols-outlined text-vibrant-blue">{icon}</span>
    {title}
  </h2>
  <slot />
</section>
```

**2.2. Componente `ToggleSwitch.astro`**

```astro
Props:
- id: string
- checked?: boolean
- disabled?: boolean
```

Estilo (del diseño):

```css
/* Toggle checkbox peer pattern */
w-11 h-6 bg-border-dark rounded-full
peer-checked:bg-vibrant-blue
after:content-[''] after:absolute after:h-5 after:w-5 after:rounded-full
```

**2.3. Componente `SettingsInput.astro`**

```astro
Props:
- label: string
- type: 'text' | 'email' | 'password'
- value?: string
- placeholder?: string
- icon?: string (opcional, para select con icono)
```

**2.4. Componente `SettingsSelect.astro`**

```astro
Props:
- label: string
- options: Array<{value: string, text: string}>
- icon?: string
- selected?: string
```

**2.5. Componente `ThemeSelector.astro`**

```text
Props: ninguno (opciones hardcoded)
```

Muestra 3 botones: Dark Mode (activo), Light Mode, System

---

### Fase 3: Implementar Secciones

**3.1. Sección Profile Settings**

- Avatar circular con overlay hover (icono camera)
- Grid 2 columnas: Full Name + Email Address
- Botón "Save Changes" alineado a la derecha

**3.2. Sección Preferences**

- Theme selector (3 botones con badge "ACTIVE")
- Language dropdown con icono `language`

**3.3. Sección Security**

- Password con texto "Last changed X months ago" + botón "Change Password"
- Two-Factor Authentication con toggle switch
- Separador `border-b` entre items

**3.4. Sección Data Management**

- Default Export Format (dropdown: CSV, JSON, Excel)
- Auto-save Projects (toggle, checked por defecto)
- Danger zone: "Delete All Data" con estilo rojo

---

### Fase 4: Actualizar Navegación

**4.1. Verificar `Sidebar.astro`**

- El item "Settings" ya debería existir
- Confirmar que usa `currentPath` para estado activo
- Icono: `settings` (filled cuando activo)

---

## Archivos a Modificar

### Archivos Nuevos

| Archivo | Propósito |
|---------|-----------|
| `src/pages/settings.astro` | Página principal de Settings |
| `src/components/settings/SettingsSection.astro` | Card wrapper para cada sección |
| `src/components/settings/ToggleSwitch.astro` | Componente toggle reutilizable |
| `src/components/settings/SettingsInput.astro` | Input con label |
| `src/components/settings/SettingsSelect.astro` | Select dropdown con icono |
| `src/components/settings/ThemeSelector.astro` | Selector de tema (3 botones) |
| `src/components/settings/ProfileAvatar.astro` | Avatar con hover overlay |
| `src/components/settings/DangerZone.astro` | Sección de acciones destructivas |

### Archivos Existentes a Verificar

| Archivo | Verificación |
|---------|--------------|
| `src/components/layout/Sidebar.astro` | Item "Settings" con href="/settings" |
| `src/styles/global.css` | Tokens de color suficientes (ya están) |

---

## Estructura Final de Componentes

```text
src/components/
├── settings/                    # NUEVA carpeta
│   ├── SettingsSection.astro
│   ├── ToggleSwitch.astro
│   ├── SettingsInput.astro
│   ├── SettingsSelect.astro
│   ├── ThemeSelector.astro
│   ├── ProfileAvatar.astro
│   └── DangerZone.astro
├── ui/
│   └── ConfirmationModal.astro  # Existente (reutilizar para "Delete All Data")
...
```

---

## Dependencias

**Ninguna nueva.** Se usa el stack existente:

- Tailwind CSS 4 (ya configurado)
- Material Symbols (ya cargado en Layout.astro)
- Componentes existentes de `ui/`

---

## Tokens de Diseño Utilizados

Del diseño HTML y `global.css`:

```css
/* Colores principales */
--color-vibrant-blue: #3B82F6      /* Botones activos, iconos */
--color-surface-card: #24272B      /* Fondo de cards */
--color-background-dark: #121212   /* Fondo inputs */
--color-border-dark: #2D2F36       /* Bordes */
--color-text-off-white: #F5F5F7    /* Texto principal */
--color-text-light-gray: #A1A1AA   /* Labels, texto secundario */

/* Danger zone */
red-500/20, red-500/10, red-500/5  /* Tailwind red con opacity */
```

---

## Riesgos y Consideraciones

### Riesgos

| Riesgo | Probabilidad | Mitigación |
| --------- | ------------ | ---------- |
| Toggle switch CSS complejo | Media | Copiar estilos exactos del diseño HTML |
| Responsive en sección Profile | Media | Usar `flex-col md:flex-row` como en diseño |
| Sidebar no tiene link a Settings | Baja | Verificar antes de implementar |

### Consideraciones

1. **Solo UI:** Esta fase NO incluye:
   - Guardar preferencias en localStorage/IndexedDB
   - Lógica de cambio de tema real
   - Funcionalidad de cambio de contraseña
   - Eliminar datos de IndexedDB

2. **Accesibilidad:**
   - Todos los inputs deben tener `<label>` asociado
   - Toggles deben usar patrón `sr-only` + `peer`
   - Botón "Delete all data" debe tener `aria-label`

3. **Estado visual:**
   - Theme "Dark Mode" aparece como activo (badge "ACTIVE")
   - Toggle "Auto-save" aparece checked por defecto
   - Los valores de inputs son placeholders/estáticos

---

## Testing

### Verificación Manual

1. **Navegación:**
   - [ ] Click en "Settings" en sidebar navega a `/settings`
   - [ ] Breadcrumb muestra "Home / Settings"
   - [ ] Item "Settings" en sidebar está activo (highlighted)

2. **Secciones visibles:**
   - [ ] Profile Settings con avatar + 2 inputs + botón
   - [ ] Preferences con theme selector + language dropdown
   - [ ] Security con password row + 2FA toggle
   - [ ] Data Management con export format + auto-save + danger zone

3. **Responsive:**
   - [ ] En mobile: secciones stack vertical
   - [ ] En desktop: Profile tiene layout flex row
   - [ ] Theme buttons: 1 col en sm, 3 cols en sm+

4. **Estilos:**
   - [ ] Cards tienen `bg-surface-card border-border-dark rounded-xl`
   - [ ] Inputs tienen `bg-background-dark border-border-dark`
   - [ ] Danger zone tiene borde y fondo rojo con opacity
   - [ ] Toggle switch cambia visual al hover (opcional)

5. **Componentes:**
   - [ ] `ToggleSwitch` muestra estado checked/unchecked correctamente
   - [ ] `ThemeSelector` muestra "Dark Mode" con badge "ACTIVE"
   - [ ] `ProfileAvatar` muestra overlay con camera icon en hover

---

## Notas de Implementación

### CSS del Toggle Switch (copiar del diseño)

```html
<label class="relative inline-flex items-center cursor-pointer">
  <input class="sr-only peer" type="checkbox" />
  <div class="w-11 h-6 bg-border-dark rounded-full 
              peer peer-checked:bg-vibrant-blue
              after:content-[''] after:absolute after:top-[2px] after:start-[2px] 
              after:bg-text-light-gray after:rounded-full after:h-5 after:w-5 
              after:transition-all
              peer-checked:after:translate-x-full peer-checked:after:bg-white">
  </div>
</label>
```

### CSS del Theme Button Activo

```html
<button class="relative border-2 border-vibrant-blue bg-vibrant-blue/10 
               rounded-lg p-3 flex items-center justify-center gap-2 
               text-text-off-white shadow-inner">
  <!-- Badge ACTIVE -->
  <span class="absolute -top-2 -right-2 bg-vibrant-blue text-white 
               text-[10px] px-1.5 py-0.5 rounded-full font-bold">
    ACTIVE
  </span>
</button>
```

---

**Última actualización:** 31/01/2026  
**Autor:** GitHub Copilot  
**Estado:** Pendiente de implementación
