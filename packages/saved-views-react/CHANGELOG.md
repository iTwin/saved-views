# Changelog

## 1.1.1

### Patch Changes

#### [1.1.1](https://github.com/iTwin/saved-views/tree/v1.1.1-react/packages/saved-views-react) - 2025-06-13

Add extractArrayElementsConditionally and handle invisible contextRealityModelsLegacyMappings@itwin/saved-views-react

## 1.1.0

### Minor Changes

#### [1.1.0](https://github.com/iTwin/saved-views/tree/v1.1.0-react/packages/saved-views-react) - 2025-06-05

Add subcategories option in applyView settings.@itwin/saved-views-react

## 1.0.0

### Major Changes

#### [1.0.0](https://github.com/iTwin/saved-views/tree/v1.0.0-react/packages/saved-views-react) - 2025-06-03

Change models and categories fallback setting option to seperate and further define settings for models and categories@itwin/saved-views-react

## 0.9.8

## 0.9.7

### Patch Changes

#### [0.9.7](https://github.com/iTwin/saved-views/tree/v0.9.7-react/packages/saved-views-react) - 2025-05-08

Fix extraction of clip data from clipVectors@itwin/saved-views-react

#### [0.9.7](https://github.com/iTwin/saved-views/tree/v0.9.7-react/packages/saved-views-react) - 2025-05-08

fix new content apply mode when using mesh tiles@itwin/saved-views-react

## 0.9.6

### Patch Changes

#### [0.9.6](https://github.com/iTwin/saved-views/tree/v0.9.6-react/packages/saved-views-react) - 2025-05-06

Change package CODEOWNERS git file@itwin/saved-views-react

#### [0.9.6](https://github.com/iTwin/saved-views/tree/v0.9.6-react/packages/saved-views-react) - 2025-05-06

Update @itwin/core packages to version 5.0.0-dev.111@itwin/saved-views-react

## 0.9.5

### Patch Changes

#### [0.9.5](https://github.com/iTwin/saved-views/tree/v0.9.5-react/packages/saved-views-react) - 2025-04-17

Fix extraction of realityDataSourceKey in contextRealityModels@itwin/saved-views-react

## 0.9.4

### Patch Changes

#### [0.9.4](https://github.com/iTwin/saved-views/tree/v0.9.4-react/packages/saved-views-react) - 2025-04-14

Fix applySavedView when changing camera but not the view state@itwin/saved-views-react

## 0.9.3

### Patch Changes

#### [0.9.3](https://github.com/iTwin/saved-views/tree/v0.9.3-react/packages/saved-views-react) - 2025-02-27

Fix clearing emphasized elements when applying a saved view.@itwin/saved-views-react

## 0.9.2

### Patch Changes

#### [0.5.1](https://github.com/iTwin/saved-views/tree/v0.5.1-client/packages/saved-views-client) - 2025-02-27

Change publishing artifact to use node.js 20.x@itwin/saved-views-client

#### [0.9.2](https://github.com/iTwin/saved-views/tree/v0.9.2-react/packages/saved-views-react) - 2025-02-27

Clear emphasizeElements and perModelCatVis everytime you apply a view (before the view is applied) instead of just if the saved view has that extension.@itwin/saved-views-react

#### [0.5.1](https://github.com/iTwin/saved-views/tree/v0.5.1-client/packages/saved-views-client) - 2025-02-27

Updated versions of dependencies to comply with yarn audit@itwin/saved-views-client

## 0.9.1

### Patch Changes

### [0.9.1](https://github.com/iTwin/saved-views/tree/v0.9.1-react/packages/saved-views-react) - 2025-02-25

- Update react to always clear `emphasizeElements` and `perModelCategoryVisibility` anytime you apply a view

## 0.9.0

### Minor Changes

#### [0.9.0](https://github.com/iTwin/saved-views/tree/v0.9.0-react/packages/saved-views-react) - 2025-02-06

Add overrides for emphasizeElements extension when apply/capturing saved view@itwin/saved-views-react

## 0.8.0

### Minor Changes

#### [0.8.0](https://github.com/iTwin/saved-views/tree/v0.8.0-react/packages/saved-views-react) - 2025-02-03

Updated Dependencies:

- Updated all @iTwin packages to be in line with AppUI 5.x
- iTwinUI updated to 3.x
  Important Notice: These updates may cause breaking changes if consumers of this package have not yet updated to the latest versions of these dependencies. Please ensure that you have updated your dependencies to avoid any potential issues.@itwin/saved-views-react

## 0.7.0

### Minor changes

#### [0.7.0](https://github.com/iTwin/saved-views/tree/react-v0.7.0/packages/saved-views-react/) - 2024-11-14

##### Breaking changes

