---
name: commits
description: Realiza commits interactivos siguiendo Conventional Commits. Usa cuando necesites crear commits estructurados con tipo, scope, descripción y cuerpo detallado para el proyecto csvviewer_v2.
user-invocable: true
context: fork
agent: implementer
allowed-tools: Bash, Read, Grep
---

# Skill de Commits Interactivos

Guía interactiva para crear commits profesionales siguiendo Conventional Commits y los estándares del proyecto csvviewer_v2.

## Cómo usar

Ejecuta `/commits` en Claude Code para iniciar el flujo interactivo de creación de commits.

## Flujo de trabajo paso a paso

### Paso 1: Validación de cambios

El skill verifica que hay cambios sin commitear ejecutando:
- `git status` para ver archivos modificados y sin staged
- `git diff --staged` para ver cambios ya staged

### Paso 2: Seleccionar tipo de cambio

Elige el tipo Conventional Commits que mejor describe tus cambios:

| Tipo | Descripción | Cuándo usarlo |
|------|-------------|---------------|
| `feat` | Nueva característica | Agregar nueva funcionalidad |
| `fix` | Corrección de bug | Reparar comportamiento incorrecto |
| `refactor` | Refactoring | Reorganizar código sin cambiar funcionalidad |
| `docs` | Documentación | Cambios en archivos de documentación |
| `test` | Tests | Agregar o actualizar tests |
| `style` | Estilo | Cambios de formato, linting (no afecta funcionalidad) |
| `chore` | Tareas | Actualizar dependencias, configuración |
| `ci` | CI/CD | Cambios en workflow, acciones automatizadas |
| `perf` | Rendimiento | Optimizaciones de velocidad o memoria |

### Paso 3: Seleccionar scope (opcional)

El scope indica qué parte del proyecto se ve afectada:

**Scopes del proyecto csvviewer_v2:**
- `upload` — Componentes y lógica de subida de archivos (UploadZone)
- `files` — Gestión de archivos (FileTable, Pagination, eliminación)
- `visualizer` — Visualización de datos CSV (CSVTable, DataToolbar)
- `ui` — Componentes genéricos reutilizables (Button, Modal, Icon)
- `layout` — Estructura general (Header, Sidebar, MainContent)
- `lib` — Utilidades y lógica de negocio
- `parser` — Parser CSV (parseCSVString, manejo de quotes/multiline)
- `db` — Persistencia en IndexedDB (saveFile, getFile, deleteFiles)
- `nav` — Navegación (Logo, NavMenu, NavItem)
- `styles` — Estilos globales y Tailwind
- `build` — Build, configuración de Astro
- `types` — Tipos TypeScript compartidos
- Otro — Ingresa un scope personalizado

### Paso 4: Escribir descripción

Una frase corta y clara en tiempo presente (<50 caracteres):

Ejemplos correctos:
- "agregar filtro de búsqueda"
- "corregir error en validación"
- "extraer lógica en componente reutilizable"

Ejemplos incorrectos:
- "agregado filtro de búsqueda" (pasado)
- "Fixed the bug where..." (inglés, demasiado largo)

### Paso 5: Cuerpo detallado (opcional)

Proporciona contexto adicional separado por línea en blanco:
- Qué problema resuelve
- Por qué se hizo de esta forma
- Notas técnicas o consideraciones importantes

### Paso 6: Revisar resumen

Se mostrará el commit completo antes de ejecutarse:
```
[tipo](scope): descripción

Cuerpo detallado si aplica

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

Aquí puedes confirmar o cancelar.

### Paso 7: Ejecutar commit

El agente `implementer` ejecuta:
1. `git add .` para stage de cambios pendientes (si aplica)
2. `git commit -m "..."` con el mensaje formateado
3. `git status` para verificar éxito

## Ejemplos prácticos

### Ejemplo 1: Nueva característica
```
Tipo: feat
Scope: visualizer
Descripción: agregar exportación a Excel
Cuerpo: Permite usuarios exportar datos CSV a formato XLSX
        usando la librería xlsx. Se agrega botón en la toolbar.
```

Resultado final:
```
feat(visualizer): agregar exportación a Excel

Permite usuarios exportar datos CSV a formato XLSX usando la librería xlsx.
Se agrega botón en la toolbar.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

### Ejemplo 2: Corrección de bug
```
Tipo: fix
Scope: parser
Descripción: resolver error con comillas en valores CSV
Cuerpo: El parser no manejaba correctamente comillas escapadas
        dentro de campos entrecomillados. Se actualiza la lógica
        de parseCSVString para casos edge.
```

### Ejemplo 3: Refactoring
```
Tipo: refactor
Scope: lib
Descripción: extraer validación en función reutilizable
Cuerpo: Se crea validateCSVFile() para evitar duplicación
        entre upload y visualizer.
```

### Ejemplo 4: Actualización de dependencias
```
Tipo: chore
Scope: build
Descripción: actualizar Astro a v5.0.4
Cuerpo: -
```

## Requisitos previos

- Git instalado y configurado en tu máquina
- Cambios sin commitear en el repositorio
- Acceso al agente `implementer` en Claude Code
- Permisos de escritura en el repositorio

## Notas importantes

- Cada commit incluye automáticamente: `Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>`
- Se sigue el estándar **Conventional Commits** para mantener el historial legible
- El **scope es opcional pero recomendado** para mejor trazabilidad
- Los mensajes deben ser **concisos pero descriptivos**
- Se prefiere commits atómicos (una idea por commit)

## Guía rápida

1. Realiza tus cambios en el código
2. Prepara los cambios: `git add <archivos>`
3. Ejecuta `/commits` en Claude Code
4. Responde las preguntas interactivas
5. Revisa el resumen del commit
6. Confirma para ejecutar

## Referencia de Conventional Commits

Para más información sobre el estándar: [https://www.conventionalcommits.org](https://www.conventionalcommits.org)

Estructura general:
```
type(scope): description

body

footer
```

El proyecto csvviewer_v2 sigue este estándar para mantener un historial de commits claro y automatizable.
