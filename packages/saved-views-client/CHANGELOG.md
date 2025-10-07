# Changelog

## 0.6.0

### Minor Changes

#### [0.6.0](https://github.com/iTwin/saved-views/tree/v0.6.0-client/packages/saved-views-client) - 2025-10-07

Expose CommonJS build for @itwin/saved-views-client@itwin/saved-views-client

## 0.5.4

### Patch Changes

#### [0.5.4](https://github.com/iTwin/saved-views/tree/v0.5.4-client/packages/saved-views-client) - 2025-09-25

Updated `axios` dependency version to `^1.12.0`@itwin/saved-views-client

## 0.5.3

### Patch Changes

#### [0.5.3](https://github.com/iTwin/saved-views/tree/v0.5.3-client/packages/saved-views-client) - 2025-08-07

Add support for properties and queryParams in ImageMapLayerProps@itwin/saved-views-client

## 0.5.2

### Patch Changes

#### [0.5.2](https://github.com/iTwin/saved-views/tree/v0.5.2-client/packages/saved-views-client) - 2025-05-22

Remove content type header when request body is empty@itwin/saved-views-client

## 0.5.1

### Patch Changes

#### [0.5.1](https://github.com/iTwin/saved-views/tree/v0.5.1-client/packages/saved-views-client) - 2025-02-27

Change publishing artifact to use node.js 20.x@itwin/saved-views-client

#### [0.5.1](https://github.com/iTwin/saved-views/tree/v0.5.1-client/packages/saved-views-client) - 2025-02-27

Updated versions of dependencies to comply with yarn audit@itwin/saved-views-client

## 0.5.0

### Minor Changes

#### [0.5.0](https://github.com/iTwin/saved-views/tree/v0.5.0-client/packages/saved-views-client) - 2025-02-03

- Change `priority` property from `PlanarClipMaskProps` to be a number instead of restricted to the enum `PlanarClipMaskPriority`
- Change `transformation` property from `ShapeProps` and `modelExtents` property from `ViewITwinDrawing` to be optional@itwin/saved-views-client

## 0.4.0

### Minor Changes

#### [0.4.0](https://github.com/iTwin/saved-views/tree/client-v0.4.0/packages/saved-views-client/) - 2024-07-22

##### Breaking changes

- `SavedViewsClient` interface changes
  - `getAllSavedViewsMinimal` and `getAllSavedViewsRepresentation` now return `AsyncIterableIterator` to better emphasize that results are delivered in pages
  - `createSavedView` and `updateSavedView` now return `SavedViewRepresentationResponse` to match the current iTwin API behavior

##### Fixes

- Remove `extensions` property from `UpdateSavedViewParams` because extensions are immutable
- `ITwinSavedViewsClient`: Fix fetch requests failing when request body contains forbidden characters

## 0.3.0

### Minor Changes

#### [0.3.0](https://github.com/iTwin/saved-views/tree/v0.3.0-client/packages/saved-views-client) - 2024-05-16

- Add `creationTime` and `lastModified` properties to `SavedView` type

## 0.2.2

### Patch Changes

#### [0.2.2](https://github.com/iTwin/saved-views/tree/v0.2.2-client/packages/saved-views-client) - 2024-05-09

- Add optional readOnly property to `CreateGroupParams`, `UpdateGroupParams`, and `Group` types

## 0.2.1

### Patch Changes

#### [0.2.1](https://github.com/iTwin/saved-views/tree/v0.2.1-client/packages/saved-views-client) - 2024-05-07

- Fix `ITwinSavedViewsClient.updateSavedView` failing when saved view data contains URL fields

## 0.2.0

### Minor Changes

#### [0.2.0](https://github.com/iTwin/saved-views/tree/v0.2.0-client/packages/saved-views-client) - 2024-04-08

##### Breaking changes

- Remove `SavedViewBase` type
- Omit `savedViewData` property from `SavedViewListMinimalResponse` type
- Rename types

  - `SavedViewWithDataMinimal` -> `SavedViewMinimal`
  - `SavedViewWithDataRepresentation` -> `SavedViewRepresentation`
  - `ViewDataItwin3d` -> `ViewDataITwin3d`

- Add new type guards to discern `ViewData` union members
  - `isViewDataITwin3d`
  - `isViewDataITwinDrawing`
  - `isViewDataITwinSheet`
- `package.json`: Define `types` field to help ES module users that have badly configured `tsconfig.json`

##### Fixes

- Fix `DELETE` operations throwing due to empty response body
- Fix being unable to send Saved View to iTwin Saved Views service when `savedViewData` contains URL fields

## 0.1.0

### Minor Changes

#### [0.1.0](https://github.com/iTwin/saved-views/tree/v0.1.0-client/packages/saved-views-client) - 2024-02-01

Initial package release.
