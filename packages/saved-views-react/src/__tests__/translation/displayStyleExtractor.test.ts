/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @itwin/core-common
vi.mock("@itwin/core-common", () => ({
  ColorDef: {
    isValidColor: (value: unknown) => {
      return typeof value === "number" && value >= 0 && value <= 0xffffffff;
    },
  },
}));

vi.mock("@itwin/core-frontend", () => ({
  IModelApp: {},
}));

import {
  extractDisplayStyle,
  extractDisplayStyle3d,
  extractDisplayStyle2dFromLegacy,
  extractDisplayStyle3dFromLegacy,
  featureAppearanceMappings,
  featureAppearanceLegacyMappings,
} from "../../translation/displayStyleExtractor.js";

// ============================================================================
// Test fixtures
// ============================================================================

const create3dDisplayStyle = () => ({
  viewflags: {
    renderMode: 6,
    noConstructions: true,
    shadows: true,
    visibleEdges: false,
    monochrome: false,
  },
  backgroundColor: { red: 255, green: 255, blue: 255 },
  monochromeColor: { red: 128, green: 128, blue: 128 },
  monochromeMode: 0,
  subCategoryOverrides: [
    {
      subCategory: "0x123",
      color: { red: 255, green: 0, blue: 0 },
      invisible: false,
      weight: 2,
    },
  ],
  contextRealityModels: [
    {
      tilesetUrl: "https://example.com/tileset.json",
      name: "Test Reality Model",
      description: "A test reality model",
    },
  ],
  environment: {
    ground: {
      display: true,
      elevation: 0,
      aboveColor: { red: 200, green: 200, blue: 200 },
      belowColor: { red: 100, green: 100, blue: 100 },
    },
    sky: {
      display: true,
      twoColor: false,
      skyColor: { red: 135, green: 206, blue: 235 },
      groundColor: { red: 100, green: 100, blue: 100 },
    },
  },
  ambientOcclusion: {
    bias: 0.25,
    zLengthCap: 0.0025,
    maxDistance: 100,
    intensity: 1.0,
  },
  solarShadows: {
    color: { red: 128, green: 128, blue: 128 },
  },
  lights: {
    portrait: { intensity: 0.3 },
    solar: { intensity: 1.0, direction: [0, 0, -1] },
    hemisphere: {
      upperColor: { red: 255, green: 255, blue: 255 },
      lowerColor: { red: 200, green: 200, blue: 200 },
      intensity: 0.5,
    },
    ambient: {
      color: { red: 255, green: 255, blue: 255 },
      intensity: 0.2,
    },
  },
});

const create2dDisplayStyle = () => ({
  viewflags: {
    renderMode: 4,
    noConstructions: false,
    noWeight: false,
    noStyle: false,
    monochrome: false,
  },
  backgroundColor: { red: 255, green: 255, blue: 255 },
  subCategoryOverrides: [
    {
      subCategory: "0x456",
      invisible: false,
    },
  ],
});

const createLegacy3dDisplayStyleProps = () => ({
  jsonProperties: {
    styles: {
      viewflags: {
        renderMode: 6,
        noConstruct: true,
        shadows: true,
        visEdges: false,
        monochrome: false,
      },
      backgroundColor: { red: 255, green: 255, blue: 255 },
      monochromeColor: { red: 128, green: 128, blue: 128 },
      monochromeMode: 0,
      subCategoryOvr: [
        {
          subCategory: "0x123",
          color: { red: 255, green: 0, blue: 0 },
          invisible: false,
          weight: 2,
        },
      ],
      contextRealityModels: [
        {
          tilesetUrl: "https://example.com/tileset.json",
          name: "Test Reality Model",
        },
      ],
      environment: {
        ground: {
          display: true,
          elevation: 0,
          aboveColor: { red: 200, green: 200, blue: 200 },
          belowColor: { red: 100, green: 100, blue: 100 },
        },
        sky: {
          display: true,
          twoColor: false,
          skyColor: { red: 135, green: 206, blue: 235 },
        },
      },
      ao: {
        bias: 0.25,
        zLengthCap: 0.0025,
        intensity: 1.0,
      },
      solarShadows: {
        color: { red: 128, green: 128, blue: 128 },
      },
      hline: {
        visible: { ovrColor: true, color: { red: 0, green: 0, blue: 0 } },
        transThreshold: 0.5,
      },
    },
  },
});

