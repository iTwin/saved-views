/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { SvgChevronLeft, SvgHome } from "@itwin/itwinui-icons-react";
import { Breadcrumbs, Button, DropdownButton, IconButton, MenuItem } from "@itwin/itwinui-react";
import { useCallback, useMemo, useState, type ReactElement, type ReactNode } from "react";

import type { SavedView, SavedViewGroup, SavedViewTag, SavedViewsActions } from "./SavedView.js";
import { SavedViewGroupOptions } from "./SavedViewGroupTile/SavedViewGroupOptions.js";
import { SavedViewGroupTile } from "./SavedViewGroupTile/SavedViewGroupTile.js";
import { SavedViewTile } from "./SavedViewTile/SavedViewTile.js";
import { BorderlessExpandableBlock, SavedViewTileGrid } from "./SavedViewsExpandableBlockWidget.js";
import { ViewState } from "@itwin/core-frontend";

interface SavedViewsFolderWidgetProps {
  savedViews: Map<string, SavedView>;
  groups: Map<string, SavedViewGroup>;
  tags: Map<string, SavedViewTag>;
  actions?: SavedViewsActions | undefined;
  editable?: boolean | undefined;
  options?: ((savedView: SavedView) => ReactNode[]) | undefined;
  // onRenderSelectedView?: ((selectedView: ViewState) => void) | undefined;
  onRenderSelectedView?: ((selectedViewId: string) => void) | undefined;
}

export function SavedViewsFolderWidget(props: SavedViewsFolderWidgetProps): ReactElement {
  const groupedSavedViews = useMemo(
    () => {
      const ungrouped: SavedView[] = [];
      const groups = new Map<string | undefined, SavedView[]>([[undefined, ungrouped]]);
      for (const groupId of props.groups.keys()) {
        groups.set(groupId, []);
      }

      for (const savedView of props.savedViews.values()) {
        const group = groups.get(savedView.groupId) ?? ungrouped;
        group.push(savedView);
      }

      return groups;
    },
    [props.savedViews, props.groups],
  );
  const [state, setState] = useState<SavedViewsFolderWidgetState>(
    { activeGroupId: undefined, focusedGroupId: undefined },
  );
  const [storedScrollOffset, setStoredScrollOffset] = useState(0);

  const handleGroupOpen = useCallback(
    (activeGroupId: string) => setState({ activeGroupId, focusedGroupId: undefined }),
    [],
  );

  const activeGroup = state.activeGroupId !== undefined && props.groups.get(state.activeGroupId);
  if (!activeGroup) {
    return (
      <SavedViewsHomeScreen
        groupedSavedViews={groupedSavedViews}
        groups={props.groups}
        tags={props.tags}
        focusedGroupId={state.focusedGroupId}
        clearFocusedGroup={() => setState(({ activeGroupId }) => ({ activeGroupId, focusedGroupId: undefined }))}
        onGroupOpen={handleGroupOpen}
        initialScrollTop={storedScrollOffset}
        storeScrollOffset={setStoredScrollOffset}
        actions={props.actions}
        editable={props.editable}
        savedViewOptions={props.options}
        onRenderSelectedView={props.onRenderSelectedView}
      />
    );
  }

  return (
    <SavedViewsGroupScreen
      key={activeGroup.id}
      activeGroup={activeGroup}
      groups={props.groups}
      tags={props.tags}
      savedViews={groupedSavedViews.get(activeGroup.id) ?? []}
      setActiveGroup={(activeGroupId) => setState({ activeGroupId, focusedGroupId: state.activeGroupId })}
      actions={props.actions}
      editable={props.editable}
      options={props.options}
    />
  );
}

interface SavedViewsFolderWidgetState {
  activeGroupId: string | undefined;
  focusedGroupId: string | undefined;
}

interface SavedViewsHomeScreenProps {
  groupedSavedViews: Map<string | undefined, SavedView[]>;
  groups: Map<string, SavedViewGroup>;
  tags: Map<string, SavedViewTag>;
  focusedGroupId?: string | undefined;
  clearFocusedGroup?: () => void;
  onGroupOpen: (groupId: string) => void;
  initialScrollTop: number;
  storeScrollOffset: (offset: number) => void;
  actions?: SavedViewsActions | undefined;
  editable?: boolean | undefined;
  savedViewOptions?: ((savedView: SavedView) => ReactNode[]) | undefined;
  // onRenderSelectedView?: ((selectedView: ViewState) => void) | undefined;
  onRenderSelectedView?: ((selectedViewId: string) => void) | undefined;
}

