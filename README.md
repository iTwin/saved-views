# iTwin Saved Views

[![CI](https://github.com/iTwin/saved-views/actions/workflows/CI.yaml/badge.svg)](https://github.com/iTwin/saved-views/actions/workflows/CI.yaml) [![CodeQL](https://github.com/iTwin/saved-views/actions/workflows/codeql.yml/badge.svg)](https://github.com/iTwin/saved-views/actions/workflows/codeql.yml)

## Packages

| Repository                                                  | npmjs                                                           |
| ----------------------------------------------------------- | --------------------------------------------------------------- |
| [@itwin/saved-views-client](./packages/saved-views-client/) | [link](https://www.npmjs.com/package/@itwin/saved-views-client) |
| [@itwin/saved-views-react](./packages/saved-views-react/)   | [link](https://www.npmjs.com/package/@itwin/saved-views-react)  |


## Development setup

* Install project dependencies.

  ```shell
  npx pnpm install
  ```

* Start the test application.

  ```shell
  npm start
  ```

* You can now edit TypeScript and CSS source files and changes will automatically be reflected in the test app.

## Top-level commands

* `npm start` – starts the test app which can be accessed at [http://localhost:7948](http://localhost:7948)
  * To enable app features that use [iTwin Platform](https://developer.bentley.com/), see [`packages/test-app-frontend/.env`](./packages/test-app-frontend/.env) file.
* `npm run lint` – runs ESLint on all TypeScript files in this repository
* `npm run typecheck` – type checks all packages in this repository

## Contributing

### Issues

We welcome contributions to make this package better. You can submit feature requests or report bugs by creating an [issue](https://github.com/iTwin/saved-views/issues).

### Versioning with Changesets

This repository uses [Changesets](https://github.com/changesets/changesets) to manage package versioning and changelogs. When making changes that affect the public API or behavior, please add a changeset by running:

```shell
npx changeset
```

Follow the prompts to describe your changes and select the appropriate version bump (major, minor, or patch). Versioning should follow [semver](https://semver.org/) conventions. If no version bump is required (such as for documentation-only changes), use `npx changeset --empty`.

When changesets are added and merged into the main branch, a release pull request (PR) will be automatically created by the Changesets GitHub Action. This PR will contain the version updates and changelog entries generated from your changesets. Review the release PR to ensure the version bumps and changelog messages are accurate before merging. Once the release PR is merged, the new package version will be published automatically.

For more details, see the [Changesets documentation](https://github.com/changesets/changesets/blob/main/README.md).

---

Copyright © Bentley Systems, Incorporated. All rights reserved. See [LICENSE.md](./LICENSE.md) for license terms and full copyright notice.
