/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

/** JSON representation of an RGB color, with each component in the range [0, 255]. */
export interface RgbColorProps {
  red: number;
  green: number;
  blue: number;
}

/**
 * Enumerates the available basic rendering modes, as part of a DisplayStyle's ViewFlags. The rendering mode broadly
 * affects various aspects of the display style - in particular, whether and how surfaces and their edges are drawn.
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

/** Another view flag representation that sadly is used in display style props for overriding */
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
  /** If true, overlay surfaces with wiremesh to reveal their triangulation. */
  wiremesh?: boolean;
  /** In RenderMode.SmoothShade, whether to apply lighting to surfaces. */
  lighting?: boolean;
}

/** JSON representation of ViewFlags */
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

export interface SubCategoryAppearanceProps {
  color?: RgbColorProps;
  fill?: RgbColorProps;
  invisible?: boolean;
  weight?: number;
  style?: string;
  priority?: number;
  material?: string;
  // Original name: transp
  transparency?: number;
  // Original name: transpFill
  transparencyFill?: number;
}

/** Describes the SubCategoryOverrides applied to a SubCategory by a DisplayStyle. */
export interface DisplayStyleSubCategoryProps
  extends SubCategoryAppearanceProps {
  /** The Id of the SubCategory whose appearance is to be overridden. */
  subCategory?: string;
}

/** Wire format describing PlanProjectionSettings. */
export interface PlanProjectionSettingsProps {
  elevation?: number;
  transparency?: number;
  overlay?: boolean;
  /** If defined and true, subcategory display priority is used to specify the draw order of portions of the model. Geometry belonging to a subcategory with a higher priority
   * value is drawn on top of coincident geometry belonging to a subcategory with a lower priority value. The priorities can be modified at display time using
   * are drawn as part of the same layer.
   */
  enforceDisplayPriority?: boolean;
}

/** The different modes by which a PlanarClipMaskSettings collects the geometry used to mask a model. */
export enum PlanarClipMaskMode {
  /** No masking. */
  None = 0,
  /** Mask based on priority. Different types of models have different default priorities as enumerated by PlanarClipMaskPriority.
   * For example, background maps have the lowest priority, so they are masked by all other types, while design models have the highest priority and are therefore never masked.
   * The priority of a reality model can be overridden by PlanarClipMaskSettings.priority. This is useful to allow one reality model to mask another overlapping one.
   */
  Priority = 1,
  /** Indicates that masks should be produced from the geometry in a set of GeometricModel. */
  Models = 2,
  /** Indicates that masks should be produced from geometry belonging to a set of subcategories. */
  IncludeSubCategories = 3,
  /** Indicates that masks should be produced from the geometry of a set of GeometricElements. */
  IncludeElements = 4,
  /** Indicates that masks should be produced from the geometry of all GeometricElements in a view, **except** for a specified set of excluded elements. */
  ExcludeElements = 5,
}

/**
 * The default priority values for a PlanarClipMaskSettings, based on model type. Models with a lower priority are masked by models with a higher priority.
 * The default can be overridden by PlanarClipMaskSettings.priority.
 */
export enum PlanarClipMaskPriority {
  /** Background map. */
  BackgroundMap = -2048,
  /** A reality model that spans the globe - e.g., OpenStreetMaps Buildings. */
  GlobalRealityModel = -1024,
  /** A reality model with a bounded range. */
  RealityModel = 0,
  /** A design model stored in the IModelDb. */
  DesignModel = 2048,
}

/** JSON representation of a PlanarClipMaskSettings. */
export interface PlanarClipMaskProps {
  /** Controls how the mask geometry is collected */
  mode: PlanarClipMaskMode;
  modelIds?: string;
  subCategoryOrElementIds?: string;
  priority?: PlanarClipMaskPriority;
  transparency?: number;
  invert?: boolean;
}

/** A PlanarClipMaskProps associated with a specific reality model. */
export interface DisplayStylePlanarClipMaskProps extends PlanarClipMaskProps {
  modelId?: string;
}

/**
 * JSON representation of the settings associated with a map sublayer included within a MapLayerProps.
 * A map sub layer represents a set of objects within the layer that can be controlled separately.  These
 * are produced only from map servers that produce images on demand and are not supported by tiled (cached) servers.
 */
export interface MapSubLayerProps {
  name: string;
  title?: string;
  visible?: boolean;
  id?: string | number;
  parent?: string | number;
  children?: (string | number)[];
}

/** JSON representation of properties common to both ImageMapLayerProps and ModelMapLayerProps. */
export interface CommonMapLayerProps {
  visible?: boolean;
  name: string;
  transparency?: number;
  /** True to indicate background is transparent.
   */
  transparentBackground?: boolean;
}

/** JSON representation of an ImageMapLayerSettings. */
export interface ImageMapLayerProps extends CommonMapLayerProps {
  url: string;
  formatId: string;
  subLayers?: MapSubLayerProps[];
}

/** Enumerates the types of map imagery that can be supplied by a BackgroundMapProvider. */
export enum BackgroundMapType {
  Street = 1,
  Aerial = 2,
  Hybrid = 3,
}

