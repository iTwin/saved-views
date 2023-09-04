/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Button, Surface } from "@itwin/itwinui-react";
import { SavedViewsExpandableBlockWidget, SavedViewsFolderWidget } from "@itwin/saved-views-react";
import { ReactElement } from "react";

import { useSavedViewData } from "../useSavedViewData.js";

export function SavedViewsExpandableBlockWidgetDemo(): ReactElement {
  const { state: { savedViews, groups, tags, editing }, actions, setEditing } = useSavedViewData();

  return (
    <div style={{ display: "grid", alignContent: "start", gap: "var(--iui-size-s)" }}>
      <div style={{ display: "grid", overflow: "auto" }}>
        <SavedViewsExpandableBlockWidget
          savedViews={savedViews}
          groups={groups}
          tags={tags}
          editable={editing}
          actions={actions}
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
  const { state: { savedViews, groups, tags, editing }, actions, setEditing } = useSavedViewData();

  return (
    <div style={{ display: "grid", alignContent: "start", gap: "var(--iui-size-s)" }}>
      {
        editing
          ? (
            <div>
              <Button styleType="high-visibility" onClick={() => setEditing(false)}>Save changes</Button>
              <Button onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          )
          : <Button onClick={() => setEditing(true)}>Edit</Button>
      }
      <SavedViewsFolderWidget
        savedViews={savedViews}
        groups={groups}
        tags={tags}
        editable={editing}
        actions={actions}
      />
    </div>
  );
}
