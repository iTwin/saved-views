# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased](https://github.com/iTwin/saved-views/tree/HEAD/packages/saved-views-react)

### Beaking changes

* `SavedView` interface changes
  * Rename `id` property to `savedViewId`
  * Remove `thumbnail` property
  * Move `viewData` and `extensions` properties to `SavedViewData` type
    * Type of `viewData` has changed and definition has moved to `@itwin/saved-views-react`
  * Change type of `creationTime` and `lastModified` properties to `Date | undefined`
* `useSavedViews` hook rework
  * No longer implements optimistic behaviour
  * Lazily loads Saved View thumbnails and `SavedViewData`
  * Can utilize user-supplied external state store
  * All actions now return a promise that resolves on action completion
  * All creation actions now return id of the created entity
  * Rename `SavedViewActions` type to `SavedViewsActions`
  * Split `submitSavedView` into `createSavedView` and `updateSavedView`
  * Add `lookupSavedViewData` action
  * Remove `moveToNewGroup` and `addNewTag` actions
* `SavedViewTag`: Rename `id` property to `tagId`
* `SavedViewGroup`: Rename `id` property to `groupId`
* `SavedViewsClient` interface changes
  * Rename methods
    * `getAllSavedViews` -> `getSavedViews`
    * `getAllGroups` -> `getGroups`
    * `getAllTags` -> `getTags`
    * `getSavedView` -> `getSavedViewById`
  * Add `getSavedViewDataById` method
  * Method argument types now instead of ending in `*Params` now end in `*Args`, e.g. `CreateSavedViewParams` -> `CreateSavedViewArgs`
  * You can now query all Saved Views that are assigned to a particular group using `SavedViewsClient.getSavedViews`
  * `CreateSavedViewArgs`, `UpdateSavedViewArgs`: Inline properties previously nested within `savedView` property
  * `CreateGroupArgs`, `UpdateGroupArgs`: Inline properties previously nested within `group` property
  * `UpdateTagArgs`: Inline properties previously nested within `tag` property
* `<SavedViewTile />` changes
  * Add `thumbnail` prop
  * Thumbnails that were specified as image URLs now need to be explicitly passed as `<img src={url} />`
  * `onRename` callback will no longer send `undefined` for `newName` argument

### Fixes

* Replace usage of internal iTwin.js API with public alternative

## [0.6.0](https://github.com/iTwin/saved-views/tree/react-v0.6.0/packages/saved-views-react/) - 2024-07-22

### Breaking changes

* `SavedViewsClient` interface changes
  * Remove `getSavedViewInfo` method
  * Add `getAllSavedViews`, `getAllGroups`, and `getAllTags` methods as replacement for `getSavedViewInfo`
  * Rename `getSingularSavedView` method to `getSavedView`
* `captureSavedViewData` now also captures extension data thus return type has now changed to `{ viewData: ViewData; extensions: SavedViewExtension[] | undefined }`
* `SavedViewsClient.createSavedView`: Update parameter bag to reflect `SavedView` change (see minor changes)
* `SavedViewsClient.updateSavedView`: Update parameter bag to reflect `SavedView` change (see minor changes)
* `useSavedViews`: Update `submitSavedView` action parameters to reflect `SavedView` change (see minor changes)
* Update `applySavedView` parameter types. `savedViewData` is now a subset of `SavedView` object.

### Minor changes

* `SavedView` now also contains optional `viewData` and `extension` properties. Objects returned by `ITwinSavedViewsClient` will have these fields populated.
* Permit `ApplySavedViewSettings.viewState` value to be `"reset"`. Due to technicalities, it has the same semantics as `"apply"`.
* `SavedViewTile`: Update placeholder icon

### Fixes

* `ITwinSavedViewsClient.createSavedView`: Extension data now is no longer ignored
* `ITwinSavedViewsClient.updateSavedView`: Fix extension data not being updated
* `ITwinSavedViewsClient.deleteGroup` now correctly attempts to delete multiple pages of Saved Views

### Dependencies

* Bump `@itwin/itwinui-icons-react` version requirement from `^2.4.0` to `^2.9.0`
* Bump `@itwin/saved-views-client` version requirement from `^0.3.0` to `^0.4.0`

## [0.5.0](https://github.com/iTwin/saved-views/tree/v0.5.0-react/packages/saved-views-react) - 2024-06-03