const createMockViewState = (options?: {
  hasAcs?: boolean;
  hasGrid?: boolean;
}) => ({
  auxiliaryCoordinateSystem: options?.hasAcs ? {} : undefined,
  getGridOrientation: () => (options?.hasGrid !== false ? {} : undefined),
  getGridsPerRef: () => (options?.hasGrid !== false ? 10 : undefined),
});

// ============================================================================
// Tests
// ============================================================================

describe("displayStyleExtractor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("extractDisplayStyle (2D)", () => {
    it("extracts displayStyle from ViewITwin2d format", () => {
      const data = {
        displayStyle: create2dDisplayStyle(),
      };

      const result = extractDisplayStyle(data);

      expect(result).toBeDefined();
      expect(result.viewflags.renderMode).toBe(4);
      expect(result.backgroundColor).toBeDefined();
    });

    it("extracts displayStyle from legacy format", () => {
      const data = {
        displayStyleProps: {
          jsonProperties: {
            styles: create2dDisplayStyle(),
          },
        },
      };

      const result = extractDisplayStyle(data);

      expect(result).toBeDefined();
      expect(result.viewflags).toBeDefined();
    });

    it("returns undefined when neither displayStyle nor displayStyleProps present", () => {
      const data = {};

      const result = extractDisplayStyle(data);

      expect(result).toBeUndefined();
    });

    it("appends acs and grid viewflags from ViewState when provided", () => {
      const data = {
        displayStyle: create2dDisplayStyle(),
      };
      const viewState = createMockViewState({ hasAcs: true, hasGrid: true });

      const result = extractDisplayStyle(data, viewState as any);

      expect(result.viewflags.acs).toBe(true);
      expect(result.viewflags.grid).toBe(true);
    });

    it("sets grid to false when viewState has no grid data", () => {
      const data = {
        displayStyle: create2dDisplayStyle(),
      };
      const viewState = createMockViewState({ hasAcs: false, hasGrid: false });

      const result = extractDisplayStyle(data, viewState as any);

      expect(result.viewflags.acs).toBe(false);
      expect(result.viewflags.grid).toBe(false);
    });
  });

  describe("extractDisplayStyle3d", () => {
    it("extracts displayStyle from ViewITwin3d format", () => {
      const data = {
        displayStyle: create3dDisplayStyle(),
      };

      const result = extractDisplayStyle3d(data);

      expect(result).toBeDefined();
      expect(result.viewflags.renderMode).toBe(6);
      expect(result.viewflags.shadows).toBe(true);
    });

    it("extracts displayStyle from legacy format", () => {
      const data = {
        displayStyleProps: createLegacy3dDisplayStyleProps(),
      };

      const result = extractDisplayStyle3d(data);

      expect(result).toBeDefined();
      expect(result.viewflags).toBeDefined();
    });

    it("extracts environment settings", () => {
      const data = {
        displayStyle: create3dDisplayStyle(),
      };

      const result = extractDisplayStyle3d(data);

      expect(result.environment).toBeDefined();
      expect(result.environment.ground.display).toBe(true);
      expect(result.environment.sky.display).toBe(true);
    });

    it("extracts ambient occlusion settings when explicitly provided", () => {
      const displayStyle = {
        ...create3dDisplayStyle(),
        ao: {
          bias: 0.25,
          zLengthCap: 0.0025,
          maxDistance: 100,
          intensity: 1.0,
        },
      };
      const data = {
        displayStyle,
      };

      const result = extractDisplayStyle3d(data);

      // ao is transformed to ambientOcclusion with the "ao" output accessor
      expect(result.ao).toBeDefined();
      expect(result.ao.bias).toBe(0.25);
      expect(result.ao.intensity).toBe(1.0);
    });

    it("extracts solar shadows", () => {
      const data = {
        displayStyle: create3dDisplayStyle(),
      };

      const result = extractDisplayStyle3d(data);

      expect(result.solarShadows).toBeDefined();
    });

    it("extracts lights settings", () => {
      const data = {
        displayStyle: create3dDisplayStyle(),
      };

      const result = extractDisplayStyle3d(data);

      expect(result.lights).toBeDefined();
      expect(result.lights.portrait).toBeDefined();
      expect(result.lights.solar).toBeDefined();
      expect(result.lights.hemisphere).toBeDefined();
      expect(result.lights.ambient).toBeDefined();
    });

    it("extracts context reality models", () => {
      const data = {
        displayStyle: create3dDisplayStyle(),
      };

      const result = extractDisplayStyle3d(data);

      expect(result.contextRealityModels).toBeDefined();
      expect(result.contextRealityModels).toHaveLength(1);
      expect(result.contextRealityModels[0].name).toBe("Test Reality Model");
    });

    it("extracts subCategoryOverrides", () => {
      const data = {
        displayStyle: create3dDisplayStyle(),
      };

      const result = extractDisplayStyle3d(data);

      expect(result.subCategoryOvr).toBeDefined();
      expect(result.subCategoryOvr).toHaveLength(1);
      expect(result.subCategoryOvr[0].subCategory).toBe("0x123");
    });

    it("removes empty thematic range array", () => {
      const displayStyle = create3dDisplayStyle();
      (displayStyle as any).thematic = {
        displayMode: 1,
        range: [], // Empty array should be removed
      };
      const data = { displayStyle };

      const result = extractDisplayStyle3d(data);

      expect(result.thematic).toBeDefined();
      expect(result.thematic.range).toBeUndefined();
    });

    it("preserves non-empty thematic range", () => {
      const displayStyle = create3dDisplayStyle();
      (displayStyle as any).thematic = {
        displayMode: 1,
        range: [0, 100],
      };
      const data = { displayStyle };

      const result = extractDisplayStyle3d(data);

      expect(result.thematic.range).toEqual([0, 100]);
    });

    it("returns undefined when styles is undefined", () => {
      const data = {};

      const result = extractDisplayStyle3d(data);

      expect(result).toBeUndefined();
    });
  });

  describe("extractDisplayStyle2dFromLegacy", () => {
    it("extracts display style from legacy DisplayStyleProps", () => {
      const data = {
        jsonProperties: {
          styles: {
            viewflags: {
              renderMode: 4,
              noConstruct: false,
            },
            backgroundColor: { red: 255, green: 255, blue: 255 },
          },
        },
      };

      const result = extractDisplayStyle2dFromLegacy(data);

      expect(result).toBeDefined();
      expect(result.viewflags).toBeDefined();
    });

    it("handles data without jsonProperties gracefully", () => {
      const data = {} as any;

      // Function tries to access undefined properties
      expect(() => extractDisplayStyle2dFromLegacy(data)).toThrow();
    });
  });

  describe("extractDisplayStyle3dFromLegacy", () => {
    it("extracts 3D display style from legacy format", () => {
      const data = createLegacy3dDisplayStyleProps();

      const result = extractDisplayStyle3dFromLegacy(data);

      expect(result).toBeDefined();
      expect(result.viewflags).toBeDefined();
    });

    it("transforms ao to ambientOcclusion", () => {
      const data = createLegacy3dDisplayStyleProps();

      const result = extractDisplayStyle3dFromLegacy(data);

      expect(result.ambientOcclusion).toBeDefined();
      expect(result.ambientOcclusion!.bias).toBe(0.25);
    });

    it("transforms hline to hiddenLine", () => {
      const data = createLegacy3dDisplayStyleProps();

      const result = extractDisplayStyle3dFromLegacy(data);

      expect(result.hiddenLine).toBeDefined();
    });
  });

  describe("viewflags extraction", () => {
    it("extracts all viewflag properties from schema format", () => {
      const data = {
        displayStyle: {
          viewflags: {
            renderMode: 6,
            noConstructions: true,
            noDimensions: true,
            noPattern: true,
            noWeight: true,
            noStyle: true,
            noTransparency: true,
            noFill: true,
            noTexture: true,
            noMaterial: true,
            visibleEdges: true,
            hiddenEdges: true,
            shadows: true,
            clipVolume: true,
            hiddenLineMaterialColors: true,
            monochrome: true,
            backgroundMap: true,
            ambientOcclusion: true,
            acs: true,
            thematicDisplay: true,
            wiremesh: true,
          },
        },
      };

      const result = extractDisplayStyle3d(data);

      expect(result.viewflags.renderMode).toBe(6);
      expect(result.viewflags.noConstruct).toBe(true);
      expect(result.viewflags.noDim).toBe(true);
      expect(result.viewflags.noPattern).toBe(true);
      expect(result.viewflags.noWeight).toBe(true);
      expect(result.viewflags.noStyle).toBe(true);
      expect(result.viewflags.noTransp).toBe(true);
      expect(result.viewflags.noFill).toBe(true);
      expect(result.viewflags.noTexture).toBe(true);
      expect(result.viewflags.noMaterial).toBe(true);
      expect(result.viewflags.visEdges).toBe(true);
      expect(result.viewflags.hidEdges).toBe(true);
      expect(result.viewflags.shadows).toBe(true);
      expect(result.viewflags.clipVol).toBe(true);
      expect(result.viewflags.hlMatColors).toBe(true);
      expect(result.viewflags.monochrome).toBe(true);
      expect(result.viewflags.backgroundMap).toBe(true);
      expect(result.viewflags.ambientOcclusion).toBe(true);
      expect(result.viewflags.acs).toBe(true);
      expect(result.viewflags.thematicDisplay).toBe(true);
      expect(result.viewflags.wiremesh).toBe(true);
    });
  });

  describe("backgroundMap extraction", () => {
    it("extracts backgroundMap settings", () => {
      const data = {
        displayStyle: {
          ...create3dDisplayStyle(),
          backgroundMap: {
            groundBias: 0,
            transparency: 0.5,
            useDepthBuffer: true,
            applyTerrain: true,
            terrainSettings: {
              providerName: "CesiumWorldTerrain",
              exaggeration: 1.0,
              applyLighting: true,
              heightOrigin: 0,
              heightOriginMode: 0,
            },
            globeMode: 0,
            nonLocatable: false,
          },
        },
      };

      const result = extractDisplayStyle3d(data);

      expect(result.backgroundMap).toBeDefined();
      expect(result.backgroundMap.groundBias).toBe(0);
      expect(result.backgroundMap.transparency).toBe(0.5);
      expect(result.backgroundMap.useDepthBuffer).toBe(true);
      expect(result.backgroundMap.applyTerrain).toBe(true);
      expect(result.backgroundMap.terrainSettings).toBeDefined();
      expect(result.backgroundMap.terrainSettings.providerName).toBe(
        "CesiumWorldTerrain",
      );
    });
  });

  describe("mapImagery extraction", () => {
    it("extracts mapImagery with color backgroundBase", () => {
      const data = {
        displayStyle: {
          ...create3dDisplayStyle(),
          mapImagery: {
            backgroundBase: { red: 200, green: 200, blue: 200 },
          },
        },
      };

      const result = extractDisplayStyle3d(data);

      expect(result.mapImagery).toBeDefined();
      expect(result.mapImagery.backgroundBase).toBeDefined();
    });

    it("extracts mapImagery with URL-based backgroundBase", () => {
      const data = {
        displayStyle: {
          ...create3dDisplayStyle(),
          mapImagery: {
            backgroundBase: {
              url: "https://example.com/imagery",
              name: "Test Imagery",
              visible: true,
            },
          },
        },
      };

      const result = extractDisplayStyle3d(data);

      expect(result.mapImagery).toBeDefined();
      expect(result.mapImagery.backgroundBase.url).toBe(
        "https://example.com/imagery",
      );
    });

    it("extracts backgroundLayers and overlayLayers", () => {
      const data = {
        displayStyle: {
          ...create3dDisplayStyle(),
          mapImagery: {
            backgroundLayers: [
              {
                url: "https://example.com/layer1",
                name: "Layer 1",
                visible: true,
              },
            ],
            overlayLayers: [
              {
                url: "https://example.com/overlay1",
                name: "Overlay 1",
                visible: true,
              },
            ],
          },
        },
      };

      const result = extractDisplayStyle3d(data);

      expect(result.mapImagery.backgroundLayers).toHaveLength(1);
      expect(result.mapImagery.overlayLayers).toHaveLength(1);
    });
  });

  describe("clipStyle extraction", () => {
    it("extracts clipStyle settings", () => {
      const data = {
        displayStyle: {
          ...create3dDisplayStyle(),
          clipStyle: {
            produceCutGeometry: true,
            insideColor: { r: 255, g: 0, b: 0 },
            outsideColor: { r: 0, g: 255, b: 0 },
            colorizeIntersection: true,
          },
        },
      };

      const result = extractDisplayStyle3d(data);

      expect(result.clipStyle).toBeDefined();
      expect(result.clipStyle.produceCutGeometry).toBe(true);
      expect(result.clipStyle.colorizeIntersection).toBe(true);
    });
  });

  describe("planProjections extraction", () => {
    it("extracts planProjections map", () => {
      const data = {
        displayStyle: {
          ...create3dDisplayStyle(),
          planProjections: {
            "0x123": {
              elevation: 10,
              transparency: 0.5,
              overlay: true,
              enforceDisplayPriority: true,
            },
            "0x456": {
              elevation: 20,
              overlay: false,
            },
          },
        },
      };

      const result = extractDisplayStyle3d(data);

      expect(result.planProjections).toBeDefined();
      expect(result.planProjections["0x123"]).toBeDefined();
      expect(result.planProjections["0x123"].elevation).toBe(10);
      expect(result.planProjections["0x456"]).toBeDefined();
    });
  });

  describe("featureAppearanceMappings", () => {
    it("exports featureAppearanceMappings array", () => {
      expect(Array.isArray(featureAppearanceMappings)).toBe(true);
      expect(featureAppearanceMappings.length).toBeGreaterThan(0);
    });

    it("exports featureAppearanceLegacyMappings array", () => {
      expect(Array.isArray(featureAppearanceLegacyMappings)).toBe(true);
      expect(featureAppearanceLegacyMappings.length).toBeGreaterThan(0);
    });
  });

  describe("excludedElements extraction", () => {
    it("extracts excludedElements as string", () => {
      const data = {
        displayStyle: {
          ...create3dDisplayStyle(),
          excludedElements: "0x1+0x2+0x3",
        },
      };

      const result = extractDisplayStyle3d(data);

      expect(result.excludedElements).toBe("0x1+0x2+0x3");
    });

    it("extracts excludedElements as array", () => {
      const data = {
        displayStyle: {
          ...create3dDisplayStyle(),
          excludedElements: ["0x1", "0x2", "0x3"],
        },
      };

      const result = extractDisplayStyle3d(data);

      expect(result.excludedElements).toEqual(["0x1", "0x2", "0x3"]);
    });
  });

  describe("snapshot tests", () => {
    it("matches snapshot for full 3D display style extraction", () => {
      const data = {
        displayStyle: create3dDisplayStyle(),
      };

      const result = extractDisplayStyle3d(data);

      expect(result).toMatchSnapshot();
    });

    it("matches snapshot for full 2D display style extraction", () => {
      const data = {
        displayStyle: create2dDisplayStyle(),
      };

      const result = extractDisplayStyle(data);

      expect(result).toMatchSnapshot();
    });

    it("matches snapshot for legacy 3D extraction", () => {
      const data = createLegacy3dDisplayStyleProps();

      const result = extractDisplayStyle3dFromLegacy(data);

      expect(result).toMatchSnapshot();
    });
  });
});
