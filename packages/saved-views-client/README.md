# @itwin/saved-views-client

## About

## Installation

```shell
npm install @itwin/saved-views-client
```

## Example

```TypeScript
import { ITwinSavedViewsClient } from "@itwin/saved-views-client";

const iTwinSavedViewsClient = new ITwinSavedViewsClient({
  getAccessToken: () => { return token; };
});

const res = await iTwinSavedViewsClient.getSavedViewMinimal({
  savedViewId:"ID",
})
```

## Contributing

We welcome contributions to make this package better. You can submit feature requests or report bugs by creating an [issue](https://github.com/iTwin/saved-views-react/issues).

---

Copyright © Bentley Systems, Incorporated. All rights reserved. See [LICENSE.md](./LICENSE.md) for license terms and full copyright notice.
