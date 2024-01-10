/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { SvgBlank, SvgEdit, SvgMore, SvgShare } from "@itwin/itwinui-icons-react";
import { Button, DropdownMenu, IconButton, MenuItem, Surface, Text } from "@itwin/itwinui-react";
import { Fragment, useState, type ReactElement, type ReactNode } from "react";

import type { SavedView, SavedViewGroup, SavedViewTag } from "../SavedView.js";
import { SavedViewTile } from "../SavedViewTile/SavedViewTile.js";
import { StickyExpandableBlock } from "../StickyExpandableBlock/StickyExpandableBlock.js";
import type { SavedViewActions } from "../useSavedViews.js";

import "./SavedViewsExpandableBlockWidget.css";

interface SavedViewsExpandableBlockWidgetProps {
  savedViews: Map<string, SavedView>;
  groups: Map<string, SavedViewGroup>;
  tags: Map<string, SavedViewTag>;
  actions?: Partial<SavedViewActions> | undefined;
  editable?: boolean | undefined;
  options?: ((savedView: SavedView) => (((close: () => void) => ReactElement[]) | ReactElement[])) | undefined;
}

export function SavedViewsExpandableBlockWidget(props: SavedViewsExpandableBlockWidgetProps): ReactElement {
  return (
    <div className="svr-saved-views-widget">
      <SavedViewsGroup
        group={undefined}
        savedViews={props.savedViews}
        actions={props.actions}
        groups={props.groups}
        tags={props.tags}
        editable={props.editable}
        options={props.options}
        expanded
      />
      {
        [...props.groups.values()].map((group) =>
          <SavedViewsGroup
            key={group.id}
            group={group}
            savedViews={props.savedViews}
            groups={props.groups}
            tags={props.tags}
            actions={props.actions}
            editable={props.editable}
            options={props.options}
          />,
        )
      }
    </div>
  );
}

interface SavedViewsGroupProps {
  group: SavedViewGroup | undefined;
  savedViews: Map<string, SavedView>;
  groups: Map<string, SavedViewGroup>;
  tags: Map<string, SavedViewTag>;
  expanded?: boolean | undefined;
  actions?: Partial<SavedViewActions> | undefined;
  editable?: boolean | undefined;
  options?: ((savedView: SavedView) => (((close: () => void) => ReactElement[]) | ReactElement[])) | undefined;
}

export function SavedViewsGroup(props: SavedViewsGroupProps): ReactElement {
  const savedViews = [...props.savedViews.values()].filter(({ groupId }) => groupId === props.group?.id);
  return (
    <BorderlessExpandableBlock
      displayName={props.group?.displayName ?? "Ungrouped"}
      numItems={savedViews.length}
      expanded={props.expanded}
      shared={props.group?.shared}
      editable={props.editable}
    >
      <SavedViewTileGrid savedViews={savedViews}>
        {
          (savedView) =>
            <SavedViewTile
              savedView={savedView}
              tags={props.tags}
              editable={props.editable}
              onRename={props.actions?.renameSavedView}
              options={props.options?.(savedView)}
            />
        }
      </SavedViewTileGrid>
    </BorderlessExpandableBlock>
  );
}

interface SavedViewTileGridProps {
  savedViews: SavedView[];
  children: (savedView: SavedView) => ReactElement;
}

export function SavedViewTileGrid(props: SavedViewTileGridProps): ReactElement {
  const pageSize = 12;
  const [softLimit, setSoftLimit] = useState(pageSize - 1);

  const tiles = props.savedViews
    .slice(0, props.savedViews.length > softLimit + pageSize ? softLimit : undefined)
    .map((savedView) => <Fragment key={savedView.id}>{props.children(savedView)}</Fragment>);
  const numAdditionalSavedViews = props.savedViews.length - tiles.length;

  return (
    <div className="svr-saved-view-grid">
      {tiles}
      {
        numAdditionalSavedViews > 0 &&
        <Surface
          style={{
            padding: "var(--iui-size-m)",
            display: "grid",
            justifyItems: "center",
            gap: "var(--iui-size-s)",
          }}
          elevation={0}
        >
          <Text variant="headline">{numAdditionalSavedViews}</Text>
          <Text style={{ textAlign: "center", width: "calc(5 * var(--iui-size-xl))" }} variant="leading">
            more available
          </Text>
          <Button onClick={() => setSoftLimit((prev) => prev + pageSize)}>Show more</Button>
        </Surface>
      }
    </div>
  );
}

interface BorderlessExpandableBlockProps {
  displayName: string;
  numItems: number;
  expanded?: boolean | undefined;
  shared?: boolean | undefined;
  editable?: boolean | undefined;
  onExpandToggle?: (expanded: boolean) => void;
  className?: string | undefined;
  children: ReactNode;
}

export function BorderlessExpandableBlock(props: BorderlessExpandableBlockProps): ReactElement {
  const handleEditGroupClick = (closeDropdown: () => void) => {
    closeDropdown();
  };

  const [expanded, setExpanded] = useState(props.expanded ?? false);
  const handleExpandToggle = (expanded: boolean) => {
    setExpanded(expanded);
    props.onExpandToggle?.(expanded);
  };

  return (
    <StickyExpandableBlock
      titleClassName="svr-borderless-expandable-block-title"
      title={
        <>
          {props.shared && <SvgShare />}
          <Text>{props.displayName}</Text>
          <Text isMuted>({props.numItems})</Text>
        </>
      }
      endIcon={
        props.editable &&
        <DropdownMenu menuItems={
          (close) => [
            <MenuItem key="edit" startIcon={<SvgEdit />} onClick={() => handleEditGroupClick(close)}>
              Edit
            </MenuItem>,
            props.shared
              ? <MenuItem key="unshare" startIcon={<SvgBlank />}>Unshare</MenuItem>
              : <MenuItem key="share" startIcon={<SvgBlank />}>Share</MenuItem>,
          ]}
        >
          <IconButton styleType="borderless" size="small">
            <SvgMore />
          </IconButton>
        </DropdownMenu>
      }
      isExpanded={expanded}
      onToggle={handleExpandToggle}
    >
      {expanded && props.children}
    </StickyExpandableBlock>
  );
}
