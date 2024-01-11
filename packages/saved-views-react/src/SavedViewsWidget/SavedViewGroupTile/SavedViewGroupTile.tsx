/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { SvgFolder } from "@itwin/itwinui-icons-react";
import { Text, Tile } from "@itwin/itwinui-react";
import { useLayoutEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from "react";

import type { SavedViewGroup } from "../../SavedView.js";
import { EditableTileName } from "../../SavedViewTile/SavedViewTile.js";
import { SavedViewGroupTileContext, SavedViewGroupTileContextProvider } from "./SavedViewGroupTileContext.js";

interface SavedViewGroupTileProps {
  group: SavedViewGroup;
  numItems: number;
  onOpen: (groupId: string) => void;
  focused?: boolean | undefined;
  initialScrollTop: number;
  editable?: boolean | undefined;
  options?: ReactNode[] | undefined;
  onRename?: ((groupId: string, newName: string) => void) | undefined;
}

export function SavedViewGroupTile(props: SavedViewGroupTileProps): ReactElement {
  const divRef = useRef<HTMLDivElement>(null);
  const [editingName, setEditingName] = useState(false);

  useLayoutEffect(
    () => {
      if (props.focused && divRef.current) {
        const scrollContainer = divRef.current.closest(".svr-saved-views-widget");
        if (scrollContainer) {
          scrollContainer.scrollTop = props.initialScrollTop;
        }

        divRef.current.querySelector("button")?.focus();
        divRef.current.scrollIntoView({ block: "nearest" });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const dispatchOpenGroup = () => props.onOpen(props.group.id);

  const savedViewGroupTileContext = useMemo<SavedViewGroupTileContext>(
    () => ({ group: props.group, setEditingName }),
    [props.group],
  );

  return (
    <SavedViewGroupTileContextProvider value={savedViewGroupTileContext}>
      <div ref={divRef}>
        <Tile
          className="svr-folder"
          variant="folder"
          name={
            <EditableTileName
              displayName={props.group.displayName}
              editable={props.editable || editingName}
              editing={editingName}
              actions={{
                onStartEditing: () => setEditingName(true),
                onEndEditing: (newName) => {
                  setEditingName(false);
                  if (newName !== props.group.displayName) {
                    props.onRename?.(props.group.id, newName);
                  }
                },
              }}
            />
          }
          thumbnail={
            <div className="svr-folder-edit" onClick={dispatchOpenGroup}>
              <div style={{ position: "absolute" }} />
              <SvgFolder className="iui-thumbnail-icon" />
            </div>
          }
          isActionable={!props.editable && !editingName}
          moreOptions={(props.options && props.options.length > 0) ? props.options : undefined}
          onClick={dispatchOpenGroup}
        >
          <Text isMuted>{props.numItems} items</Text>
        </Tile>
      </div>
    </SavedViewGroupTileContextProvider>
  );
}
