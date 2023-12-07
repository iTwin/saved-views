// Copyright (c) Bentley Systems, Incorporated. All rights reserved.
import {
  type ExtractionFunc,
  applyExtraction,
  extractArray,
  extractArrayConditionally,
  extractBoolean,
  extractColor,
  extractColorLegacy,
  extractConditionally,
  extractNumber,
  extractNumberOrBool,
  extractObject,
  extractPlainTypedMap,
  extractRGB,
  extractSimpleArray,
  extractString,
  extractStringOrArray,
  extractStringOrNumber,
  extractStringOrNumberArray,
  isAnyColorFormat,
  simpleTypeOf,
} from "./extractionUtilities";

import { type ViewState } from "@itwin/core-frontend";

import { type SavedView, type SavedView2d } from "../SavedViewTypes";
import { ViewITwin2d, ViewITwin3d } from "@itwin/saved-views-client";

const viewFlagMappings: ExtractionFunc<void, void>[] = [
  extractNumber("renderMode"),
  extractBoolean("noConstructions", "noConstruct"),
  extractBoolean("noDimensions", "noDim"),
  extractBoolean("noPattern"),
  extractBoolean("noWeight"),
  extractBoolean("noStyle"),
  extractBoolean("noTransparency", "noTransp"),
  extractBoolean("noFill"),
  extractBoolean("noTexture"),
  extractBoolean("noMaterial"),
  extractBoolean("visibleEdges", "visEdges"),
  extractBoolean("hiddenEdges", "hidEdges"),
  extractBoolean("shadows"),
  extractBoolean("clipVolume", "clipVol"),
  extractBoolean("monochrome"),
  extractBoolean("backgroundMap"),
  extractBoolean("ambientOcclusion"),
];

const viewFlagLegacyMappings: ExtractionFunc<void, void>[] = [
  extractNumber("renderMode"),
  extractBoolean("noConstruct", "noConstructions"),
  extractBoolean("noDim", "noDimensions"),
  extractBoolean("noPattern"),
  extractBoolean("noWeight"),
  extractBoolean("noStyle"),
  extractBoolean("noTransp", "noTransparency"),
  extractBoolean("noFill"),
  extractBoolean("noTexture"),
  extractBoolean("noMaterial"),
  extractBoolean("visEdges", "visibleEdges"),
  extractBoolean("hidEdges", "hiddenEdges"),
  extractBoolean("shadows"),
  extractBoolean("clipVol", "clipVolume"),
  extractBoolean("monochrome"),
  extractBoolean("backgroundMap"),
  extractBoolean("ambientOcclusion"),
];

const planarClipMaskMappings: ExtractionFunc<void, void>[] = [
  extractNumber("mode"),
  extractString("modelIds"),
  extractString("subCategoryOrElementIds"),
  extractNumber("priority"),
  extractNumber("transparency"),
  extractBoolean("invert"),
];

const displayStylePlanarClipMaskMappings: ExtractionFunc<void, void>[] = [
  ...planarClipMaskMappings,
  extractString("modelId"),
];

const backgroundMapMappings: ExtractionFunc<void, void>[] = [
  extractNumber("groundBias"),
  extractNumberOrBool("transparency"),
  extractBoolean("useDepthBuffer"),
  extractBoolean("applyTerrain"),
  extractObject(
    [
      extractString("providerName"),
      extractNumber("exaggeration"),
      extractBoolean("applyLighting"),
      extractNumber("heightOrigin"),
      extractNumber("heightOriginMode"),
    ],
    "terrainSettings"
  ),
  extractNumber("globeMode"),
  extractBoolean("nonLocatable"),
  extractObject(planarClipMaskMappings, "planarClipMask"),
];

const displayStyleSubCategoryMappings: ExtractionFunc<void, void>[] = [
  extractString("subCategory"),
  extractColor("color"),
  extractColor("fill"),
  extractBoolean("invisible"),
  extractNumber("weight"),
  extractString("style"),
  extractNumber("priority"),
  extractString("material"),
  extractNumber("transp", "transparency"),
  extractNumber("transpFill", "transparencyFill"),
];

