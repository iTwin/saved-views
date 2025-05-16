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
