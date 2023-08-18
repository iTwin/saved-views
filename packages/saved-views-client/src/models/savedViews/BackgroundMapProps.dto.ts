// Copyright (c) Bentley Systems, Incorporated. All rights reserved.
import { PlanarClipMaskProps } from "./PlanarClipMask.dto";
import { TerrainProps } from "./TerrainProps.dto";

/**
 * Describes the projection of the background map
 */
export enum GlobeMode {
  /** Display Earth as 3d ellipsoid */
  Ellipsoid = 0,
  /** Display Earth as plane. */
  Plane = 1,
}

/**
 * In-memory JSON representation of a BackgroundMapSettings.
 */
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