function SavedViewsHomeScreen(props: SavedViewsHomeScreenProps): ReactElement {
  const ungroupedSavedViews = props.groupedSavedViews.get(undefined) ?? [];

  const groupTiles = useMemo(
    () => [...props.groups.values()].map((group) =>
      <SavedViewGroupTile
        key={group.id}
        group={group}
        numItems={props.groupedSavedViews.get(group.id)?.length ?? 0}
        onOpen={props.onGroupOpen}
        focused={group.id === props.focusedGroupId}
        initialScrollTop={props.initialScrollTop}
        editable={props.editable}
        options={[
          <SavedViewGroupOptions.Rename key="rename" />,
          <MenuItem key="delete" onClick={() => props.actions?.deleteGroup?.(group.id)}>Delete</MenuItem>,
        ]}
        onRename={props.actions?.renameGroup}
      />,
    ),
    [
      props.groups,
      props.groupedSavedViews,
      props.onGroupOpen,
      props.focusedGroupId,
      props.initialScrollTop,
      props.editable,
      props.actions,
    ],
  );

  return (
    <div
      className="svr-saved-views-widget"
      style={{ overflow: "auto" }}
      onScroll={(event) => props.storeScrollOffset((event.target as HTMLElement).scrollTop)}
    >
      <BorderlessExpandableBlock displayName="Saved views" numItems={ungroupedSavedViews.length} expanded>
        <SavedViewTileGrid savedViews={ungroupedSavedViews}>
          {
            (savedView) =>
              <SavedViewTile
                savedView={savedView}
                tags={props.tags}
                editable={props.editable}
                onRename={props.actions?.renameSavedView}
                options={props.savedViewOptions?.(savedView)}
                onRenderSelectedView={props.onRenderSelectedView}
              />
          }
        </SavedViewTileGrid>
      </BorderlessExpandableBlock>
      <BorderlessExpandableBlock
        className="svr-group-grid"
        displayName="Groups"
        numItems={props.groups.size}
        expanded
        onExpandToggle={(expanded) => !expanded && props.clearFocusedGroup?.()}
        editable={props.editable}
      >
        <div className="svr-saved-view-grid">
          {groupTiles}
        </div>
      </BorderlessExpandableBlock>
    </div>
  );
}



interface SavedViewsGroupScreenProps {
  activeGroup: SavedViewGroup;
  groups: Map<string, SavedViewGroup>;
  tags: Map<string, SavedViewTag>;
  savedViews: SavedView[];
  setActiveGroup: (groupId: string | undefined) => void;
  actions?: SavedViewsActions | undefined;
  editable?: boolean | undefined;
  options?: ((savedView: SavedView) => ReactNode[]) | undefined;
}

function SavedViewsGroupScreen(props: SavedViewsGroupScreenProps): ReactElement {
  const groups = useMemo(() => [...props.groups.values()], [props.groups]);

  return (
    <div
      className="svr-saved-views-widget"
      style={{ display: "grid", grid: "auto 1fr / 1fr" }}
    >
      <div
        style={{
          display: "flex",
          gap: "var(--iui-size-s)",
          background: "var(--iui-color-background)",
          padding: "var(--iui-size-s)",
        }}
      >
        <Button startIcon={<SvgChevronLeft />} onClick={() => props.setActiveGroup(undefined)}>Back</Button>
        <Breadcrumbs>
          <IconButton onClick={() => props.setActiveGroup(undefined)}><SvgHome /></IconButton>
          <DropdownButton
            dropdownMenuProps={{ appendTo: "parent" }}
            menuItems={(close) =>
              groups.map((group) =>
                <MenuItem key={group.id} onClick={() => { close(); props.setActiveGroup(group.id); }}>
                  {group.displayName}
                </MenuItem>,
              )
            }
          >
            {props.activeGroup.displayName}
          </DropdownButton>
        </Breadcrumbs>
      </div>
      <div style={{ overflow: "auto" }}>
        <div className="svr-saved-view-grid">
          {props.savedViews.map((savedView) =>
            <SavedViewTile
              key={savedView.id}
              savedView={savedView}
              tags={props.tags}
              editable={props.editable}
              options={props.options?.(savedView)}
            />,
          )}
        </div>
      </div>
    </div>
  );
}
