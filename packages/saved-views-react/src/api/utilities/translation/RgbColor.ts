/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
/**
 * JSON representation of an Rgb Color, with each component in the range [0, 255]
 */
export interface RgbColorProps {
  red: number;
  green: number;
  blue: number;
}

/**
 * JSON representation of a color that contains an alpha channel, with each component in the range [0, 255]
 */
export interface RgbaColorProps extends RgbColorProps {
  alpha?: number;
}

/**
 * JSON representation of a color that contains an alpha channel and transparency, with each component in the range [0, 255]
 */
export interface RgbatColorProps extends RgbaColorProps {
  transparency?: number;
}

/**
 * JSON representation of a color with each component in the range [0, 255]
 */
export interface Rgba {
  r: number;
  g: number;
  b: number;
  a?: number;
}
