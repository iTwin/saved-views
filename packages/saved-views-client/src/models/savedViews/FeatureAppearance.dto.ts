/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { RgbColorProps } from "./RgbColor.dto";

/** Enumerates the available patterns for drawing patterned lines.
 * Each is a 32-bit pattern in which each bit specifies the on- or off-state of a pixel along the line. The pattern repeats along the length of the entire line.
 */
export enum LinePixels {
  /** A solid line. */
  Solid = 0,
  /** A solid line. */
  Code0 = Solid,
  /** 1 lit pixel followed by 7 unlit pixels: =       =       = */
  Code1 = 0x80808080,
  /** 5 lit pixels followed by 3 unlit pixels: =====   =====   ===== */
  Code2 = 0xf8f8f8f8,
  /** 11 lit pixels followed by 5 unlit pixels: ===========     =========== */
  Code3 = 0xffe0ffe0,
  /** 7 lit pixels followed by 4 unlit pixels followed by 1 lit pixel followed by 1 lit pixel: =======    =    =======    =*/
  Code4 = 0xfe10fe10,
  /** 3 lit pixels followed by 5 unlit pixels: ===     ===     === */
  Code5 = 0xe0e0e0e0,
  /** 5 lit pixels followed by 3 unlit followed by 1 lit followed by 3 unlit followed by 1 lit followed by 3 unlit: =====   =   =   ===== */
  Code6 = 0xf888f888,
  /** 8 lit pixels followed by 3 unlit followed by 2 lit followed by 3 unlit: ========   ==   ======== */
  Code7 = 0xff18ff18,
  /** 2 lit pixels followed by 2 unlit pixels - default style for drawing hidden edges: ==  ==  ==  == */
  HiddenLine = 0xcccccccc,
  /** Barely visible - 1 lit pixel followed by 31 unlit pixels. */
  Invisible = 0x00000001,
  /** Indicates no valid line style or none specified, depending on context. */
  Invalid = -1,
}

/**
 * Properties used to initialize a Feature Appearance
 */
export interface FeatureAppearanceProps {
  rgb?: RgbColorProps;
  weight?: number;
  transparency?: number;
  linePixels?: LinePixels;
  ignoresMaterial?: true | undefined;
  nonLocatable?: true | undefined;
  emphasized?: true | undefined;
}

/**
 * A FeatureAppearanceProps applied to a specific model to override its appearance within the context of a DisplayStyle.
 */
export interface DisplayStyleModelAppearanceProps
  extends FeatureAppearanceProps {
  modelId?: string;
}
