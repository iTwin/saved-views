/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { FeatureAppearanceProps } from "./FeatureAppearance.dto.js";
import { PlanarClipMaskProps } from "./PlanarClipMask.dto.js";

/**
 * Key used by RealityDataSource to identify provider and reality data format.
 * This key identifies one and only one reality data source on the provider.
 */
export interface RealityDataSourceKey {
  provider: string;
  format: string;
  id: string;
  iTwinId?: string;
}

/**
 * Describes how a SpatialClassifier affects the display of interfaceified geometry - that is, geometry intersecting
 * the interfaceifier.
 */
export enum SpatialClassifierInsideDisplay {
  /** The geometry is not displayed. */
  Off = 0,
  /** The geometry is displayed without alteration. */
  On = 1,
  /** The geometry is darkened. */
  Dimmed = 2,
  /** The geometry is tinted by the Viewport.hilite color. */
  Hilite = 3,
  /** The geometry is tinted with the colors of the interfaceifier elements. */
  ElementColor = 4,
}

/**
 * Describes how a SpatialClassifier affects the display of uninterfaceified geometry - that is, geometry not intersecting
 * the interfaceifier.
 */
export enum SpatialClassifierOutsideDisplay {
  /** The geometry is not displayed. */
  Off = 0,
  /** The geometry is displayed without alteration. */
  On = 1,
  /** The geometry is darkened. */
  Dimmed = 2,
}

/** JSON representation of SpatialClassifierFlags. */
export interface SpatialClassifierFlagsProps {
  inside: SpatialClassifierInsideDisplay;
  outside: SpatialClassifierOutsideDisplay;
  isVolumeClassifier?: boolean;
}

/** JSON representation of a SpatialClassifier. */
export interface SpatialClassifierProps {
  modelId: string;
  expand: number;
  flags: SpatialClassifierFlagsProps;
  name: string;
  isActive?: boolean;
}

/** JSON representation of a ContextRealityModel. */
export interface ContextRealityModelProps {
  realityDataSourceKey?: RealityDataSourceKey;
  tilesetUrl: string;
  realityDataId?: string;
  name?: string;
  description?: string;
  classifiers?: SpatialClassifierProps[];
  planarClipMask?: PlanarClipMaskProps;
  appearanceOverrides?: FeatureAppearanceProps;
}