/** JSON representation of a BackgroundMapProvider. */
export interface BackgroundMapProviderProps {
  name?: string;
  type?: BackgroundMapType;
}

/** JSON representation of a BaseMapLayerSettings. */
export interface BaseMapLayerProps extends ImageMapLayerProps {
  provider?: BackgroundMapProviderProps;
}

/** JSON representation of a ModelMapLayerSettings. */
export interface ModelMapLayerProps extends CommonMapLayerProps {
  modelId: string;
}

/** The JSON representation of the map imagery.  Map imagery include the specification for the base layer (which was originally
 * represented by BackgroundMapProps.providerName  && BackgroundMapProps.providerData) and additional map layers.
 * In earlier versions only a background map was supported as specified by the providerName and mapType members of BackgroundMapSettings object.
 * In order to provide backward compatibility the original BackgroundMapSettings are synchronized with the MapImagerySettings base layer as long as
 * the settings are compatible.
 * The non-base map layers may represent image layers generated by tile servers or model layers that are generated by 2d projection of model geomety, typically from a model
 * that is generated from two dimensional GIS data.
 */
export interface MapImageryProps {
  backgroundBase?: BaseMapLayerProps | RgbColorProps;
  backgroundLayers?: (ImageMapLayerProps | ModelMapLayerProps)[];
  overlayLayers?: (ImageMapLayerProps | ModelMapLayerProps)[];
}

/** JSON representation of SolarShadowSettings. */
export interface SolarShadowSettingsProps {
  color?: RgbColorProps;
}

/**
 * Wire format for the solar directional light associated with a LightSettingsProps.
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

/**
 * Wire format for a pair of hemisphere lights associated with a LightSettingsProps.
 * Hemisphere lights are oriented in opposite directions along the world Z axis. Each has its own color; they share one intensity.
 * They are often used to simulate outdoor reflection of light from the ground and sky, so the colors often match the ground and sky colors
 * of the SkyBox.
 */
export interface HemisphereLightsProps {
  upperColor?: RgbColorProps;
  lowerColor?: RgbColorProps;
  intensity?: number;
}

/**
 * Wire format for the ambient light associated with a LightSettingsProps.
 * Ambient light applies equally to all surfaces in the scene.
 */
export interface AmbientLightProps {
  color?: RgbColorProps;
  intensity?: number;
}

/** JSON representation of a FresnelSettings. */
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

/**
 * Enumerates the available patterns for drawing patterned lines.
 * Each is a 32-bit pattern in which each bit specifies the on- or off-state of a pixel along the line.
 * The pattern repeats along the length of the entire line.
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

/** Properties used to initialize a Feature Appearance */
export interface FeatureAppearanceProps {
  rgb?: RgbColorProps;
  weight?: number;
  transparency?: number;
  linePixels?: LinePixels;
  ignoresMaterial?: true | undefined;
  nonLocatable?: true | undefined;
  emphasized?: true | undefined;
}

/** A FeatureAppearanceProps applied to a specific model to override its appearance within the context of a DisplayStyle. */
export interface DisplayStyleModelAppearanceProps
  extends FeatureAppearanceProps {
  modelId?: string;
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


export interface HiddenLineStyleProps {
  /** This JSON representation is awkward, but it must match that used in the db.
   * If the JSON came from the db then all members are present and:
   *  - color is overridden only if overrideColor = true.
   *  - width is overridden only if width != 0
   *  - pattern is overridden only if pattern != LinePixels.Invalid
   * The 'public' JSON representation is more sensible:
   *  - Color, width, and pattern are each overridden iff they are not undefined.
   * To make this work for both scenarios, the rules are:
   *  - color is overridden if color != undefined and overrideColor != false
   *  - width is overridden if width != undefined and width != 0
   *  - pattern is overridden if pattern != undefined and pattern != LinePixels.Invalid */
  overrideColor?: boolean;
  color?: RgbColorProps;
  pattern?: LinePixels;
  /** If defined, the width of the edges in pixels.
   * If undefined (or 0), edges are drawn using the element's line width. */
  width?: number;
}

/** Describes the settings for hidden lines. */
export interface HiddenLineSettingsProps {
  visible?: HiddenLineStyleProps;
  hidden?: HiddenLineStyleProps;
  /** Original name: transThreshold */
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

/** Wire format describing a ClipStyle. */
export interface ClipStyleProps {
  produceCutGeometry?: boolean;
  cutStyle?: CutStyleProps;
  insideColor?: RgbColorProps;
  outsideColor?: RgbColorProps;
}


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

/** Describes the projection of the background map. */
export enum GlobeMode {
  /** Display Earth as a 3D ellipsoid. */
  Ellipsoid = 0,
  /** Display Earth as a plane. */
  Plane = 1,
}

/** In-memory JSON representation of BackgroundMapSettings. */
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


export interface AmbientOcclusionProps {
  bias?: number;
  zLengthCap?: number;
  maxDistance?: number;
  intensity?: number;
  texelStepSize?: number;
  blurDelta?: number;
  blurSigma?: number;
  blurTexelStepSize?: number;
}

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
