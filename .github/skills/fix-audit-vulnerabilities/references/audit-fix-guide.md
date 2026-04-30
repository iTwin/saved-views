# Audit Fix Strategy Guide

Reference for choosing and applying the right fix for pnpm audit vulnerabilities in the saved-views monorepo.

## Fix Strategy Decision Tree

```
Is the vulnerable package a direct dependency in any package.json?
├── YES → Bump the version in that package.json, then pnpm install
└── NO (transitive) →
    Is there a fixed version available?
    ├── YES → Add/update pnpm.overrides in root package.json
    └── NO  → Pin to the least-vulnerable published version via pnpm.overrides
                and track the advisory for when a fix is released
```

## Strategy Details

### 1. Bump a Direct Dependency

Find which `package.json` declares the vulnerable package and update its version range.

Workspace package locations:
- `packages/saved-views-client/package.json`
- `packages/saved-views-react/package.json`
- `packages/test-app-frontend/package.json`
- `packages/test-app-backend/package.json`
- Root `package.json` (devDependencies / dependencies)

After editing, always run:
```
pnpm install
```

### 2. pnpm Overrides (Transitive Dependencies)

Add or edit the `"pnpm"` section in the **root** `package.json`:

```json
{
  "pnpm": {
    "overrides": {
      "vulnerable-package@<X.Y.Z": ">=X.Y.Z"
    }
  }
}
```

**Key syntax rules:**
- Use comparison operators on the key: `"pkg@<1.2.3"`, `"pkg@>=4.0.0 <5.0.5"`, `"pkg@<=3.3.3"`
- Do **not** use caret/tilde on the key (e.g. `"pkg@^4"`) — these may not match correctly
- Use a bare key (e.g. `"pkg"`) only as a last resort; it overrides **all** versions including safe ones
- Use `>=X.Y.Z` as the value (not a pinned exact version) so future patch releases are still resolved

**Scope overrides precisely** to avoid collateral effects. For example, if only picomatch@4.0.0–4.0.3 is vulnerable, use:
```json
"picomatch@>=4.0.0 <4.0.4": "4.0.4"
```
not `"picomatch": ">=4.0.4"`, which would also force consumers of safe `^2.x` to upgrade.

After editing, run:
```
pnpm install
```

**If overrides don't seem to apply**, delete `pnpm-lock.yaml` and reinstall to force full re-resolution:
```powershell
Remove-Item pnpm-lock.yaml
pnpm install
```

### 3. Nested Overrides (Scope to a Specific Dependency Chain)

If only one package pulls in the vulnerability and you don't want a global override:

```json
{
  "pnpm": {
    "overrides": {
      "parent-package>vulnerable-package": ">=X.Y.Z"
    }
  }
}
```

## Common Vulnerability Types & Typical Fixes

| Vulnerability Type | Typical Package | Common Fix |
|--------------------|----------------|------------|
| Prototype pollution | `lodash`, `minimist` | Bump to patched minor/patch version |
| ReDoS (regex DoS) | `trim`, `semver` | Bump to patched version |
| Path traversal | `tar`, `glob` | Bump to patched version |
| SSRF / open redirect | HTTP/request libs | Upgrade or switch package |
| Outdated transitive dep | Various | pnpm override to pinned safe version |

## Verifying a Fix

Always run these in order after applying a fix:

```powershell
# 0. Set execution policy (Windows)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
cd e:\saved-views_1\saved-views

# 1. Confirm vulnerability is gone
pnpm audit 2>&1

# 2. Confirm build still passes
pnpm run build 2>&1

# 3. Confirm tests still pass
pnpm test 2>&1

# 4. Confirm lint passes (must have zero warnings — CI enforces --max-warnings 0)
pnpm run lint -- --max-warnings 0 2>&1

# 5. (Optional) Type-check if you updated types
pnpm run typecheck 2>&1
```

## Reducing Overrides

After fixing vulnerabilities, always check if any override can be eliminated by bumping a direct dep instead. For each override:

1. Identify the direct dep pulling in the vulnerable package via `pnpm why <pkg>`
2. Check if its latest version has updated the transitive dep: `pnpm view <direct-dep>@latest dependencies --json`
3. If yes, bump the direct dep version in the relevant `package.json` and remove the override

Removing an override is better than keeping one — it means the fix is self-maintaining and reduces maintenance burden.

## Pitfalls

- **Do not use `npm audit fix`** — npm is blocked in this project (`"npm": "<0"`).
- **`pnpm.overrides` vs `resolutions`** — pnpm uses `overrides`, not `resolutions` (that's Yarn). Using the wrong key silently does nothing.
- **Override key syntax** — use comparison operators (`@<1.2.3`, `@>=4.0.0 <5.0.5`), not caret/tilde (`@^4`). Caret/tilde in keys may not match correctly.
- **Bare override keys** — `"picomatch": ">=4.0.4"` overrides *all* versions including safe `^2.x` consumers. Scope to the affected range instead.
- **`pnpm why` caveat** — `pnpm why` at the workspace root may return nothing even if a package is installed as a sub-package transitive dep. Always cross-check with `Select-String -Path pnpm-lock.yaml -Pattern "^  <pkg>@"`.
- **Lock file drift** — after any `package.json` edit, re-run `pnpm install` so `pnpm-lock.yaml` is updated and committed. If overrides don't apply, delete `pnpm-lock.yaml` and reinstall.
- **Published package breaking changes** — if `saved-views-client` or `saved-views-react` need a major bump, check the changelog and update consuming code before releasing.
