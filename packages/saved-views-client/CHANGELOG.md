# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased](https://github.com/iTwin/saved-views/tree/HEAD/packages/saved-views-client)

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

### Fixes

* Fix `DELETE` operations throwing due to empty response body
* Fix being unable to send Saved View to iTwin Saved Views service when `savedViewData` contains URL fields

## [0.1.0](https://github.com/iTwin/saved-views/tree/v0.1.0-client/packages/saved-views-client) - 2024-02-01

Initial package release.