export const featureAppearanceMappings: ExtractionFunc<void, void>[] = [
  extractRGB("rgb"),
  extractNumber("weight"),
  extractNumber("transparency"),
  extractNumber("linePixels"),
  extractBoolean("ignoresMaterial"),
  extractBoolean("nonLocatable"),
  extractBoolean("emphasized"),
];

export const featureAppearanceLegacyMappings: ExtractionFunc<void, void>[] = [
  extractColorLegacy("rgb"),
  extractNumber("weight"),
  extractNumber("transparency"),
  extractNumber("linePixels"),
  extractBoolean("ignoresMaterial"),
  extractBoolean("nonLocatable"),
  extractBoolean("emphasized"),
];

const displayStyleModelAppearanceMappings: ExtractionFunc<void, void>[] = [
  ...featureAppearanceMappings,
  extractString("modelId"),
];

const displayStyleModelAppearanceLegacyMappings: ExtractionFunc<void, void>[] =
  [...featureAppearanceLegacyMappings, extractString("modelId")];
const contextRealityModelsMappings: ExtractionFunc<void, void>[] = [
  extractObject(
    [
      extractString("provider"),
      extractString("format"),
      extractString("id"),
      extractString("iTwinId"),
    ],
    "rdSourceKey",
    "realityDataSourceKey"
  ),
  extractString("tilesetUrl"),
  extractString("realityDataId"),
  extractString("name"),
  extractString("description"),
  extractArray(
    [
      extractString("modelId"),
      extractNumber("expand"),
      extractObject(
        [
          extractNumber("inside"),
          extractNumber("outside"),
          extractBoolean("isVolumeClassifier"),
        ],
        "flags"
      ),
      extractString("name"),
      extractBoolean("isActive"),
    ],
    "classifiers"
  ),
  extractObject(planarClipMaskMappings, "planarClipMask"),
  extractObject(featureAppearanceMappings, "appearanceOverrides"),
];

const contextRealityModelsLegacyMappings: ExtractionFunc<void, void>[] = [
  extractObject(
    [
      extractString("provider"),
      extractString("format"),
      extractString("id"),
      extractString("iTwinId"),
    ],
    "rdSourceKey",
    "realityDataSourceKey"
  ),
  extractString("tilesetUrl"),
  extractString("realityDataId"),
  extractString("name"),
  extractString("description"),
  extractArray(
    [
      extractString("modelId"),
      extractNumber("expand"),
      extractObject(
        [
          extractNumber("inside"),
          extractNumber("outside"),
          extractBoolean("isVolumeClassifier"),
        ],
        "flags"
      ),
      extractString("name"),
      extractBoolean("isActive"),
    ],
    "classifiers"
  ),
  extractObject(planarClipMaskMappings, "planarClipMask"),
  extractObject(featureAppearanceLegacyMappings, "appearanceOverrides"),
];

const commonMapLayerPropsMapping: ExtractionFunc<void, void>[] = [
  extractBoolean("visible"),
  extractString("name"),
  extractNumber("transparency"),
  extractBoolean("transparentBackground"),
];

const mapSubLayerMappings: ExtractionFunc<void, void>[] = [
  extractString("name"),
  extractString("title"),
  extractBoolean("visible"),
  extractStringOrNumber("id"),
  extractStringOrNumber("parent"),
  extractStringOrNumberArray("children"),
];

const imageMapLayerPropsMapping: ExtractionFunc<void, void>[] = [
  ...commonMapLayerPropsMapping,
  extractString("url"),
  extractString("formatId"),
  extractArray(mapSubLayerMappings, "subLayers"),
];

const baseMapLayerPropsMapping: ExtractionFunc<void, void>[] = [
  ...imageMapLayerPropsMapping,
  extractObject([extractString("name"), extractNumber("type")], "provider"),
];

const modelMapLayerPropsMapping: ExtractionFunc<void, void>[] = [
  ...commonMapLayerPropsMapping,
  extractString("modelId"),
];

