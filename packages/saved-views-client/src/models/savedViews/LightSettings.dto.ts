/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { RgbColorProps } from "./RgbColor.dto";

/** JSON representation of SolarShadowSettings.
 */
export interface SolarShadowSettingsProps {
  color?: RgbColorProps;
}

/** Wire format for the solar directional light associated with a LightSettingsProps.
 * The light is colored white and oriented in any direction in world coordinates.
 * It will cast shadows if it is above the world XY plane and if the shadows view flag is enabled for the view.
 * By default, the solar light is only applied when shadows are enabled, but can be set to be applied unconditionally.
 */
export interface SolarLightProps {
  intensity?: number;
  direction?: [x: number, y: number, z: number];
  alwaysEnabled?: boolean;
  timePoint?: number;
}

/** Wire format for a pair of hemisphere lights associated with a LightSettingsProps.
 * Hemisphere lights are oriented in opposite directions along the world Z axis. Each has its own color; they share one intensity.
 * They are often used to simulate outdoor reflection of light from the ground and sky, so the colors often match the ground and sky colors
 * of the SkyBox.
 */
export interface HemisphereLightsProps {
  upperColor?: RgbColorProps;
  lowerColor?: RgbColorProps;
  intensity?: number;
}

/** Wire format for the ambient light associated with a LightSettingsProps.
 * Ambient light applies equally to all surfaces in the scene.
 */
export interface AmbientLightProps {
  color?: RgbColorProps;
  intensity?: number;
}

/** JSON representation of a FresnelSettings.
 */
export interface FresnelSettingsProps {
  intensity?: number;
  invert?: boolean;
}

export interface PortraitProps {
  intensity?: number;
}

/** Wire format for a LightSettings describing lighting for a 3d scene.
 * 3d lighting provides the following lights, all of which are optional:
 *  - A second directional light. Color: white.
 *    - This can be a solar shadow-casting light, or (when shadows are disabled) a roughly overhead light oriented in view space.
 *  - A pair of hemisphere lights pointing in opposite directions along the world Z axis. Each has its own customizable color.
 *  - An ambient light of any color applied equally to all surfaces.
 * Specular intensity of all lights is controlled separately.
 */
export interface LightSettingsProps {
  /** A white portrait light affixed to the camera and pointing directly forward into the scene. */
  portrait?: PortraitProps;
  solar?: SolarLightProps;
  hemisphere?: HemisphereLightsProps;
  ambient?: AmbientLightProps;
  specularIntensity?: number;
  numCels?: number;
  fresnel?: FresnelSettingsProps;
}
