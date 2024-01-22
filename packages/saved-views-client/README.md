# @itwin/saved-views-client

## About

This package hosts client-side code and TypeScript types for interacting with [iTwin Platform Saved Views API](https://developer.bentley.com/apis/savedviews/overview/).

## Usage

```ts
import { ITwinSavedViewsClient } from "@itwin/saved-views-client";

const client = new ITwinSavedViewsClient({
  getAccessToken: async () => "access_token",
});

const response = await client.getSavedViewMinimal({ savedViewId: "id" });
```

## Contributing

We welcome contributions to make this package better. You can submit feature requests or report bugs by creating an [issue](https://github.com/iTwin/saved-views-react/issues).

---

Copyright © Bentley Systems, Incorporated. All rights reserved. See [LICENSE.md](./LICENSE.md) for license terms and full copyright notice.
