/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { AmbientOcclusionProps } from "./AmbientOcclusionProps.dto.js";
import { BackgroundMapProps } from "./BackgroundMapProps.dto.js";
import { ClipStyleProps } from "./ClipStyle.dto.js";
import { ContextRealityModelProps } from "./ContextRealityModel.dto.js";
import { EnvironmentProps } from "./Environment.dto.js";
import { DisplayStyleModelAppearanceProps } from "./FeatureAppearance.dto.js";
import {
  LightSettingsProps,
  SolarShadowSettingsProps,
} from "./LightSettings.dto.js";
import { MapImageryProps } from "./MapImagery.dto.js";
import { DisplayStylePlanarClipMaskProps } from "./PlanarClipMask.dto.js";
import { PlanProjectionSettingsProps } from "./PlanProjectionSettings.dto.js";
import { RgbColorProps } from "./RgbColor.dto.js";
import { DisplayStyleSubCategoryProps } from "./SubCategory.dto.js";
import { ViewFlagProps } from "./ViewFlags.dto.js";

/** Describes the style in which monochrome color is applied by a DisplayStyleSettings. */
export enum MonochromeMode {
  /** The color of the geometry is replaced with the monochrome color. e.g., if monochrome color is white, the geometry will be white. */
  Flat = 0,
  /** The color of surfaces is computed as normal, then scaled to a shade of the monochrome color based on the surface color's intensity.
   * For example, if the monochrome color is white, this results in a greyscale effect.
   * Geometry other than surfaces is treated the same as MonochromeMode.Flat.
   */
  Scaled = 1,
}

/** JSON representation of the display style settings */
export interface DisplayStyleSettingsProps {
  viewflags?: ViewFlagProps;
  backgroundColor?: RgbColorProps;
  monochromeColor?: RgbColorProps;
  monochromeMode?: MonochromeMode;
  renderTimeline?: string;
  /** The point in time reflected by the view, in UNIX seconds.
   * This identifies a point on the timeline of the style's RenderSchedule.Script, if any; it may also affect display of four-dimensional reality models.
   */
  timePoint?: number;
  // Original name: subCategoryOvr
  subCategoryOverrides?: DisplayStyleSubCategoryProps[];
  backgroundMap?: BackgroundMapProps;
  contextRealityModels?: ContextRealityModelProps[];
  excludedElements?: string[] | string;
  mapImagery?: MapImageryProps;
  // Original name: modelOvr
  modelOverrides?: DisplayStyleModelAppearanceProps[];
  clipStyle?: ClipStyleProps;
  // Original name: planarClipOvr
  planarClipOverrides?: DisplayStylePlanarClipMaskProps[];
}

/** JSON representation of settings associated with a DisplayStyle3dProps. */
export interface DisplayStyle3dSettingsProps extends DisplayStyleSettingsProps {
  environment?: EnvironmentProps;
  // Original name: ao
  ambientOcclusion?: AmbientOcclusionProps;
  solarShadows?: SolarShadowSettingsProps;
  lights?: LightSettingsProps;
  planProjections?: { [modelId: string]: PlanProjectionSettingsProps; };
}
