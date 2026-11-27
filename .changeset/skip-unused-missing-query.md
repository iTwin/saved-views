---
"@itwin/saved-views-react": patch
---

Skip the missing models and categories queries when `other` visibility is not set. `createViewState` called without settings no longer runs an extra query whose result was discarded.