const mapImageryMapping: ExtractionFunc<void, void>[] = [
  extractConditionally(
    [
      {
        discriminator: isAnyColorFormat,
        mappings: extractColor,
      },
      {
        discriminator: "url",
        mappings: baseMapLayerPropsMapping,
      },
    ],
    "backgroundBase"
  ),
  extractArrayConditionally(
    [
      {
        discriminator: "modelId",
        mappings: modelMapLayerPropsMapping,
      },
      {
        discriminator: "url",
        mappings: imageMapLayerPropsMapping,
      },
    ],
    "backgroundLayers"
  ),
  extractArrayConditionally(
    [
      {
        discriminator: "modelId",
        mappings: modelMapLayerPropsMapping,
      },
      {
        discriminator: "url",
        mappings: imageMapLayerPropsMapping,
      },
    ],
    "overlayLayers"
  ),
];

const viewFlagOverridesMapping: ExtractionFunc<void, void>[] = [
  extractNumber("renderMode"),
  extractBoolean("dimensions"),
  extractBoolean("patterns"),
  extractBoolean("weights"),
  extractBoolean("styles"),
  extractBoolean("transparency"),
  extractBoolean("fill"),
  extractBoolean("textures"),
  extractBoolean("materials"),
  extractBoolean("acs"),
  extractBoolean("grid"),
  extractBoolean("visibleEdges"),
  extractBoolean("hiddenEdges"),
  extractBoolean("shadows"),
  extractBoolean("clipVolume"),
  extractBoolean("constructions"),
  extractBoolean("constructions"),
  extractBoolean("backgroundMap"),
  extractBoolean("ambientOcclusion"),
  extractBoolean("wiremesh"),
  extractBoolean("lighting"),
];

const hiddenLineStyleMappings: ExtractionFunc<void, void>[] = [
  extractBoolean("overrideColor", "ovrColor"),
  extractColor("color"),
  extractNumber("pattern"),
  extractNumber("width"),
];

const hiddenLineStyleLegacyMappings: ExtractionFunc<void, void>[] = [
  extractBoolean("ovrColor", "overrideColor"),
  extractColorLegacy("color"),
  extractNumber("pattern"),
  extractNumber("width"),
];

const hiddenLineSettingsMappings: ExtractionFunc<void, void>[] = [
  extractObject(hiddenLineStyleMappings, "visible"),
  extractObject(hiddenLineStyleMappings, "hidden"),
  extractNumber("transparencyThreshold", "transThreshold"),
];

const hiddenLineSettingsLegacyMappings: ExtractionFunc<void, void>[] = [
  extractObject(hiddenLineStyleLegacyMappings, "visible"),
  extractObject(hiddenLineStyleLegacyMappings, "hidden"),
  extractNumber("transThreshold", "transparencyThreshold"),
];

const cutStyleMappings: ExtractionFunc<void, void>[] = [
  extractObject(viewFlagOverridesMapping, "viewflags"),
  extractObject(hiddenLineSettingsMappings, "hiddenLine"),
  extractObject(featureAppearanceMappings, "appearance"),
];

const cutStyleLegacyMappings: ExtractionFunc<void, void>[] = [
  extractObject(viewFlagOverridesMapping, "viewflags"),
  extractObject(hiddenLineSettingsLegacyMappings, "hiddenLine"),
  extractObject(featureAppearanceLegacyMappings, "appearance"),
];

const clipStyleIntersectionMappings: ExtractionFunc<void, void>[] = [
  extractRGB("color"),
  extractNumber("width"),
];

const clipStyleIntersectionLegacyMappings: ExtractionFunc<void, void>[] = [
  extractColorLegacy("color"),
  extractNumber("width"),
];

const clipStyleMappings: ExtractionFunc<void, void>[] = [
  extractBoolean("produceCutGeometry"),
  extractObject(cutStyleMappings, "cutStyle"),
  extractRGB("insideColor"),
  extractRGB("outsideColor"),
  extractBoolean("colorizeIntersection"),
  extractObject(clipStyleIntersectionMappings, "intersectionStyle"),
];

const clipStyleLegacyMappings: ExtractionFunc<void, void>[] = [
  extractBoolean("produceCutGeometry"),
  extractObject(cutStyleLegacyMappings, "cutStyle"),
  extractColorLegacy("insideColor"),
  extractColorLegacy("outsideColor"),
  extractBoolean("colorizeIntersection"),
  extractObject(clipStyleIntersectionLegacyMappings, "intersectionStyle"),
];

