/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { SvgEdit, SvgMore, SvgSavedView, SvgShare, SvgTag } from "@itwin/itwinui-icons-react";
import { Button, IconButton, Input, Text, Tile } from "@itwin/itwinui-react";
import {
  useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type FocusEvent, type KeyboardEvent,
  type ReactElement, type ReactNode,
} from "react";

import { LayeredDropdownMenu } from "../LayeredDropdownMenu/LayeredDropdownMenu.js";
import type { SavedView, SavedViewTag } from "../SavedView.js";
import { useSavedViewsContext } from "../SavedViewsContext.js";
import { trimInputString } from "../utils.js";
import { SavedViewTileContext, SavedViewTileContextProvider } from "./SavedViewTileContext.js";

import "./SavedViewTile.css";

interface SavedViewTileProps {
  /** A Saved View that is being represented by the tile. */
  savedView: SavedView;

  /** Image to be displayed on the tile. */
  thumbnail?: ReactNode | undefined;

  /** A collection of available Saved View tags. Used for displaying tags on the tile. */
  tags?: Map<string, SavedViewTag> | undefined;

  /** When `true`, the tile becomes non-interactive and tile editing controls are shown. */
  editable?: boolean | undefined;

  /** Overrides icons that are displayed on the top-left of the Saved View thumbnail. */
  leftIcons?: ReactNode[] | undefined;

  /** Overrides icons that are displayed on the top-right of the Saved View thumbnail. */
  rightIcons?: ReactNode[] | undefined;

  /** Items to be added to the tile options menu. */
  options?: ((close: () => void) => ReactElement[]) | ReactElement[] | undefined;

  /**
   * Invoked when user submits a new name for the Saved View.
   * @param savedViewId Id of the associated Saved View
   * @param newName User-submitted string for the Saved View title
   *
   * @example
   * <SavedViewTile savedView={savedView} onRename={handleRename} editable />
   */
  onRename?: ((savedViewId: string, newName: string) => void) | undefined;

  /**
   * Click handler meant for triggering the render of iModel onto the screen with the saved view applied
   */
  onClick?: ((selectedViewId: string) => void) | undefined;

  /** Sets `className` of the top-level tile element. */
  className?: string | undefined;
}

/**
 * Displays Saved View information within a tile component.
 *
 * @example
 * <SavedViewTile
 *   savedView={savedView}
 *   tags={savedViewTags}
 *   options={[<SavedViewOptions.Rename key="rename" icon={<SvgBlank />} />]}
 *   onRename={handleRename}
 * />
 */
