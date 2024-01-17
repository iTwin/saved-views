/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { InputGrid, Label, Slider, Surface } from "@itwin/itwinui-react";
import { TileGrid } from "@itwin/saved-views-react";
import { useState, type ReactElement } from "react";

export function TileGridDemo(): ReactElement {
  const [tileWidth, setTileWidth] = useState(250);

  return (
    <div style={{ display: "grid", grid: "auto 1fr / 1fr", gap: "var(--iui-size-m)", overflow: "auto" }}>
      <InputGrid style={{
        width: "100%",
        maxWidth: "calc(20 * var(--iui-size-l)",
        justifySelf: "center",
        padding: "var(--iui-size-m)",
      }}>
        <Label>--itwin-svr-tile-width={tileWidth}px</Label>
        <Slider
          values={[tileWidth]}
          min={100}
          max={500}
          onUpdate={([value]) => setTileWidth(value)}
        />
      </InputGrid>
      <TileGrid
        style={{ "--itwin-svr-tile-width": `${tileWidth}px` }}
        gridItems={Array.from({ length: 100 }).map((_, i) => i)}
      >
        {
          (item) => (
            <Surface style={{ width: "100%", height: "var(--iui-size-l)", display: "grid", placeItems: "center" }}>
              {item}
            </Surface>
          )
        }
      </TileGrid>
    </div>
  );
}
