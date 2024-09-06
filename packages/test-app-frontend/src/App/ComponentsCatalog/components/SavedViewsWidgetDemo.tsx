/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Button, Surface } from "@itwin/itwinui-react";
import {
  SavedViewsExpandableBlockWidget, SavedViewsFolderWidget, createSavedViewOptions,
} from "@itwin/saved-views-react/experimental";
import { ReactElement } from "react";

import { useSavedViewData } from "../useSavedViewData.js";

export function SavedViewsExpandableBlockWidgetDemo(): ReactElement {
  const { state: { savedViews, groups, tags, editing, thumbnails }, actions, setEditing } = useSavedViewData();

  const options = createSavedViewOptions({
    renameSavedView: true,
    groupActions: actions.moveToGroup && {
      groups: [...groups.values()],
      moveToGroup: actions.moveToGroup,
      moveToNewGroup: async (savedViewId, groupName) => {
        if (actions.createGroup && actions.moveToGroup) {
          const groupId = await actions.createGroup(groupName);
          await actions.moveToGroup(savedViewId, groupId);
        }
      },
    },
    tagActions: actions.addTag && actions.removeTag && {
      tags: [...tags.values()],
      addTag: actions.addTag,
      addNewTag: async (savedViewId, tagName) => {
        if (actions.createTag && actions.addTag) {
          const tagId = await actions.createTag(tagName);
          await actions.addTag(savedViewId, tagId);
        }
      },
      removeTag: actions.removeTag,
    },
  });

  return (
    <div style={{ display: "grid", alignContent: "start", gap: "var(--iui-size-s)" }}>
      <div style={{ display: "grid", overflow: "auto" }}>
        <SavedViewsExpandableBlockWidget
          savedViews={savedViews}
          groups={groups}
          tags={tags}
          thumbnails={thumbnails}
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
  const { state: { savedViews, groups, tags, thumbnails }, actions } = useSavedViewData();

  const options = createSavedViewOptions({
    renameSavedView: true,
    groupActions: actions.moveToGroup && {
      groups: [...groups.values()],
      moveToGroup: actions.moveToGroup,
      moveToNewGroup: async (savedViewId, groupName) => {
        if (actions.createGroup && actions.moveToGroup) {
          const groupId = await actions.createGroup(groupName);
          await actions.moveToGroup(savedViewId, groupId);
        }
      },
    },
    tagActions: actions.addTag && actions.removeTag && {
      tags: [...tags.values()],
      addTag: actions.addTag,
      addNewTag: async (savedViewId, tagName) => {
        if (actions.createTag && actions.addTag) {
          const tagId = await actions.createTag(tagName);
          await actions.addTag(savedViewId, tagId);
        }
      },
      removeTag: actions.removeTag,
    },
  });

  return (
    <div style={{ display: "grid", alignContent: "start", gap: "var(--iui-size-s)" }}>
      <SavedViewsFolderWidget
        savedViews={savedViews}
        groups={groups}
        tags={tags}
        thumbnails={thumbnails}
        actions={actions}
        options={() => options}
      />
    </div>
  );
}