- `SavedView` interface changes
  - Rename `id` property to `savedViewId`
  - Remove `thumbnail` property
  - Move `viewData` and `extensions` properties to `SavedViewData` type
    - Type of `viewData` has changed and definition has moved to `@itwin/saved-views-react`
  - Change type of `creationTime` and `lastModified` properties to `Date | undefined`
- Make `applySavedView` settings easier to understand
  - Remove `"reset"` from `ApplyStrategy` union, instead make `"clear"` a valid value for `emphasis` and `perModelCategoryVisibility` properties
  - Remove `all` property which set default `ApplyStrategy` of all settings
  - Update documentation
- `useSavedViews` hook rework
  - No longer implements optimistic behaviour
  - Lazily loads Saved View thumbnails and `SavedViewData`
  - Can utilize user-supplied external state store
  - All actions now return a promise that resolves on action completion
  - All creation actions now return id of the created entity
  - Rename `SavedViewActions` type to `SavedViewsActions`
  - Split `submitSavedView` into `createSavedView` and `updateSavedView`
  - Add `lookupSavedViewData` action
  - Remove `moveToNewGroup` and `addNewTag` actions
- `SavedViewTag`: Rename `id` property to `tagId`
- `SavedViewGroup`: Rename `id` property to `groupId`
- `SavedViewsClient` interface changes
  - Rename methods
    - `getAllSavedViews` -> `getSavedViews`
    - `getAllGroups` -> `getGroups`
    - `getAllTags` -> `getTags`
    - `getSavedView` -> `getSavedViewById`
  - Add `getSavedViewDataById` method
  - Method argument types now instead of ending in `*Params` now end in `*Args`, e.g. `CreateSavedViewParams` -> `CreateSavedViewArgs`
  - You can now query all Saved Views that are assigned to a particular group using `SavedViewsClient.getSavedViews`
  - `CreateSavedViewArgs`, `UpdateSavedViewArgs`: Inline properties previously nested within `savedView` property
  - `CreateGroupArgs`, `UpdateGroupArgs`: Inline properties previously nested within `group` property
  - `UpdateTagArgs`: Inline properties previously nested within `tag` property
- `<SavedViewTile />` changes
  - Add `thumbnail` prop
  - Thumbnails that were specified as image URLs now need to be explicitly passed as `<img src={url} />`
  - `onRename` callback will no longer send `undefined` for `newName` argument

##### changes

- `applySavedView` enhancements
  - Accept custom `viewChangeOptions` that the function will internally pass through to `viewport.changeView` call
  - Add `camera` setting that controls how camera data is applied. Allow supplying a custom `ViewPose` or ignoring Saved View data to keep the camera in place.

##### Fixes

- Fix `captureSavedViewData` failing with blank iModel connections
- Replace usage of internal iTwin.js API with public alternative

## 0.6.0

### Minor changes

#### [0.6.0](https://github.com/iTwin/saved-views/tree/react-v0.6.0/packages/saved-views-react/) - 2024-07-22

###### Breaking changes

- `SavedViewsClient` interface changes
  - Remove `getSavedViewInfo` method
  - Add `getAllSavedViews`, `getAllGroups`, and `getAllTags` methods as replacement for `getSavedViewInfo`
  - Rename `getSingularSavedView` method to `getSavedView`
- `captureSavedViewData` now also captures extension data thus return type has now changed to `{ viewData: ViewData; extensions: SavedViewExtension[] | undefined }`
- `SavedViewsClient.createSavedView`: Update parameter bag to reflect `SavedView` change (see minor changes)
- `SavedViewsClient.updateSavedView`: Update parameter bag to reflect `SavedView` change (see minor changes)
- `useSavedViews`: Update `submitSavedView` action parameters to reflect `SavedView` change (see minor changes)
- Update `applySavedView` parameter types. `savedViewData` is now a subset of `SavedView` object.

##### changes

- `SavedView` now also contains optional `viewData` and `extension` properties. Objects returned by `ITwinSavedViewsClient` will have these fields populated.
- Permit `ApplySavedViewSettings.viewState` value to be `"reset"`. Due to technicalities, it has the same semantics as `"apply"`.
- `SavedViewTile`: Update placeholder icon

##### Fixes

- `ITwinSavedViewsClient.createSavedView`: Extension data now is no longer ignored
- `ITwinSavedViewsClient.updateSavedView`: Fix extension data not being updated
- `ITwinSavedViewsClient.deleteGroup` now correctly attempts to delete multiple pages of Saved Views

###### Dependencies

- Bump `@itwin/itwinui-icons-react` version requirement from `^2.4.0` to `^2.9.0`
- Bump `@itwin/saved-views-client` version requirement from `^0.3.0` to `^0.4.0`

## 0.5.0

### Minor changes

