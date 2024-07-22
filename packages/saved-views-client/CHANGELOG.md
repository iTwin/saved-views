# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0](https://github.com/iTwin/saved-views/tree/client-v0.4.0/packages/saved-views-client/) - 2024-07-22

### Breaking changes

* `SavedViewsClient` interface changes
  * `getAllSavedViewsMinimal` and `getAllSavedViewsRepresentation` now return `AsyncIterableIterator` to better emphasize that results are delivered in pages
  * `createSavedView` and `updateSavedView` now return `SavedViewRepresentationResponse` to match the current iTwin API behavior

### Fixes

* Remove `extensions` property from `UpdateSavedViewParams` because extensions are immutable
* `ITwinSavedViewsClient`: Fix fetch requests failing when request body contains forbidden characters

## [0.3.0](https://github.com/iTwin/saved-views/tree/v0.3.0-client/packages/saved-views-client) - 2024-05-16

### Minor changes

* Add `creationTime` and `lastModified` properties to `SavedView` type

## [0.2.2](https://github.com/iTwin/saved-views/tree/v0.2.2-client/packages/saved-views-client) - 2024-05-09

### Minor changes

* Add optional readOnly property to `CreateGroupParams`, `UpdateGroupParams`, and `Group` types

## [0.2.1](https://github.com/iTwin/saved-views/tree/v0.2.1-client/packages/saved-views-client) - 2024-05-07

### Fixes

* Fix `ITwinSavedViewsClient.updateSavedView` failing when saved view data contains URL fields

## [0.2.0](https://github.com/iTwin/saved-views/tree/v0.2.0-client/packages/saved-views-client) - 2024-04-08

### Breaking changes

* Remove `SavedViewBase` type
* Omit `savedViewData` property from `SavedViewListMinimalResponse` type
* Rename types
    * `SavedViewWithDataMinimal` -> `SavedViewMinimal`
    * `SavedViewWithDataRepresentation` -> `SavedViewRepresentation`
    * `ViewDataItwin3d` -> `ViewDataITwin3d`

### Minor changes

* Add new type guards to discern `ViewData` union members
    * `isViewDataITwin3d`
    * `isViewDataITwinDrawing`
    * `isViewDataITwinSheet`
* `package.json`: Define `types` field to help ES module users that have badly configured `tsconfig.json`

### Fixes

* Fix `DELETE` operations throwing due to empty response body
* Fix being unable to send Saved View to iTwin Saved Views service when `savedViewData` contains URL fields

## [0.1.0](https://github.com/iTwin/saved-views/tree/v0.1.0-client/packages/saved-views-client) - 2024-02-01

Initial package release.
