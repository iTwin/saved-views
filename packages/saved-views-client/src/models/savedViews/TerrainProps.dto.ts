/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

/** Correction modes for terrain height */
export enum TerrainHeightOriginMode {
  /** Height value indicates the geodetic height of the IModel origin (also referred to as ellipsoidal or GPS height) */
  Geodetic = 0,
  /** Height value indicates the geoidal height of the IModel origin (commonly referred to as sea level). */
  Geoid = 1,
  /** Height value indicates the height of the IModel origin relative to ground level at project center. */
  Ground = 2,
}

/** JSON representation of the settings of the terrain applied to background map display by a DisplayStyle. */
export interface TerrainProps {
  providerName?: string;
  exaggeration?: number;
  applyLighting?: boolean;
  heightOrigin?: number;
  heightOriginMode?: TerrainHeightOriginMode;
}
