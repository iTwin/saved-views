/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { RgbColorProps } from "./RgbColor.dto";

/** Supported types of SkyBox images. */
export enum SkyBoxImageType {
  /** No image, indicating a SkyGradient should be displayed. */
  None = 0,
  /** A single image mapped to the surface of a sphere.
   */
  Spherical = 1,
  /** Six images mapped to the faces of a cube.
   */
  Cube = 3,
}

/**
 * JSON representation of the six images used by a SkyCube.
 * Each property specifies the image for a face of the cube as either an image URL, or the Id of a Texture element.
 * Each image must be square and have the same dimensions as all the other images.
 */
export interface SkyCubeProps {
  front: string;
  back: string;
  top: string;
  bottom: string;
  right: string;
  left: string;
}

/** JSON representation of the image used for a SkySphere. */
export interface SkySphereImageProps {
  type: SkyBoxImageType.Spherical;
  texture: string;
}

/** JSON representation of the images used for a SkyCube. */
export interface SkyCubeImageProps {
  type: SkyBoxImageType.Cube;
  textures: SkyCubeProps;
}

export interface SkyBoxImageProps {
  texture?: string;
  textures?: SkyCubeProps;
}

/** JSON representation of a SkyBox that can be drawn as the background of a ViewState3d.
 * An object of this type can describe one of several types of sky box:
 *  - A cube with a texture image mapped to each face; or
 *  - A sphere with a single texture image mapped to its surface; or
 *  - A sphere with a two- or four-color vertical Gradient mapped to its surface.
 *
 * Whether cuboid or spherical, the skybox is drawn as if the viewer and the contents of the view are contained within its interior.
 *
 * For a two-color gradient, the gradient transitions smoothly from the nadir color at the bottom of the sphere to the zenith color at the top of the sphere.
 * The sky and ground colors are unused, as are the sky and ground exponents.
 *
 * smoothly from the ground color at the equator to the nadir color at the bottom, and the upper half transitions from the sky color at the equator to the zenith color at
 * the top of the sphere.
 *
 * The color and exponent properties are unused if one or more texture images are supplied.
 */
export interface SkyBoxProps {
  display?: boolean;
  twoColor?: boolean;
  skyColor?: RgbColorProps;
  groundColor?: RgbColorProps;
  zenithColor?: RgbColorProps;
  nadirColor?: RgbColorProps;
  skyExponent?: number;
  groundExponent?: number;
  /**
   * The image(s), if any, to be mapped to the surfaces of the sphere or cube.
   * If undefined, the skybox will be displayed as a gradient instead.
   */
  image?: SkyBoxImageProps;
}

/** JSON representation of a GroundPlane. */
export interface GroundPlaneProps {
  display?: boolean;
  elevation?: number;
  aboveColor?: RgbColorProps;
  belowColor?: RgbColorProps;
}

/** JSON representation of an Environment. */
export interface EnvironmentProps {
  ground?: GroundPlaneProps;
  sky?: SkyBoxProps;
}
