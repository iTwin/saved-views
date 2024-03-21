# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased](https://github.com/iTwin/saved-views/tree/HEAD/packages/saved-views-react)

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


## [0.1.0](https://github.com/iTwin/saved-views/tree/v0.1.0-react/packages/saved-views-react) - 2024-02-02

Initial package release.
