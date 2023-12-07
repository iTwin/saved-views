/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { SvgEdit, SvgImageFrame, SvgShare, SvgTag } from "@itwin/itwinui-icons-react";
import { Button, Input, Text, Tile } from "@itwin/itwinui-react";
import {
  useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type FocusEvent, type KeyboardEvent,
  type ReactElement, type ReactNode,
} from "react";

// import { useNavigate } from "react-router-dom";

import { useSavedViewsContext } from "../../SavedViewsContext.js";
import { trimInputString } from "../../utils.js";
import type { SavedView, SavedViewTag } from "../SavedView.js";
import { SavedViewTileContext, SavedViewTileContextProvider } from "./SavedViewTileContext.js";

import "./SavedViewTile.css";
// import { UiFramework } from "@itwin/appui-react";
// import { ViewportComponent } from "@itwin/imodel-components-react";
// import { ViewState } from "@itwin/core-frontend";

interface SavedViewTileProps {
  /** A Saved View that is being represented by the tile. */
  savedView: SavedView;

  /** A collection of available Saved View tags. Used for displaying tags on the tile. */
  tags?: Map<string, SavedViewTag> | undefined;

  /** When `true`, the tile becomes non-interactive and tile editing controls are shown. */
  editable?: boolean | undefined;

  /** Overrides icons that are displayed on the top-left of the Saved View thumbnail. */
  leftIcons?: ReactNode[] | undefined;

  /** Overrides icons that are displayed on the top-right of the Saved View thumbnail. */
  rightIcons?: ReactNode[] | undefined;

  /** Items to be added to the tile options menu. */
  options?: ReactNode[] | undefined;

  /**
   * Invoked when user submits a new name for the Saved View.
   * @param savedViewId Id of the associated Saved View.
   * @param newName User-submitted string for the Saved View title.
   *
   * @example
   * <SavedViewTile savedView={savedView} onRename={handleRename} editable />
   */
  onRename?: ((savedViewId: string, newName: string) => void) | undefined;

  /**
   * Renders the iModel with the saved view onto the screen
   */
  // onClick?:  ((savedViewId: string) => void) | undefined;

  /**
   * Renders the iModel with the saved view onto the screen
   */
  onRenderSelectedView?: ((selectedViewId: string) => void) | undefined;

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
              key={tag.id}
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

      // The following check is a workaround for false positiv overflow detection in Firefox
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
      <Tile
        className="svr-tile"
        thumbnail={props.savedView.thumbnail ?? <SvgImageFrame />}
        name={
          <EditableTileName
            displayName={props.savedView.displayName}
            editing={editingName}
            actions={{
              onStartEditing: () => setEditingName(true),
              onEndEditing: (newName) => {
                setEditingName(false);
                if (newName !== props.savedView.displayName) {
                  props.onRename?.(props.savedView.id, newName);
                }
              },
            }}
            editable={props.editable || editingName}
          />
        }
        metadata={metadata}
        moreOptions={(props.options && props.options.length > 0) ? props.options : undefined}
        leftIcon={<TileIconContainer style={{ placeSelf: "start" }} icons={props.leftIcons} />}
        rightIcon={<TileIconContainer style={{ placeSelf: "start end" }} icons={rightIcons} />}
        isActionable={!props.editable && !editingName}
        onClick={renderSavedView(props.onRenderSelectedView, props.savedView.id)}
      />
    </SavedViewTileContextProvider>
  );
}

function renderSavedView(onRenderSelectedView: ((selectedView: string) => void) | undefined, savedViewId: string) {
  if (onRenderSelectedView) {
    return () => onRenderSelectedView(savedViewId)
  } else {
    return () => {};
  }
}

function isOverflowing(element: HTMLElement): boolean {
  return element.offsetWidth < element.scrollWidth;
}

interface EditableTileNameProps {
  displayName: string;
  actions: {
    onStartEditing: () => void;
    onEndEditing: (newName: string) => void;
  };
  editing?: boolean | undefined;
  editable?: boolean | undefined;
}

export function EditableTileName(props: EditableTileNameProps): ReactElement {
  const { actions } = props;
  if (!props.editable) {
    return <>{props.displayName}</>;
  }

  if (props.editing) {
    const handleFocus = (ev: FocusEvent<HTMLInputElement>) => {
      ev.target.select();
    };
    const handleBlur = (ev: FocusEvent<HTMLInputElement>) => {
      actions.onEndEditing(trimInputString(ev.target.value));
    };
    const handleEndEditing = (inputValue: string) => {
      actions.onEndEditing(inputValue.length === 0 ? props.displayName : trimInputString(inputValue));
    };
    const handleKeyDown = (ev: KeyboardEvent<HTMLInputElement>) => {
      if (ev.key === "Enter") {
        const value = (ev.target as HTMLInputElement).value;
        actions.onEndEditing(value);
        handleEndEditing(value);
        return;
      }

      if (ev.key === "Escape") {
        actions.onEndEditing(props.displayName);
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
