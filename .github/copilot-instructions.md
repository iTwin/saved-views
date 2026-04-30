# GitHub Copilot Instructions — iTwin Saved Views

## Project Overview

This repository publishes two iTwin Platform npm packages — [`@itwin/saved-views-client`](https://www.npmjs.com/package/@itwin/saved-views-client) and [`@itwin/saved-views-react`](https://www.npmjs.com/package/@itwin/saved-views-react) — along with private test applications used for local development. See the [README](../README.md) for a full project overview.

## Development Setup

```shell
# Install all workspace dependencies (pnpm required; npm is blocked)
npx pnpm install

# Start the test app (frontend on http://localhost:7948 + backend, with hot reload)
pnpm start
```

To enable iTwin Platform features in the test app, configure [`packages/test-app-frontend/.env`](../packages/test-app-frontend/.env).

> **Running commands on Windows**: The default PowerShell execution policy blocks npm scripts. Use either `cmd /c "cd /d <repo-root> && <command>"` or `powershell -ExecutionPolicy Bypass -Command "<command>"`. The `cmd /c` form is preferred — it requires no policy flag and stdout/stderr are both captured cleanly when you append `2>&1`.

## Available Commands

All commands run from the **repository root** unless otherwise noted.

| Command | Description |
|---|---|
| `pnpm start` | Start both test apps concurrently with hot reload |
| `pnpm run build` | Build all published packages and test app frontend (parallel) |
| `pnpm test` | Run all tests (Vitest) |
| `pnpm run cover` | Run tests and generate a coverage report |
| `pnpm run lint` | Run ESLint on all `src/` and `test/` TypeScript files (CI enforces `--max-warnings 0`) |
| `pnpm run typecheck` | Type-check all packages (parallel) |
| `pnpm audit` | Check all dependencies for known vulnerabilities |
| `pnpm changeset` | Add a changeset for a public API or behavior change |
| `pnpm changeset --empty` | Add an empty changeset for docs or internal-only changes |

## Package Architecture

| Package | Published | Purpose |
|---|---|---|
| [`saved-views-client`](../packages/saved-views-client/) | ✅ `@itwin/saved-views-client` | TypeScript client for the iTwin Platform Saved Views REST API. Dual ESM + CJS output. |
| [`saved-views-react`](../packages/saved-views-react/) | ✅ `@itwin/saved-views-react` | React 18 components and utilities (`SavedViewTile`, `TileGrid`, `captureSavedViewData`, `applySavedView`). ESM only. |
| [`test-app-frontend`](../packages/test-app-frontend/) | ❌ private | Vite + React dev/demo app. Runs on `http://localhost:7948`. |
| [`test-app-backend`](../packages/test-app-backend/) | ❌ private | Express + iTwin iModels backend supporting the test app. |

## Code Style & Conventions

### Copyright Header

Every source file must begin with this header:

```ts
/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
```

### File Naming

- **React component files**: PascalCase — `SavedViewTile.tsx`, `SavedViewTileContext.tsx`
- **Utility, hook, and function files**: camelCase — `applySavedView.ts`, `useSavedViews.tsx`, `utils.ts`
- **Class files**: PascalCase — `ITwinSavedViewsClient.ts`
- **Model and type files**: PascalCase — `SavedView.ts`
- **Folders containing a component**: PascalCase — `SavedViewTile/`, `TileGrid/`
- **Folders for utilities or groupings**: camelCase — `translation/`
- **Barrel files**: always `index.ts`

### Naming Conventions

- **Components, classes, types, interfaces, enums**: PascalCase
- **Interface names do NOT use an `I` prefix** — use `SavedViewTileProps`, not `ISavedViewTileProps`
- **Functions, variables, React hooks**: camelCase
- **Module-level constants**: camelCase — `modelClipGroupMappings`, not `MODEL_CLIP_GROUP_MAPPINGS`
- **Enum members**: PascalCase — `RenderMode.SmoothShade`
- **Unused parameters**: prefix with `_` — `_unused`

### Import Conventions

- Use `import type { ... }` for all type-only imports:
  ```ts
  import type { SavedView, SavedViewTag } from "../SavedView.js";
  ```
- All internal imports use the **`.js` extension** even though source files are `.ts`/`.tsx`:
  ```ts
  import { SavedViewTile } from "./SavedViewTile.js";
  ```
- Use `export type { ... }` when re-exporting types from barrel files.

### React Component Style

- Exported components use **named function declarations**, not arrow functions:
  ```ts
  export function SavedViewTile(props: SavedViewTileProps): ReactElement { ... }
  ```
- Always specify **explicit return types** on exported functions.
- Define the props interface directly above the component it belongs to.
- Document public exported APIs and component props with JSDoc `/** */` comments.

### ESLint Rules Agents Must Not Violate

The following are the most common rules that can produce lint failures. CI enforces **zero warnings**:

- Prefix unused variables and parameters with `_`
- Always use `===` / `!==`
- Trailing commas required on multiline expressions and parameter lists
- Single quotes for strings
- Never use `eval()` — it is an error
- Avoid non-null assertions (`!`) — they are a warning; only freely allowed in test files
- Handle all members in `switch` statements over enums and union types (`switch-exhaustiveness-check`)

## Testing

Tests use [Vitest](https://vitest.dev/) with the `happy-dom` environment for DOM simulation. Each package has its own `vitest.config.ts`.

- **Test files**: co-located with source or in a `test/` directory, named `*.test.ts` / `*.test.tsx`
- **Run all tests**: `pnpm test` (from repo root)
- **Run tests for one package**: `cd packages/saved-views-react && pnpm run test:cover`
- **Coverage**: `pnpm run cover` (uses `@vitest/coverage-v8`)
- Test files relax `any` and non-null assertion lint rules — these relaxations must not be used in production code

## Versioning with Changesets

This repository uses [Changesets](https://github.com/changesets/changesets) to manage versioning and changelogs. See the [README](../README.md#versioning-with-changesets) for the full workflow.

- **Public API or behavior change** → `pnpm changeset` (select semver bump and describe the change)
- **Docs-only or internal-only change** → `pnpm changeset --empty`
- Every PR to main must include a changeset; CI will fail without one

---

## MANDATORY: Pre-commit Checklist

**CRITICAL**: Before finishing any task, you MUST run all four commands below in order and fix every error and warning before considering the work done. Do not skip steps.

```shell
pnpm run build     # Must produce zero compiler errors
pnpm test          # Must produce zero failing tests
pnpm run lint      # Must produce zero errors AND zero warnings
pnpm run typecheck # Must produce zero type errors
pnpm audit         # Must produce zero high/critical vulnerabilities
```

**NO EXCEPTIONS**: Code that does not build, has failing tests, or produces lint/type errors must never be committed.