### Breaking changes

* `captureSavedViewData`: Remove `captureHiddenModelsAndCategories` setting from parameter bag. This function now behaves as if its value is always `true`.
* `createViewState`: Change function signature to take `ViewData` instead of `SavedViewRepresentation` and use parameter bag for additional settings
* Remove experimental `ModelCategoryOverrideProvider` class
* Remove experimental `applyExtensionsToViewport` function

### Major changes

* Add `applySavedView` function
* Promote `createViewState` to public API

## [0.4.1](https://github.com/iTwin/saved-views/tree/v0.4.1-react/packages/saved-views-react) - 2024-05-28

* Expose parameter types used in `SavedViewsClient` methods

## [0.4.0](https://github.com/iTwin/saved-views/tree/v0.4.0-react/packages/saved-views-react) - 2024-05-28

### Minor changes

* Add `extensions` property to `SavedView` type
* Add `creationTime` and `lastModified` properties to `SavedView` type
* Update `ITwinSavedViewsClient` to include `creationTime` and `lastModified` in `getSavedViewInfo`, `getSingularSavedView`, `createSavedView`, and `updateSavedView` responses

## [0.3.1](https://github.com/iTwin/saved-views/tree/v0.3.1-react/packages/saved-views-react) - 2024-05-20

### Fixes

* `LayeredMenuItem`: Fix chevron not aligning itself with item content

### Dependencies

* Bump `@itwin/saved-views-client` package version from `^0.2.1` to `^0.3.0`

## [0.3.0](https://github.com/iTwin/saved-views/tree/v0.3.0-react/packages/saved-views-react) - 2024-05-08

### Breaking changes

* `SavedViewTile`: `onRename` callback can now receive `undefined` value for `newName` parameter to indicate that user has canceled rename operation
* `useSavedViews`: Rename `createSavedView` to `submitSavedView`. When the first argument is a partial `SavedView` object, this operation will now update or create a Saved View using the supplied information.

### Minor changes

* Add optional `creatorId` property to `SavedView` and `SavedViewGroup` types
* Add support for placing context menu button within `StickyExpandableBlock` title
* `ITwinSavedViewsClient.deleteGroup`: Delete all views contained within group before attempting to delete the group itself
* `LayeredDropdownMenu`: Improve keyboard navigation
* `LayeredMenuItem`: Forward `className` property to wrapping HTML element
* `LayeredMenuItem`: Increase spacing between label and right chevron
* `SavedViewOptions`: Forward `className` property to wrapping HTML element
* `useSavedViews`:
    * View and Group creation operations now sort stored locally stored Views / Groups
    * Failed View and Group delete operations now restore deleted items to their original spots

### Fixes

* `SavedViewTile`: Fix context menu button not appearing when `options` prop receives a function with zero parameters
* Fix text overflow issues in `SavedViewTile` and `StickyExpandableBlock` components by truncating titles with ellipses
* Fix an issue with `useSavedViews` failing to load Saved View thumbnails when a cached data source is used

### Dependencies

* Bump `@itwin/itwinui-react` package version from `^3.0.11` to `^3.8.1`
* Update and bump `@itwin/saved-views-client` package version specifier from `0.2.0` to `^0.2.1`

## [0.2.1](https://github.com/iTwin/saved-views/tree/v0.2.1-react/packages/saved-views-react) - 2024-04-15

### Dependencies

* Bump `@itwin/saved-views-client` package version from `0.1.0` to `0.2.0`

## [0.2.0](https://github.com/iTwin/saved-views/tree/v0.2.0-react/packages/saved-views-react) - 2024-04-08

### Breaking changes

* Component CSS styles are now scoped to `itwin-svr` CSS layer
* Add `@itwin/core-geometry` as peer dependency
* Add `SavedViewsClient.uploadThumbnail` method
* Add `SavedViewActions.uploadThumbnail` method
* `SavedViewActions.createSavedView` method now returns a promise which resolves into created Saved View id

### Minor changes

* Add view capturing functions
    * `captureSavedViewData`
    * `captureSavedViewThumbnail`
* `package.json`: Define `types` field to help ES module users that have badly configured `tsconfig.json`


## [0.1.0](https://github.com/iTwin/saved-views/tree/v0.1.0-react/packages/saved-views-react) - 2024-02-02

Initial package release.