const displayStylesMapping: ExtractionFunc<void, void>[] = [
  extractObject(viewFlagMappings, "viewflags"),
  extractColor("backgroundColor"),
  extractColor("monochromeColor"),
  extractNumber("monochromeMode"),
  extractString("renderTimeline"),
  extractNumber("timePoint"),
  extractArray(
    displayStyleSubCategoryMappings,
    "subCategoryOverrides",
    "subCategoryOvr"
  ),
  extractObject(backgroundMapMappings, "backgroundMap"),
  extractArray(contextRealityModelsMappings, "contextRealityModels"),
  extractStringOrArray("excludedElements"),
  extractObject(mapImageryMapping, "mapImagery"),
  extractArray(
    displayStyleModelAppearanceMappings,
    "modelOverrides",
    "modelOvr"
  ),
  extractObject(clipStyleMappings, "clipStyle"),
  extractArray(
    displayStylePlanarClipMaskMappings,
    "planarClipOverrides",
    "planarClipOvr"
  ),
];

const displayStylesLegacyMapping: ExtractionFunc<void, void>[] = [
  extractObject(viewFlagLegacyMappings, "viewflags"),
  extractColorLegacy("backgroundColor"),
  extractColorLegacy("monochromeColor"),
  extractNumber("monochromeMode"),
  extractString("renderTimeline"),
  extractNumber("timePoint"),
  extractArray(
    displayStyleSubCategoryMappings,
    "subCategoryOvr",
    "subCategoryOverrides"
  ),
  extractObject(backgroundMapMappings, "backgroundMap"),
  extractArray(contextRealityModelsLegacyMappings, "contextRealityModels"),
  extractStringOrArray("excludedElements"),
  extractObject(mapImageryMapping, "mapImagery"),
  extractArray(
    displayStyleModelAppearanceLegacyMappings,
    "modelOvr",
    "modelOverrides"
  ),
  extractObject(clipStyleLegacyMappings, "clipStyle"),
  extractArray(
    displayStylePlanarClipMaskMappings,
    "planarClipOvr",
    "planarClipOverrides"
  ),
];

const environmentMappings: ExtractionFunc<void, void>[] = [
  extractObject(
    [
      extractBoolean("display"),
      extractNumber("elevation"),
      extractColor("aboveColor"),
      extractColor("belowColor"),
    ],
    "ground"
  ),
  extractObject(
    [
      extractBoolean("display"),
      extractBoolean("twoColor"),
      extractColor("skyColor"),
      extractColor("groundColor"),
      extractColor("zenithColor"),
      extractColor("nadirColor"),
      extractNumber("skyExponent"),
      extractNumber("groundExponent"),
      extractObject(
        [
          extractNumber("type"),
          extractString("texture"),
          extractObject(
            [
              extractString("front"),
              extractString("back"),
              extractString("top"),
              extractString("bottom"),
              extractString("right"),
              extractString("left"),
            ],
            "textures"
          ),
        ],
        "image"
      ),
    ],
    "sky"
  ),
];

const environmentLegacyMappings: ExtractionFunc<void, void>[] = [
  extractObject(
    [
      extractBoolean("display"),
      extractNumber("elevation"),
      extractColorLegacy("aboveColor"),
      extractColorLegacy("belowColor"),
    ],
    "ground"
  ),
  extractObject(
    [
      extractBoolean("display"),
      extractBoolean("twoColor"),
      extractColorLegacy("skyColor"),
      extractColorLegacy("groundColor"),
      extractColorLegacy("zenithColor"),
      extractColorLegacy("nadirColor"),
      extractNumber("skyExponent"),
      extractNumber("groundExponent"),
      extractObject(
        [
          extractNumber("type"),
          extractString("texture"),
          extractObject(
            [
              extractString("front"),
              extractString("back"),
              extractString("top"),
              extractString("bottom"),
              extractString("right"),
              extractString("left"),
            ],
            "textures"
          ),
        ],
        "image"
      ),
    ],
    "sky"
  ),
];

const ambientOcclusionMappings: ExtractionFunc<void, void>[] = [
  extractNumber("bias"),
  extractNumber("zLengthCap"),
  extractNumber("maxDistance"),
  extractNumber("intensity"),
  extractNumber("texelStepSize"),
  extractNumber("blurDelta"),
  extractNumber("blurSigma"),
  extractNumber("blurTexelStepSize"),
];

