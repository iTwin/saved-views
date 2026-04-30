---
name: fix-audit-vulnerabilities
description: 'Identify and fix high-severity npm/pnpm security vulnerabilities in the saved-views monorepo. Use when asked to "fix audit vulnerabilities", "run pnpm audit", "update audit", "fix security issues", "address CVEs", or when security advisories need to be resolved. Runs pnpm audit --audit-level high, diagnoses affected packages, applies dependency overrides or upgrades, then verifies fixes with build and tests.'
---

# Fix Audit Vulnerabilities

Workflow for identifying, fixing, and verifying high-severity security vulnerabilities in the saved-views pnpm monorepo.

## When to Use This Skill

- User asks to "fix audit vulnerabilities" or "run pnpm audit"
- User mentions "security issues", "CVEs", or "dependency vulnerabilities"
- CI audit check is failing
- User wants to "update audit" or "resolve security advisories"

## Prerequisites

- pnpm >= 10 installed
- Node >= 20
- Run commands from the **repository root** (`e:\saved-views_1\saved-views\`)
- On Windows, prefix commands with `cmd /c "cd /d <repo-root> && <command> 2>&1"`

## Step-by-Step Workflow

### Step 1: Run the Audit

Run [run-audit.ps1](./scripts/run-audit.ps1) or execute directly:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
cd e:\saved-views_1\saved-views
pnpm audit 2>&1
```

> Note: Run without `--audit-level high` so that moderate vulnerabilities are also visible — they may be fixed just as easily.

Read the output carefully. Note:
- **Package name** with the vulnerability
- **Severity** (high or critical)
- **Via** chain (which of your direct deps pulled it in)
- **Fix available** — whether a non-breaking fix exists

### Step 2: Diagnose the Affected Packages

For each vulnerable package, determine which workspace package(s) depend on it:

```powershell
pnpm why <vulnerable-package>
```

> **Caveat:** `pnpm why` only searches the current workspace root, not sub-packages. If it returns nothing, the package is still likely installed as a transitive dep — confirm by checking `pnpm-lock.yaml` directly:
> ```powershell
> Select-String -Path pnpm-lock.yaml -Pattern "^  <vulnerable-package>@"
> ```

Check the sub-package `package.json` files in:
- `packages/saved-views-client/package.json`
- `packages/saved-views-react/package.json`
- `packages/test-app-frontend/package.json`
- `packages/test-app-backend/package.json`
- Root `package.json`

### Step 3: Choose a Fix Strategy

Consult [audit-fix-guide.md](./references/audit-fix-guide.md) for strategy details.

| Situation | Strategy |
|-----------|----------|
| Direct dependency, non-breaking update available | Bump version in the relevant `package.json` |
| Transitive dependency, fix available | Add `pnpm.overrides` in root `package.json` |
| No fix available yet | Add `pnpm.overrides` to pin to the least-vulnerable version |
| Breaking major version bump needed | Update code for compatibility before bumping |

### Step 4: Apply the Fix

**Option A — Bump a direct dependency:**
Edit the relevant `package.json` and update the version range, then:
```powershell
cmd /c "cd /d e:\saved-views_1\saved-views && pnpm install 2>&1"
```

**Option B — Add/update a pnpm override** (root `package.json`):
```json
{
  "pnpm": {
    "overrides": {
      "vulnerable-package@<fixed-version": ">=fixed-version"
    }
  }
}
```
Then run `pnpm install`.

> **Override key syntax:** Always use comparison-operator ranges on the key (e.g. `"pkg@<1.2.3"`, `"pkg@>=4.0.0 <5.0.5"`) rather than caret/tilde ranges (e.g. `"pkg@^4"`). Caret/tilde ranges in keys may not match correctly.
>
> **Override value syntax:** Use `">=fixed-version"` (not a pinned exact version) so future patches are still resolved. For the value, `>=` works correctly even though it looks unbounded — pnpm resolves the minimum satisfying version.
>
> **Scope overrides precisely:** If a vulnerability only affects one major version range, restrict the key accordingly (e.g. `"picomatch@>=4.0.0 <4.0.4": "4.0.4"`) rather than a bare `"picomatch"` which would force all consumers, including those on a safe `^2.x` range, to use the overridden version.

### Step 5: Consider Deleting the Lockfile for a Fresh Resolve

If some overrides don't seem to take effect, delete `pnpm-lock.yaml` and re-install to force a full dependency re-resolution:
```powershell
Remove-Item pnpm-lock.yaml
pnpm install
```
This ensures all overrides are applied from scratch rather than reusing cached resolutions.

### Step 6: Verify the Fix

Re-run the audit to confirm vulnerabilities are resolved:
```powershell
pnpm audit 2>&1
```

### Step 7: Try to Reduce Overrides

Before finishing, check whether any override can be eliminated by bumping a direct dependency instead. For each override, trace the chain with `pnpm why` and check if the direct dep that pulls it in has a newer version with the vulnerability fixed:

```powershell
pnpm view <direct-dep>@latest dependencies --json
```

Removing an override is always preferable to keeping one — it means the fix is self-maintaining.

### Step 8: Confirm Nothing is Broken

Run build, tests, and lint to make sure the fix didn't break anything:
```powershell
pnpm run build 2>&1
pnpm test 2>&1
pnpm run lint -- --max-warnings 0 2>&1
```

> **Warning — ESLint plugin upgrades:** If you upgraded `@typescript-eslint/eslint-plugin` or `@typescript-eslint/parser` as part of the fix, major version bumps (e.g. v7 → v8) can remove or rename rules, causing lint to break even if audit passes. Common v8 breakages:
> - Formatting rules removed: `@typescript-eslint/comma-dangle`, `@typescript-eslint/quotes`, `@typescript-eslint/member-delimiter-style` → replace with base eslint equivalents (`comma-dangle`, `quotes`) and drop `member-delimiter-style`
> - `@typescript-eslint/ban-types` removed → use `@typescript-eslint/no-empty-object-type` or disable it
> - `no-unused-expressions` default changed → add `["error", { "allowShortCircuit": true, "allowTernary": true }]` to restore previous behavior
> - New rules added to `recommended-type-checked` may flag existing code (e.g. `no-duplicate-type-constituents`, `only-throw-error`)
>
> Always run lint immediately after any `@typescript-eslint` upgrade and before considering the fix complete.

If type errors appear, run typecheck for details:
```powershell
pnpm run typecheck 2>&1
```

## Important Notes

- **Never use `npm`** — this project blocks npm (`"npm": "<0"` in engines). Always use `pnpm`.
- **pnpm overrides** live under the `"pnpm"` key in the root `package.json`, not `"resolutions"`.
- After editing any `package.json`, always run `pnpm install` to regenerate `pnpm-lock.yaml`.
- If a fix requires a major version bump of a published package (`saved-views-client` or `saved-views-react`), check for API breaking changes before applying.

## References

- [Audit Fix Strategy Guide](./references/audit-fix-guide.md)
- [Run Audit Script](./scripts/run-audit.ps1)
- [pnpm audit docs](https://pnpm.io/cli/audit)
- [pnpm overrides docs](https://pnpm.io/package_json#pnpmoverrides)
