# @itwin/saved-views-client

## About

This package hosts client-side code and TypeScript types for interacting with [iTwin Platform Saved Views API](https://developer.bentley.com/apis/savedviews/overview/).

## Usage

```ts
import { ITwinSavedViewsClient } from "@itwin/saved-views-client";

const client = new ITwinSavedViewsClient({
  getAccessToken: async () => "<itwin_platform_auth_token>",
});

const { savedView } = await client.getSavedViewMinimal({ savedViewId: "<saved_view_id>" });
console.log(savedView); /*
{
  id: "<saved_view_id>",
  displayName: "Saved View",
  creationTime: "2024-01-01T10:00:00.000Z",
  lastModified: "2024-01-01T10:01:00.000Z",
  groupId: undefined,
  shared: false,
  tags: [...],
  savedViewData: { itwin3dView: {...} },
  extensions: [...],
  _links: {...}
} */
```

## Contributing

 [Contributing](../../README.md#contributing).
 
---

Copyright © Bentley Systems, Incorporated. All rights reserved. See [LICENSE.md](./LICENSE.md) for license terms and full copyright notice.