const solarShadowMappings: ExtractionFunc<void, void>[] = [
  extractColor("color"),
];

const lightsMappings: ExtractionFunc<void, void>[] = [
  extractObject([extractNumber("intensity")], "portrait"),
  extractObject(
    [
      extractNumber("intensity"),
      extractSimpleArray(simpleTypeOf("number"), "direction"),
      extractBoolean("alwaysEnabled"),
      extractNumber("timePoint"),
    ],
    "solar"
  ),
  extractObject(
    [
      extractColor("upperColor"),
      extractColor("lowerColor"),
      extractNumber("intensity"),
    ],
    "hemisphere"
  ),
  extractObject([extractColor("color"), extractNumber("intensity")], "ambient"),
  extractNumber("specularIntensity"),
  extractNumber("numCels"),
  extractObject(
    [extractNumber("intensity"), extractBoolean("invert")],
    "fresnel"
  ),
];

const planProjectionSettingsMappings: ExtractionFunc<void, void>[] = [
  extractNumber("elevation"),
  extractNumber("transparency"),
  extractBoolean("overlay"),
  extractBoolean("enforceDisplayPriority"),
];

const displayStyle3dMapping: ExtractionFunc<void, void>[] = [
  ...displayStylesMapping,
  extractObject(environmentMappings, "environment"),
  extractObject(ambientOcclusionMappings, "ambientOcclusion", "ao"),
  extractObject(solarShadowMappings, "solarShadows"),
  extractObject(lightsMappings, "lights"),
  extractPlainTypedMap(
    planProjectionSettingsMappings,
    simpleTypeOf("string"),
    "planProjections"
  ),
];

const displayStyle3dLegacyMapping: ExtractionFunc<void, void>[] = [
  ...displayStylesLegacyMapping,
  extractObject(environmentLegacyMappings, "environment"),
  extractObject(ambientOcclusionMappings, "ambientOcclusion", "ao"),
  extractObject(solarShadowMappings, "solarShadows"),
  extractObject(lightsMappings, "lights"),
  extractPlainTypedMap(
    planProjectionSettingsMappings,
    simpleTypeOf("string"),
    "planProjections"
  ),
];

/**
 * Extracts the display style from a PSS view displayStyle field
 * And transforms it into our schema
 * @param data
 * @param viewState
 */
export const extractDisplayStyle = (data: object, viewState?: ViewState) => {
  let styles;
  const output: any = {};
  if ("displayStyle" in data) {
    styles = (data as ViewITwin2d).displayStyle;
    applyExtraction(styles, output, displayStylesMapping);
  }
  if ("displayStyleProps" in data) {
    styles = (data as SavedView2d).displayStyleProps.jsonProperties?.styles;
    applyExtraction(styles, output, displayStylesLegacyMapping);
  }
  if (styles === undefined) {
    return undefined;
  }
  if (viewState) {
    appendAcsAndGridViewFlagsToOutput(viewState, output);
  }
  return output;
};

/**
 * Extracts the display style 3d from a PSS view displayStyle field
 * And transforms it into our schema
 * @param data
 */
export const extractDisplayStyle3d = (data: object) => {
  let styles;
  const output: any = {};
  if ("displayStyle" in data) {
    styles = (data as ViewITwin3d).displayStyle;
    applyExtraction(styles, output, displayStyle3dMapping);
  }
  if ("displayStyleProps" in data) {
    styles = (data as SavedView).displayStyleProps.jsonProperties?.styles;
    applyExtraction(styles, output, displayStyle3dLegacyMapping);
  }
  if (styles === undefined) {
    return undefined;
  }

  return output;
};

function appendAcsAndGridViewFlagsToOutput(
  drawingViewState: ViewState,
  output: any
) {
  output.viewflags.acs = false;
  output.viewflags.grid = true;
  if (drawingViewState.auxiliaryCoordinateSystem) {
    output.viewflags.acs = true;
  }
  const gridOrient = drawingViewState.getGridOrientation();
  const gridSpacing = drawingViewState.getGridOrientation();
  const gridPerRef = drawingViewState.getGridsPerRef();
  if (!gridOrient || !gridSpacing || !gridPerRef) {
    output.viewflags.grid = false;
  }
}
