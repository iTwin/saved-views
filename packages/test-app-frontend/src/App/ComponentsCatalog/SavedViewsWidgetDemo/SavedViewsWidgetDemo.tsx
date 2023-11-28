/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Button, Surface } from "@itwin/itwinui-react";
import { SavedViewsExpandableBlockWidget, SavedViewsFolderWidget, createTileOptions } from "@itwin/saved-views-react";
import { ReactElement } from "react";

import { useSavedViewData } from "../useSavedViewData.js";

export function SavedViewsExpandableBlockWidgetDemo(): ReactElement {
  const { state: { savedViews, groups, tags, editing }, actions, setEditing } = useSavedViewData();

  const options = createTileOptions({
    renameSavedView: true,
    groupActions: actions.moveToGroup && {
      groups: [...groups.values()],
      moveToGroup: actions.moveToGroup,
      moveToNewGroup: actions.moveToNewGroup,
    },
    tagActions: actions.addTag && actions.removeTag && {
      tags: [...tags.values()],
      addTag: actions.addTag,
      addNewTag: actions.addNewTag,
      removeTag: actions.removeTag,
    }
  });

  return (
    <div style={{ display: "grid", alignContent: "start", gap: "var(--iui-size-s)" }}>
      <div style={{ display: "grid", overflow: "auto" }}>
        <SavedViewsExpandableBlockWidget
          savedViews={savedViews}
          groups={groups}
          tags={tags}
          editable={editing}
          actions={actions}
          options={() => options}
        />
        {
          editing &&
          <Surface
            style={{
              width: "fit-content",
              height: "fit-content",
              padding: "var(--iui-size-xs) var(--iui-size-s)",
              justifySelf: "end",
              display: "flex",
              gap: "var(--iui-size-s)",
              position: "sticky",
              bottom: "var(--iui-size-s)",
              margin: "var(--iui-size-s)",
              zIndex: 11,
            }}
          >
            <Button styleType="high-visibility" onClick={() => setEditing(false)}>Save changes</Button>
            <Button onClick={() => setEditing(false)}>Cancel</Button>
          </Surface>
        }
      </div>
    </div>
  );
}

export function SavedViewsFolderWidgetDemo(): ReactElement {
  const { state: { savedViews, groups, tags }, actions } = useSavedViewData();

  const options = createTileOptions({
    renameSavedView: true,
    groupActions: actions.moveToGroup && {
      groups: [...groups.values()],
      moveToGroup: actions.moveToGroup,
      moveToNewGroup: actions.moveToNewGroup,
    },
    tagActions: actions.addTag && actions.removeTag && {
      tags: [...tags.values()],
      addTag: actions.addTag,
      addNewTag: actions.addNewTag,
      removeTag: actions.removeTag,
    }
  });

  return (
    <div style={{ display: "grid", alignContent: "start", gap: "var(--iui-size-s)" }}>
      <SavedViewsFolderWidget
        savedViews={savedViews}
        groups={groups}
        tags={tags}
        actions={actions}
        options={() => options}
      />
    </div>
  );
}
