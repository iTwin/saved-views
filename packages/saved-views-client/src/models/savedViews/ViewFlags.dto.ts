// Copyright (c) Bentley Systems, Incorporated. All rights reserved.

/** Enumerates the available basic rendering modes, as part of a DisplayStyle's ViewFlags.
 * The rendering mode broadly affects various aspects of the display style - in particular, whether and how surfaces and their edges are drawn.
 */
export enum RenderMode {
  /** Renders only the edges of surfaces, with exceptions for planar regions based on their FillFlags.
   * Lighting (and by extension, shadows) is not applied.
   * HiddenLine.Settings are not applied - edges use the elements' width, style, and color.
   * ViewFlags.hiddenEdges is ignored - hidden edges are never displayed in wireframe mode.
   */
  Wireframe = 0,
  /** By default, renders surfaces without their edges.
   * Lighting and shadows can be applied using ViewFlags.lighting and ViewFlags.shadows.
   * Edges can be enabled using ViewFlags.visibleEdges and ViewFlags.hiddenEdges, and their appearance customized using HiddenLine.Settings.
   * Surfaces can be drawn with transparency, based on ViewFlags.transparency.
   */
  SmoothShade = 6,
  /** Renders surfaces and their edges. By default, edges are drawn in white; this can be overridden using HiddenLine.Settings.
   * All surfaces are rendered opaque. If a surface's transparency is below that specified by HiddenLine.Settings.transparencyThreshold, it is not rendered.
   * Materials and textures are not applied - surfaces are drawn in their actual colors.
   * ViewFlags.visibleEdges is ignored - visible edges are always drawn. Hidden edges can be enabled using ViewFlags.hiddenEdges.
   * Lighting (and by extension, shadows) is not applied.
   */
  SolidFill = 4,
  /** Identical to RenderMode.SolidFill, except:
   *  - Surfaces are drawn using the DisplayStyle's background color.
   *  - Edges are drawn using their surface's colors; this can be overridden using HiddenLine.Settings.
   */
  HiddenLine = 3,
}

/**
 * Another view flag representation that sadly is used in display style props for overriding
 */
export interface ViewFlagOverrides {
  renderMode?: RenderMode;
  dimensions?: boolean;
  patterns?: boolean;
  weights?: boolean;
  styles?: boolean;
  transparency?: boolean;
  fill?: boolean;
  textures?: boolean;
  materials?: boolean;
  acsTriad?: boolean;
  grid?: boolean;
  visibleEdges?: boolean;
  hiddenEdges?: boolean;
  shadows?: boolean;
  clipVolume?: boolean;
  constructions?: boolean;
  monochrome?: boolean;
  backgroundMap?: boolean;
  ambientOcclusion?: boolean;
  /** If true, overlay surfaces with wiremesh to reveal their triangulation.
   */
  wiremesh?: boolean;
  /** In RenderMode.SmoothShade, whether to apply lighting to surfaces.
   */
  lighting?: boolean;
}

/**
 * JSON representation of ViewFlags
 */
export interface ViewFlagProps {
  // Original name: noConstruct
  noConstructions?: boolean;
  // Original name: noDim
  noDimensions?: boolean;
  noPattern?: boolean;
  noWeight?: boolean;
  noStyle?: boolean;
  // Original name: noTransp
  noTransparency?: boolean;
  noFill?: boolean;
  noTexture?: boolean;
  noMaterial?: boolean;
  // Original name: visEdges
  visibleEdges?: boolean;
  // Original name: hidEdges
  hiddenEdges?: boolean;
  shadows?: boolean;
  // Original name: clipVol
  clipVolume?: boolean;
  // Original name: hlMatColors
  hiddenLineMaterialColors?: boolean;
  monochrome?: boolean;
  renderMode?: RenderMode;
  backgroundMap?: boolean;
  ambientOcclusion?: boolean;
}
