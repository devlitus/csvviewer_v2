# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Astro 5 project with TypeScript, intended to be a CSV viewer application. Currently contains the default Astro Basics starter template.
Always respond in Spanish.

## Commands

```bash
pnpm dev        # Start dev server at localhost:4321
pnpm build      # Build production site to ./dist/
pnpm preview    # Preview production build locally
pnpm astro      # Run Astro CLI commands (e.g., astro add, astro check)
```

## Architecture

**Framework:** Astro 5 with TypeScript (strict mode)

**Directory Structure:**
- `src/pages/` - File-based routing (index.astro → /)
- `src/components/` - Reusable Astro components
- `src/layouts/` - Page layout templates
- `src/assets/` - Processed assets (images, SVGs)
- `public/` - Static assets served as-is

## Astro Conventions

- `.astro` files use frontmatter (between `---` delimiters) for component logic/imports
- Asset imports: `import asset from '../assets/file.svg'` then use `asset.src`
- `<style>` blocks are automatically scoped to the component
- Layouts wrap page content: `<Layout><Content /></Layout>`

## Design project

All designs are in the `/design` folder

## Agentes personalizados

Definidos en `.claude/agents/`. Usar segun el tipo de tarea:

- **planner** — Planificacion de features, refactoring y arquitectura. Solo escribe en `docs/`. Nunca escribe codigo. Analiza el stack, busca en internet y produce planes detallados.
- **implementer** — Implementacion de codigo siguiendo planes de `docs/`. Reutiliza codigo existente, aplica patrones cuando es necesario y se documenta en las APIs oficiales si le falta contexto. Se detiene y pregunta ante ambiguedades.

### Flujo recomendado

1. Usar `planner` para disenar la solucion → genera `docs/plan-<nombre>.md`
2. Usar `implementer` para ejecutar el plan paso a paso
