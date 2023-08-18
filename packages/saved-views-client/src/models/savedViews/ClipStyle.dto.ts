// Copyright (c) Bentley Systems, Incorporated. All rights reserved.
import { LinePixels, FeatureAppearanceProps } from "./FeatureAppearance.dto";
import { RgbColorProps } from "./RgbColor.dto";
import { ViewFlagOverrides } from "./ViewFlags.dto";

export interface HiddenLineStyleProps {
  /**
   * This JSON representation is awkward, but it must match that used in the db.
   * If the JSON came from the db then all members are present and:
   *  - color is overridden only if overrideColor = true.
   *  - width is overridden only if width != 0
   *  - pattern is overridden only if pattern != LinePixels.Invalid
   * The 'public' JSON representation is more sensible:
   *  - Color, width, and pattern are each overridden iff they are not undefined.
   * To make this work for both scenarios, the rules are:
   *  - color is overridden if color != undefined and overrideColor != false
   *  - width is overridden if width != undefined and width != 0
   *  - pattern is overridden if pattern != undefined and pattern != LinePixels.Invalid
   */
  // Original name: ovrColor
  overrideColor?: boolean;
  color?: RgbColorProps;
  pattern?: LinePixels;
  /** If defined, the width of the edges in pixels. If undefined (or 0), edges are drawn using the element's line width.
   */
  width?: number;
}

export interface HiddenLineSettingsProps {
  visible?: HiddenLineStyleProps;
  hidden?: HiddenLineStyleProps;
  // Original name: transThreshold
  transparencyThreshold?: number;
}

/**
 * Wire format describing a CutStyle applied to section-cut geometry produced at intersections with a view's ClipVector.
 */
export interface CutStyleProps {
  viewflags?: ViewFlagOverrides;
  hiddenLine?: HiddenLineSettingsProps;
  appearance?: FeatureAppearanceProps;
}

/**
 * Wire format describing a ClipStyle.
 */
export interface ClipStyleProps {
  produceCutGeometry?: boolean;
  cutStyle?: CutStyleProps;
  insideColor?: RgbColorProps;
  outsideColor?: RgbColorProps;
}
