# GitHub Copilot Instructions - CSV Viewer v2

## Project Overview
Client-side CSV viewer built with **Astro 5 + TypeScript (strict) + Tailwind CSS 4**. SSR-enabled with Vercel adapter but all data operations happen in-browser via IndexedDB—no backend API.

**Always respond in Spanish** when communicating with the user.

## Architecture & Data Flow

### Client-Side Storage Pattern
**Critical**: All CSV files persist in IndexedDB (`CSVViewerDB` store), not on a server. The data flow is:
1. User uploads CSV → `saveFile()` writes to IndexedDB with `crypto.randomUUID()` ID
2. Pages load files via `getAllFiles()` or `getFile(id)` 
3. Deletion uses `deleteFiles(ids)` with batch support
4. CSV parsing happens client-side with custom `parseCSVString()` parser (handles quotes, multiline, escape sequences)

### Key Libraries
- `src/lib/indexeddb.ts`: Promise-based IndexedDB API (`saveFile`, `getFile`, `getAllFiles`, `deleteFiles`)
- `src/lib/csvParser.ts`: Custom CSV parser with proper quote/escape handling (NO external libraries like `csv-parse` used here)
- `src/lib/fileUpload.ts`: Validation logic (50MB max, `.csv` only)
- `src/lib/types.ts`: Core types (`CSVFile`, `CSVParseResult`, `ValidationResult`, `UploadResult`)

### Component Organization
```
components/
├── ui/          # Generic components (Button, SearchInput, ConfirmationModal)
├── layout/      # Structure (Header, Sidebar, MainContent)
├── navigation/  # Nav components (Logo, NavMenu, NavItem)
├── upload/      # UploadZone with drag & drop
├── files/       # File management (FileTable, Pagination, RecentFiles)
└── visualizer/  # CSV display (CSVTable, DataToolbar, CategoryBadge)
```

### Page Routes
- `/` (index.astro): Upload zone + recent files
- `/files`: File management with pagination/batch delete
- `/visualizer?file=<id>`: CSV display with column filters/export
- `/settings`: Configuration (future)

## Code Conventions

### File Naming
- **Components**: `PascalCase.astro` (e.g., `FileTable.astro`, `RecentFileCard.astro`)
- **Utils/Scripts**: `camelCase.ts` (e.g., `csvParser.ts`, `indexeddb.ts`)
- **Page Scripts**: `camelCase.ts` in `src/scripts/` (e.g., `uploadPage.ts`)

### Component Structure
```astro
---
// 1. Type imports first
import type { CSVFile } from "../lib/types";

// 2. External dependencies
import { ViewTransitions } from "astro:transitions";

// 3. Local components/utils (hierarchical: layouts → components → utils)
import AppLayout from "../layouts/AppLayout.astro";
import FileTable from "../components/files/FileTable.astro";
import { getAllFiles } from "../lib/indexeddb";

// 4. Props interface at the top
interface Props {
  variant?: 'primary' | 'secondary';
  className?: string;
}

// 5. Destructure with defaults
const { variant = 'primary', className = '' } = Astro.props as Props;
---

<!-- HTML structure -->
<div class={`base-styles ${className}`}>
  <!-- Use class: className pattern for passing CSS classes -->
</div>
```

### TypeScript Patterns
- **Function declarations** for top-level functions: `function parseCSVString(content: string): CSVParseResult`
- **Arrow functions** for callbacks/event handlers: `button.addEventListener('click', () => { ... })`
- **Explicit return types** on all public functions
- **`Record<string, string>`** for dynamic object keys (CSV rows use this pattern)

### Styling Approach
- **Tailwind-first**: Use utility classes, not custom CSS unless absolutely necessary
- **Design tokens** in `src/styles/global.css` via `@theme` directive:
  ```css
  --color-primary: #007AFF
  --color-vibrant-blue: #3B82F6
  --color-surface-dark: #1A1C1E
  --color-text-off-white: #F5F5F7
  ```
- **Hover states**: Use `hover:` prefix consistently (e.g., `hover:bg-primary-hover`, `hover:text-vibrant-blue`)
- **Transitions**: Add `transition-all` or `transition-colors` for smooth interactions

### Client-Side Scripts
Scripts in `src/scripts/` handle page-specific interactivity:
- Use data attributes for DOM selection: `[data-upload-zone]`, `[data-recent-files-grid]`
- Store idle state HTML for resets: `const IDLE_STATE_HTML = element.innerHTML`
- Event delegation for dynamic elements (e.g., file cards loaded from IndexedDB)
- Example from `uploadPage.ts`:
  ```typescript
  const uploadZone = document.querySelector(UPLOAD_ZONE_SELECTOR);
  uploadZone?.addEventListener('dragover', (e) => { e.preventDefault(); });
  ```

## Development Workflow

### Commands
```bash
pnpm install  # Install dependencies
pnpm dev      # Start dev server at localhost:4321
pnpm build    # Build for production
pnpm preview  # Preview production build
```

### Commits
- Use `pnpm commit` which runs a Conventional Commits interactive script
- Format: `<type>(<scope>): <description>` (e.g., `feat(upload): add drag-drop support`)
- The script is defined in package.json but implementation is in `.claude/skills/commits/`

### Design Reference
- UI mockups in `/desing/*` folders (note the typo: "desing" not "design")
- Planning docs in `/docs/` (e.g., `plan-upload-ui.md`, `plan-drag-drop-feature.md`)
- Check these before implementing new features

## Integration Points

### Astro View Transitions
- Enabled via `<ViewTransitions />` in `Layout.astro`
- Pages feel like SPA navigation without full reloads
- Be aware of script re-execution on page transitions

### Material Symbols Icons
- Loaded from Google Fonts CDN in `Layout.astro`
- Usage: `<span class="material-symbols-outlined">cloud_upload</span>`
- Common icons: `table_view`, `upload`, `delete`, `settings`

## Common Patterns

### Loading Files in Pages
```typescript
// In .astro frontmatter
import { getAllFiles } from "../lib/indexeddb";
// This won't work server-side! Use client script instead:
```
```astro
<!-- Correct approach -->
<div data-recent-files-grid></div>
<script>
  import { getAllFiles } from "../lib/indexeddb";
  const grid = document.querySelector('[data-recent-files-grid]');
  const files = await getAllFiles();
  // Render dynamically
</script>
```

### CSV Validation
Always validate before parsing:
```typescript
import { validateFile } from "../lib/fileUpload";
const validation = validateFile(file);
if (!validation.valid) {
  showError(validation.error);
  return;
}
```

### Error Handling UI
- Show errors in dedicated error zones (e.g., `[data-upload-error]`)
- Auto-hide errors after 5 seconds using `setTimeout`
- Use red color scheme: `bg-red-500/10 border-red-500/30 text-red-400`

## What NOT to Do
- ❌ Don't create API routes—this is a client-only app
- ❌ Don't use `csv-parse` library for parsing—use custom `parseCSVString()`
- ❌ Don't access IndexedDB in Astro frontmatter (runs server-side)
- ❌ Don't inline massive CSS—use Tailwind utilities
- ❌ Don't forget `type` imports: `import type { CSVFile }`

## Quick Reference
- **Main IndexedDB operations**: `saveFile()`, `getFile(id)`, `getAllFiles()`, `deleteFiles(ids[])`
- **CSV parsing**: `parseCSVString(content)` returns `{ data, rowCount, error? }`
- **File validation**: `validateFile(file)` returns `{ valid, error? }`
- **Type definitions**: All in `src/lib/types.ts`
- **Design system**: Colors defined in `src/styles/global.css` `@theme` block
