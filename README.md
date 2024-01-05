# iTwin Saved Views

[![CI](https://github.com/iTwin/saved-views-react/actions/workflows/CI.yaml/badge.svg)](https://github.com/iTwin/saved-views-react/actions/workflows/CI.yaml) [![CodeQL](https://github.com/iTwin/saved-views-react/actions/workflows/codeql.yml/badge.svg)](https://github.com/iTwin/saved-views-react/actions/workflows/codeql.yml)

## Packages

[@itwin/saved-views-client](./packages/saved-views-client/)
[@itwin/saved-views-react](./packages/saved-views-react/)

## Setup

```shell
npx pnpm install
```

## Commands

* `npm start` – starts the test app, available on [http://localhost:7948](http://localhost:7948)
  * To enable iTwin Platform features, create `packages/test-app-frontend/.env.local` file based on contents of `packages/test-app-frontend/.env`
* `npm test` – runs all unit tests
* `npm run cover` – runs all unit tests and calculates test coverage
* `npm run lint` – runs ESLint on all TypeScript files in this repository
* `npm run typecheck` – type checks all packages in this repository

## Contributing

We welcome contributions to make this project better. You can submit feature requests or report bugs by creating an [issue](https://github.com/iTwin/saved-views/issues).

---

Copyright © Bentley Systems, Incorporated. All rights reserved. See [LICENSE.md](./LICENSE.md) for license terms and full copyright notice.