export function SavedViewTile(props: SavedViewTileProps): ReactElement {
  const { localization } = useSavedViewsContext();
  const [editingName, setEditingName] = useState(false);

  const savedViewTags = useMemo(
    () => {
      const tags = props.tags;
      if (!tags || !props.savedView.tagIds) {
        return [];
      }

      return props.savedView.tagIds.map((id) => tags.get(id)).filter(tag => tag) as SavedViewTag[];
    },
    [props.savedView.tagIds, props.tags],
  );
  const [numShownTags, setNumShownTags] = useState(savedViewTags.length);
  const metadataRef = useRef<HTMLDivElement>(null);
  const metadata = (
    <div className="svr-tile--metadata">
      {savedViewTags.length > 0 && <SvgTag />}
      <div ref={metadataRef} className="svr-tile--tag-container">
        {savedViewTags.slice(0, numShownTags).map(
          (tag, i) => (
            <div
              key={tag.tagId}
              className="svr-tile--tag"
              style={{ flexShrink: i === numShownTags - 1 ? "unset" : 0 }}
            >
              {tag.displayName}
            </div>
          ),
        )}
      </div>
      {
        numShownTags < savedViewTags.length &&
        <Text className="svr-tile--tag-overflow" variant="small">
          {`+${savedViewTags.length - numShownTags} ${localization.tile.moreTags}`}
        </Text>
      }
    </div>
  );

  useLayoutEffect(() => { setNumShownTags(savedViewTags.length); }, [savedViewTags]);

  useLayoutEffect(
    () => {
      const metadataDiv = metadataRef.current;
      if (!metadataDiv || numShownTags <= 1) {
        return;
      }

      // The following check is a workaround for false positive overflow detection in Firefox
      if (!isOverflowing(metadataDiv) && !isOverflowing(metadataDiv.lastChild as HTMLElement)) {
        return;
      }

      const metadataRightEdge = metadataDiv.getBoundingClientRect().right;
      for (let i = 1; i < numShownTags; ++i) {
        const child = metadataDiv.children[i] as HTMLElement;
        if (isOverflowing(child) || child.getBoundingClientRect().right > metadataRightEdge) {
          setNumShownTags(i);
          return;
        }
      }
    },
    [numShownTags],
  );

  const rightIcons = props.rightIcons ?? (
    props.savedView.shared ? [<SvgShare key="share" />] : []
  );

  const savedViewTileContext = useMemo<SavedViewTileContext>(
    () => ({ savedView: props.savedView, setEditingName }),
    [props.savedView],
  );

  return (
    <SavedViewTileContextProvider value={savedViewTileContext}>
      <Tile.Wrapper
        className={`svr-tile ${props.className || ""}`}
        onClick={() => props.onClick?.(props.savedView.savedViewId)}
      >
        {!props.editable && <Tile.Action />}
        <Tile.Name className="svr-tile-name">
          <EditableTileName
            displayName={props.savedView.displayName}
            editing={editingName}
            actions={{
              onStartEditing: () => setEditingName(true),
              onEndEditing: (newName, commit) => {
                setEditingName(false);
                commit && props.onRename?.(props.savedView.savedViewId, newName);
              },
            }}
            editable={props.editable || editingName}
          />
        </Tile.Name>
        <Tile.ThumbnailArea className="svr-tile-thumbnail">
          {props.thumbnail ?? <Tile.ThumbnailPicture><SvgSavedView /></Tile.ThumbnailPicture>}
          <TileIconContainer style={{ placeSelf: "start" }} icons={props.leftIcons} />
          <TileIconContainer style={{ placeSelf: "start end" }} icons={rightIcons} />
        </Tile.ThumbnailArea>
        <Tile.ContentArea>
          <Tile.Metadata>
            {metadata}
          </Tile.Metadata>
          {
            (typeof props.options === "function" || (props.options && props.options.length > 0)) &&
            <div className="svr-tile--more-options" onClick={(ev) => ev.stopPropagation()}>
              <LayeredDropdownMenu menuItems={props.options}>
                <IconButton size="small" styleType="borderless"><SvgMore /></IconButton>
              </LayeredDropdownMenu>
            </div>
          }
        </Tile.ContentArea>
      </Tile.Wrapper>
    </SavedViewTileContextProvider>
  );
}

function isOverflowing(element: HTMLElement): boolean {
  return element.offsetWidth < element.scrollWidth;
}

interface EditableTileNameProps {
  displayName: string;
  actions: {
    onStartEditing: () => void;
    onEndEditing: (newName: string, commit: boolean) => void;
  };
  editing?: boolean | undefined;
  editable?: boolean | undefined;
}

export function EditableTileName(props: EditableTileNameProps): ReactElement {
  const { actions } = props;
  if (!props.editable) {
    return <div>{props.displayName}</div>;
  }

  if (props.editing) {
    const handleEndEditing = (inputValue: string, commit: boolean) => {
      const trimmedValue = trimInputString(inputValue);
      actions.onEndEditing(trimmedValue.length === 0 ? props.displayName : trimmedValue, commit);
    };
    const handleFocus = (ev: FocusEvent<HTMLInputElement>) => {
      ev.target.select();
    };
    const handleBlur = (ev: FocusEvent<HTMLInputElement>) => {
      handleEndEditing(ev.target.value, true);
    };
    const handleKeyDown = (ev: KeyboardEvent<HTMLInputElement>) => {
      if (ev.key === "Enter") {
        handleEndEditing((ev.target as HTMLInputElement).value, true);
        return;
      }

      if (ev.key === "Escape") {
        actions.onEndEditing(props.displayName, false);
        return;
      }
    };
    return (
      <Input
        size="small"
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        defaultValue={props.displayName}
        placeholder={props.displayName}
        autoFocus
      />
    );
  }

  return (
    <Button
      className="svr-tile--editable-title"
      styleType="borderless"
      size="small"
      onClick={() => actions.onStartEditing()}
    >
      {props.displayName}
      <SvgEdit />
    </Button>
  );
}

interface TileIconContainerProps {
  style: CSSProperties;
  icons?: ReactNode[] | undefined;
}

function TileIconContainer(props: TileIconContainerProps): ReactElement {
  return (
    <div className="svr-tile--icon-container" style={props.style}>
      {props.icons?.map((icon) => (
        <div key={(icon as { key: string; } | undefined)?.key} className="svr-tile--icon">
          {icon}
        </div>
      ))}
    </div>
  );
}
