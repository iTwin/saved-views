/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Button, Surface, Text } from "@itwin/itwinui-react";
import { useState, type CSSProperties, type ReactElement, type ReactNode } from "react";
import { useSavedViewsContext } from "../SavedViewsContext.js";

import "./TileGrid.css";

interface TileGridProps<T> {
  /** Items to be displayed in the grid. */
  gridItems: T[];

  /**
   * Amount of items to reveal with each "Show more" trigger. You can disable pagination by specifying a large number,
   * e.g. `Number.MAX_VALUE`.
   *
   * @default 12
   */
  pageSize?: number | undefined;

  /**
   * Overrides the default "Show more" tile.
   *
   * @param moreAvailable Number of unrevealed items
   * @param revealMore When invoked, increases the amount of revealed items
   * @returns Content to be placed after all revealed items
   */
  moreItemsTile?: ((numMoreAvailable: number, revealMore: () => void) => ReactNode) | undefined;

  /** `className` of the wrapping element. */
  className?: string | undefined;

  /**
   * `style` of the wrapping element. You can control the column width by setting `--itwin-svr-tile-width` CSS variable.
   *
   * @example
   * <TileGrid gridItems={items} style={{ "--itwin-svr-tile-width": "200px" }}>
   *   {renderItem}
   * </TileGrid>
   */
  style?: (CSSProperties & CustomCSSVariables) | undefined;

  /** Invoked with items that are currently revealed. */
  children: (gridItem: T) => ReactNode;
}

interface CustomCSSVariables {
  /** Width of grid columns. */
  "--itwin-svr-tile-width"?: string | undefined;
}

/**
 * Grid layout for Saved View tiles. Limits the amount of visible tiles and gives option to the user to reveal more.
 *
 * @example
 * <TileGrid gridItems={savedViews}>
 *   {(savedView) => <SavedViewTile key={savedView.id} savedView={savedView} />}
 * </TileGrid>
 */
export function TileGrid<T>(props: TileGridProps<T>): ReactElement {
  const pageSize = props.pageSize ?? 12;
  const [softLimit, setSoftLimit] = useState(pageSize - 1);

  const tiles = props.gridItems
    .slice(0, props.gridItems.length > softLimit + pageSize ? softLimit : undefined)
    .map((gridItem) => props.children(gridItem));
  const numMoreAvailable = props.gridItems.length - tiles.length;

  const moreItemsTile = props.moreItemsTile ?? ((numMoreAvailable: number, revealMore: () => void) => (
    <MoreItemsTile numMoreAvailable={numMoreAvailable} revealMore={revealMore} />
  ));

  return (
    <div className={`svr-tile-grid ${props.className ?? ""}`} style={props.style}>
      {tiles}
      {
        numMoreAvailable > 0 &&
        moreItemsTile(numMoreAvailable, () => setSoftLimit((prev) => prev + pageSize))
      }
    </div>
  );
}

interface MoreItemsTileProps {
  numMoreAvailable: number;
  revealMore: () => void;
}

function MoreItemsTile(props: MoreItemsTileProps): ReactElement {
  const { localization } = useSavedViewsContext();
  return (
    <Surface className="svr-tile-grid--more-items-tile" elevation={0}>
      <Text variant="headline">{props.numMoreAvailable}</Text>
      <Text variant="leading">{localization.tileGrid.moreAvailable}</Text>
      <Button onClick={props.revealMore}>{localization.tileGrid.showMore}</Button>
    </Surface>
  );
}