#### [0.5.0](https://github.com/iTwin/saved-views/tree/v0.5.0-react/packages/saved-views-react) - 2024-06-03

##### Breaking changes

- `captureSavedViewData`: Remove `captureHiddenModelsAndCategories` setting from parameter bag. This function now behaves as if its value is always `true`.
- `createViewState`: Change function signature to take `ViewData` instead of `SavedViewRepresentation` and use parameter bag for additional settings
- Remove experimental `ModelCategoryOverrideProvider` class
- Remove experimental `applyExtensionsToViewport` function

##### changes

- Add `applySavedView` function
- Promote `createViewState` to public API

## 0.4.1

### Patch Changes

### [0.4.1](https://github.com/iTwin/saved-views/tree/v0.4.1-react/packages/saved-views-react) - 2024-05-28

- Expose parameter types used in `SavedViewsClient` methods

## [0.4.0]

### Minor changes

#### [0.4.0](https://github.com/iTwin/saved-views/tree/v0.4.0-react/packages/saved-views-react) - 2024-05-28

##### changes

- Add `extensions` property to `SavedView` type
- Add `creationTime` and `lastModified` properties to `SavedView` type
- Update `ITwinSavedViewsClient` to include `creationTime` and `lastModified` in `getSavedViewInfo`, `getSingularSavedView`, `createSavedView`, and `updateSavedView` responses

## 0.3.1

### Patch Changes

#### [0.3.1](https://github.com/iTwin/saved-views/tree/v0.3.1-react/packages/saved-views-react) - 2024-05-20

##### Fixes

- `LayeredMenuItem`: Fix chevron not aligning itself with item content

##### Dependencies

- Bump `@itwin/saved-views-client` package version from `^0.2.1` to `^0.3.0`

## 0.3.0

### Minor changes

## [0.3.0](https://github.com/iTwin/saved-views/tree/v0.3.0-react/packages/saved-views-react) - 2024-05-08

##### Breaking changes

- `SavedViewTile`: `onRename` callback can now receive `undefined` value for `newName` parameter to indicate that user has canceled rename operation
- `useSavedViews`: Rename `createSavedView` to `submitSavedView`. When the first argument is a partial `SavedView` object, this operation will now update or create a Saved View using the supplied information.

##### changes

- Add optional `creatorId` property to `SavedView` and `SavedViewGroup` types
- Add support for placing context menu button within `StickyExpandableBlock` title
- `ITwinSavedViewsClient.deleteGroup`: Delete all views contained within group before attempting to delete the group itself
- `LayeredDropdownMenu`: Improve keyboard navigation
- `LayeredMenuItem`: Forward `className` property to wrapping HTML element
- `LayeredMenuItem`: Increase spacing between label and right chevron
- `SavedViewOptions`: Forward `className` property to wrapping HTML element
- `useSavedViews`:
  - View and Group creation operations now sort stored locally stored Views / Groups
  - Failed View and Group delete operations now restore deleted items to their original spots

##### Fixes

- `SavedViewTile`: Fix context menu button not appearing when `options` prop receives a function with zero parameters
- Fix text overflow issues in `SavedViewTile` and `StickyExpandableBlock` components by truncating titles with ellipses
- Fix an issue with `useSavedViews` failing to load Saved View thumbnails when a cached data source is used

##### Dependencies

- Bump `@itwin/itwinui-react` package version from `^3.0.11` to `^3.8.1`
- Update and bump `@itwin/saved-views-client` package version specifier from `0.2.0` to `^0.2.1`

## 0.2.1

### Patch Changes

#### [0.2.1](https://github.com/iTwin/saved-views/tree/v0.2.1-react/packages/saved-views-react) - 2024-04-15

##### Dependencies

- Bump `@itwin/saved-views-client` package version from `0.1.0` to `0.2.0`

## 0.2.0

### Minor changes

#### [0.2.0](https://github.com/iTwin/saved-views/tree/v0.2.0-react/packages/saved-views-react) - 2024-04-08

##### Breaking changes

- Component CSS styles are now scoped to `itwin-svr` CSS layer
- Add `@itwin/core-geometry` as peer dependency
- Add `SavedViewsClient.uploadThumbnail` method
- Add `SavedViewActions.uploadThumbnail` method
- `SavedViewActions.createSavedView` method now returns a promise which resolves into created Saved View id

##### changes

- Add view capturing functions
  - `captureSavedViewData`
  - `captureSavedViewThumbnail`
- `package.json`: Define `types` field to help ES module users that have badly configured `tsconfig.json`

## 0.1.0

### Minor changes

## [0.1.0](https://github.com/iTwin/saved-views/tree/v0.1.0-react/packages/saved-views-react) - 2024-02-02

Initial package release.
