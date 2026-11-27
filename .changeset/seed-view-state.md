---
"@itwin/saved-views-react": minor
---

Add optional `seedViewState` setting to `createViewState` and `applySavedView`. For iTwin3d views, a provided spatial `ViewState` is used as the seed instead of querying the iModel default view, so callers can load it in parallel with fetching Saved View data.
