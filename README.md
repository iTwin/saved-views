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

We welcome contributions to make this project better. You can submit feature requests or report bugs by creating an [issue](https://github.com/iTwin/saved-views/issues).

---

Copyright © Bentley Systems, Incorporated. All rights reserved. See [LICENSE.md](./LICENSE.md) for license terms and full copyright notice.
