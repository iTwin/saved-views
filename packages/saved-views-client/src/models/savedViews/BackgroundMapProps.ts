/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { PlanarClipMaskProps } from "./PlanarClipMask.js";
import { TerrainProps } from "./TerrainProps.js";

/** Describes the projection of the background map. */
export enum GlobeMode {
  /** Display Earth as a 3D ellipsoid. */
  Ellipsoid = 0,
  /** Display Earth as a plane. */
  Plane = 1,
}

/** In-memory JSON representation of BackgroundMapSettings. */
export interface BackgroundMapProps {
  groundBias?: number;
  transparency?: number | false;
  useDepthBuffer?: boolean;
  applyTerrain?: boolean;
  terrainSettings?: TerrainProps;
  globeMode?: GlobeMode;
  nonLocatable?: boolean;
  planarClipMask?: PlanarClipMaskProps;
}
