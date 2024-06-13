# @itwin/saved-views-react

## About

A collection of utilities and React components for building iTwin applications that deal with [Saved Views](https://developer.bentley.com/apis/savedviews/overview/).

## Documentation

### [captureSavedViewData](./src/captureSavedViewData.ts)

Captures current viewport state into serializable format. The returned data can later be used to restore viewport's view.

```ts
const { viewData, extensions = [] } = await captureSavedViewData({ viewport });
extensions.push(myCustomExtension(viewport));
console.log({ viewData, extensions }); /*
{
  viewData: { itwin3dView: {...} },
  extensions: {
    { extensionName: "EmphasizeElements", data: "{...}" },
    { extensionName: "MyCustomExtension", data: "my_custom_extension_data" },
  }
} */
```

### [captureSavedViewThumbnail](./src/captureSavedViewThumbnail.ts)

Generates Saved View thumbnail based on what is currently displayed on the viewport.

```ts
const thumbnail = captureSavedViewThumbnail(viewport);
console.log(thumbnail); // "data:image/png;base64,iVBORw0KGoAAAANSUhEUg..."
```

### [applySavedView](./src/applySavedView.ts)

Updates viewport state to match captured Saved View.

```ts
// Capture viewport state
const savedViewData = await captureSavedViewData({ viewport });
// Restore viewport state
await applySavedView(iModel, viewport, savedViewData);
```

### [createViewState](./src/createViewState.ts)

Creates ViewState object out of Saved View data. It provides a lower-level access to view data for advanced use.

```ts
const viewState = await createViewState(iModel, savedViewData.viewData);
await applySavedView(iModel, viewport, savedViewData, { viewState });

// The two lines above are equivalent to
await applySavedView(iModel, viewport, savedViewData);
```

### React components

* [SavedViewTile](./src/SavedViewTile/SavedViewTile.tsx)
  * [SavedViewOptions](./src/SavedViewTile/SavedViewOptions.tsx)
  * [LayeredDropdownMenu](./src/LayeredDropdownMenu/LayeredDropdownMenu.tsx)
* [TileGrid](./src/TileGrid/TileGrid.tsx)
* [StickyExpandableBlock](./src/StickyExpandableBlock/StickyExpandableBlock.tsx)

You can use these components however you see fit, however, below is the suggested component arrangement.

```tsx
import { LayeredMenuItem, SavedViewTile, StickyExpandableBlock, TileGrid } from "@itwin/saved-views-react";

export function SavedViewsWidget(props) {
  return (
    <StickyExpandableBlock title="Saved Views">
      <TileGrid gridItems={props.savedViews}>
        {
          (savedView) => (
            <SavedViewTile
              savedView={savedView}
              options={[
                <SavedViewOptions.Delete key="delete" deleteSavedView={props.deleteSavedView} />,
                <LayeredMenuItem key="menu-item" content={<MyMenuItemContent />}>
                  Custom menu item
                </LayeredMenuItem>,
              ]}
            />
          )
        }
      </TileGrid>
    </StickyExpandableBlock>
  );
}
```

### [useSavedViews](./src/useSavedViews.tsx)

[useSavedViews](./src/useSavedViews.tsx) React hook provides basic functionality to jump-start your Saved Views widget. It accepts [`ITwinSavedViewsClient`](./src/SavedViewsClient/ITwinSavedViewsClient.ts) which is used to pull Saved View data and synchronize it back to the [Saved Views service](https://developer.bentley.com/apis/savedviews/overview/).

```tsx
import { useSavedViews, ITwinSavedViewsClient } from "@itwin/saved-views-react";

const client = new ITwinSavedViewsClient({
  // auth_token should have access to savedviews:read and savedviews:modify OIDC scopes
  getAccessToken: async () => "auth_token",
});

export function SavedViewsWidget(props) {
  const savedViews = useSavedViews({ iTwinId: props.iTwinId, iModelId: props.iModelId, client });
  if (savedViews === undefined) {
    return "loading";
  }

  return (
    <MyWidgetContent
      savedViews={savedViews.savedViews}
      groups={savedViews.groups}
      tags={savedViews.tags}
      actions={savedViews.actions}
    />
  );
}
```

### Localization

In order to localize text across various provided components, mount [`<SavedViewsContextProvider />`](./src/SavedViewsContext.tsx) and supply `localization` object containing string replacements.

```tsx
import { SavedViewsContextProvider, type LocalizationStrings } from "@itwin/saved-views-react";

const localization: LocalizationStrings = { delete: "🗑️" };

export function SavedViewsWidget() {
  return (
    <SavedViewsContextProvider localization={localization}>
      <MyWidgetContent />
    </SavedViewsContextProvider>
  );
}

```

### Custom tile options

[`<SavedViewTile />`](./src/SavedViewTile/SavedViewTile.tsx) accepts an array of options to display in its context menu. This package exposes a number of ready-to-use options to use with your tiles, accessible through [`SavedViewOptions`](./src/SavedViewTile//SavedViewOptions.tsx) export, and you are free to create your own ones.

```tsx
import { MenuDivider, MenuItem } from "@itwin/itwinui-react";
import { SavedViewOptions, SavedViewTile, useSavedViewTileContext } from "@itwin/saved-views-react";

export function SavedViewsWidget(props) {
  return (
    <SavedViewTile
      savedView={props.savedView}
      options={(close) => [
        <SavedViewOptions.Rename key="rename" onClick={close} />,
        <MenuDivider key="divider" />,
        <OpenSavedView key="custom" onClick={props.openSavedView} />,
      ]}
    />
  );
}

function OpenSavedView(props) {
  const { savedView } = useSavedViewTileContext();

  return (
    <MenuItem onClick={() => props.onClick(savedView)}>
      Open {savedView.displayName}
    </MenuItem>
  );
}
```

## Contributing

We welcome contributions to make this package better. You can submit feature requests or report bugs by creating an [issue](https://github.com/iTwin/saved-views/issues).

---

Copyright © Bentley Systems, Incorporated. All rights reserved. See [LICENSE.md](./LICENSE.md) for license terms and full copyright notice.
