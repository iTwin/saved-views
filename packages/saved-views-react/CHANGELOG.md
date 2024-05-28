# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased](https://github.com/iTwin/saved-views/tree/HEAD/packages/saved-views-react)

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
