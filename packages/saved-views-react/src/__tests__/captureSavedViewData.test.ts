/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================================
// ESM-safe mocking: Define mocks inline in vi.hoisted
// CRITICAL: vi.hoisted runs BEFORE imports, so all mock definitions must be inline
// ============================================================================

const { itwinFrontendMock } = vi.hoisted(() => {
  // Minimal mock for captureSavedViewData tests
  class MockViewState {
    is3d = () => true;
    isSpatialView = () => true;
    isDrawingView = () => false;
    isSheetView = () => false;
  }

  class MockViewPose {}

  // EmphasizeElements mock
  const emphasizeInstance = {
    clear: vi.fn(),
    fromJSON: vi.fn(),
    toJSON: vi.fn(() => ({})),
  };

  const emphasizeElements = {
    get: vi.fn(() => undefined),
    getOrCreate: vi.fn(() => emphasizeInstance),
    clear: vi.fn(),
    instance: emphasizeInstance,
  };

  const itwinFrontendMock = {
    ViewState: MockViewState,
    ViewPose: MockViewPose,
    ViewPose2d: class extends MockViewPose {},
    ViewPose3d: class extends MockViewPose {},
    SpatialViewState: { createFromProps: vi.fn() },
    DrawingViewState: { createFromProps: vi.fn() },
    SheetViewState: { createFromProps: vi.fn() },
    EmphasizeElements: emphasizeElements,
    IModelConnection: {},
    Viewport: {},
  };

  return { itwinFrontendMock };
});

vi.mock("@itwin/core-frontend", () => itwinFrontendMock);

import {
  captureSavedViewData,
  queryMissingModels,
  queryMissingCategories,
  queryAllSpatiallyLocatedModels,
} from "../captureSavedViewData.js";

// Import helper for mocks - safe because they don't need to be hoisted
import {
  createMockIModel,
  createCaptureViewport,
} from "./mocks/iModelMocks.js";

// ============================================================================
// Mock Factories (viewport-specific)
// ============================================================================

function createMockSpatialViewState(
  options: {
    scheduleScript?: unknown;
    timePoint?: number;
  } = {},
) {
  const { scheduleScript, timePoint } = options;

  const displayStylePropsRef = {
    classFullName: "BisCore:DisplayStyle3d",
    id: "0x300",
    code: { spec: "0x1", scope: "0x1", value: "" },
    model: "0x10",
    jsonProperties: {
      styles: {
        ...(timePoint !== undefined && { timePoint }),
        ...(scheduleScript !== undefined && { scheduleScript }),
        viewflags: { renderMode: 6 },
      },
    },
  };

  const categorySelector = {
    id: "0x100",
    toJSON: vi.fn(() => ({
      classFullName: "BisCore:CategorySelector",
      id: "0x100",
      categories: ["0xcat1", "0xcat2"],
    })),
  };

  const modelSelector = {
    id: "0x200",
    toJSON: vi.fn(() => ({
      classFullName: "BisCore:ModelSelector",
      id: "0x200",
      models: ["0xmod1", "0xmod2"],
    })),
  };

  const displayStyle = {
    id: "0x300",
    scheduleScript,
    toJSON: vi.fn(() => displayStylePropsRef),
  };

  return {
    categorySelector,
    modelSelector,
    displayStyle,
    displayStylePropsRef,
    is3d: vi.fn(() => true),
    isSpatialView: vi.fn(() => true),
    isDrawingView: vi.fn(() => false),
    isSheetView: vi.fn(() => false),
    toJSON: vi.fn(() => ({
      classFullName: "BisCore:SpatialViewDefinition",
      id: "0x500",
      code: { spec: "0x1", scope: "0x1", value: "" },
      model: "0x10",
      origin: [0, 0, 0],
      extents: [100, 100, 100],
      angles: { yaw: 0, pitch: 0, roll: 0 },
      cameraOn: true,
      camera: {
        lens: { radians: 1.5707963267948966 },
        focusDist: 100,
        eye: [50, 50, 200],
      }, // lens in radians format
    })),
  };
}

function createMockDrawingViewState() {
  const categorySelector = {
    id: "0x100",
    toJSON: vi.fn(() => ({
      classFullName: "BisCore:CategorySelector",
      id: "0x100",
      categories: ["0xcat1"],
    })),
  };

  const displayStyle = {
    id: "0x300",
    toJSON: vi.fn(() => ({
      classFullName: "BisCore:DisplayStyle2d",
      id: "0x300",
      jsonProperties: { styles: { viewflags: { renderMode: 4 } } },
    })),
  };

  return {
    categorySelector,
    displayStyle,
    is3d: vi.fn(() => false),
    isSpatialView: vi.fn(() => false),
    isDrawingView: vi.fn(() => true),
    isSheetView: vi.fn(() => false),
    toJSON: vi.fn(() => ({
      classFullName: "BisCore:DrawingViewDefinition",
      id: "0x500",
      code: { spec: "0x1", scope: "0x1", value: "" },
      model: "0x10",
      baseModelId: "0x1000",
      origin: [0, 0],
      delta: [500, 500],
      angle: { radians: 0 },
    })),
  };
}

function createMockSheetViewState() {
  const categorySelector = {
    id: "0x100",
    toJSON: vi.fn(() => ({
      classFullName: "BisCore:CategorySelector",
      id: "0x100",
      categories: ["0xcat1"],
    })),
  };

  const displayStyle = {
    id: "0x300",
    toJSON: vi.fn(() => ({
      classFullName: "BisCore:DisplayStyle2d",
      id: "0x300",
      jsonProperties: { styles: {} },
    })),
  };

  return {
    categorySelector,
    displayStyle,
    sheetSize: { x: 200, y: 300 },
    attachmentIds: ["0xatt1", "0xatt2"],
    is3d: vi.fn(() => false),
    isSpatialView: vi.fn(() => false),
    isDrawingView: vi.fn(() => false),
    isSheetView: vi.fn(() => true),
    toJSON: vi.fn(() => ({
      classFullName: "BisCore:SheetViewDefinition",
      id: "0x500",
      code: { spec: "0x1", scope: "0x1", value: "" },
      model: "0x10",
      baseModelId: "0x2000",
      origin: [0, 0],
      delta: [200, 300],
      angle: { radians: 0 },
    })),
  };
}

function createViewportForCapture(
  viewStateFactory: () =>
    | ReturnType<typeof createMockSpatialViewState>
    | ReturnType<typeof createMockDrawingViewState>
    | ReturnType<typeof createMockSheetViewState>,
  perModelCategoryVisibilityEntries: Array<{
    modelId: string;
    categoryId: string;
    visible: boolean;
  }> = [],
  iModelOptions: { isBlank?: boolean } = {},
) {
  const iModel = createMockIModel(iModelOptions);
  const view = viewStateFactory();

  return {
    viewport: {
      iModel,
      view,
      displayStyle: view.displayStyle,
      perModelCategoryVisibility: {
        [Symbol.iterator]: function* () {
          for (const entry of perModelCategoryVisibilityEntries) {
            yield entry;
          }
        },
      },
    },
    iModel,
    view,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe("captureSavedViewData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset emphasis mock defaults
    itwinFrontendMock.EmphasizeElements.get.mockReturnValue(undefined);
    itwinFrontendMock.EmphasizeElements.instance.clear.mockClear();
    itwinFrontendMock.EmphasizeElements.instance.fromJSON.mockClear();
  });

  describe("view type detection", () => {
    it("returns iTwin3d for spatial view", async () => {
      const { viewport } = createViewportForCapture(createMockSpatialViewState);

      const result = await captureSavedViewData({
        viewport: viewport as never,
      });

      expect(result.viewData.type).toBe("iTwin3d");
    });

    it("returns iTwinDrawing for drawing view", async () => {
      const { viewport } = createViewportForCapture(createMockDrawingViewState);

      const result = await captureSavedViewData({
        viewport: viewport as never,
      });

      expect(result.viewData.type).toBe("iTwinDrawing");
    });

    it("returns iTwinSheet for sheet view", async () => {
      const { viewport } = createViewportForCapture(createMockSheetViewState);

      const result = await captureSavedViewData({
        viewport: viewport as never,
      });

      expect(result.viewData.type).toBe("iTwinSheet");
    });
  });

  describe("category capture", () => {
    it("captures enabled categories", async () => {
      const { viewport } = createViewportForCapture(createMockSpatialViewState);

      const result = await captureSavedViewData({
        viewport: viewport as never,
      });

      expect(result.viewData.categories.enabled).toEqual(["0xcat1", "0xcat2"]);
    });
  });

  describe("model capture (3D only)", () => {
    it("captures enabled models", async () => {
      const { viewport } = createViewportForCapture(createMockSpatialViewState);

      const result = await captureSavedViewData({
        viewport: viewport as never,
      });

      if (result.viewData.type === "iTwin3d") {
        expect(result.viewData.models.enabled).toEqual(["0xmod1", "0xmod2"]);
      }
    });
  });

  describe("camera/lens conversion", () => {
    it("converts camera.lens from radians to degrees", async () => {
      const { viewport } = createViewportForCapture(createMockSpatialViewState);

      const result = await captureSavedViewData({
        viewport: viewport as never,
      });

      if (result.viewData.type === "iTwin3d" && result.viewData.camera) {
        // lens was 1.5707963267948966 radians (π/2), should be ~90 degrees
        expect(result.viewData.camera.lens).toBeCloseTo(90, 1);
      }
    });
  });

  describe("displayStyle cleanup", () => {
    it("clears timePoint when is3d AND timePoint exists AND no scheduleScript", async () => {
      const viewStateFactory = () =>
        createMockSpatialViewState({
          timePoint: 12345,
          scheduleScript: undefined, // No scheduleScript
        });
      const { viewport, view } = createViewportForCapture(viewStateFactory);

      await captureSavedViewData({ viewport: viewport as never });

      // Verify the displayStyleProps was mutated to remove timePoint
      const displayStylePropsRef = (
        view as ReturnType<typeof createMockSpatialViewState>
      ).displayStylePropsRef;
      expect(
        displayStylePropsRef.jsonProperties.styles.timePoint,
      ).toBeUndefined();
    });

    it("preserves timePoint when scheduleScript exists", async () => {
      const viewStateFactory = () =>
        createMockSpatialViewState({
          timePoint: 12345,
          scheduleScript: { someScript: true }, // Has scheduleScript
        });
      const { viewport, view } = createViewportForCapture(viewStateFactory);

      await captureSavedViewData({ viewport: viewport as never });

      // timePoint should be preserved when scheduleScript exists
      const displayStylePropsRef = (
        view as ReturnType<typeof createMockSpatialViewState>
      ).displayStylePropsRef;
      expect(displayStylePropsRef.jsonProperties.styles.timePoint).toBe(12345);
    });

    it("mutates displayStyleProps to clear scheduleScript", async () => {
      const viewStateFactory = () =>
        createMockSpatialViewState({
          timePoint: undefined,
          scheduleScript: { largeScript: "data" },
        });
      const { viewport, view } = createViewportForCapture(viewStateFactory);

      await captureSavedViewData({ viewport: viewport as never });

      // scheduleScript should be cleared
      const displayStylePropsRef = (
        view as ReturnType<typeof createMockSpatialViewState>
      ).displayStylePropsRef;
      expect(
        displayStylePropsRef.jsonProperties.styles.scheduleScript,
      ).toBeUndefined();
    });
  });

  describe("extension capture", () => {
    it("captures EmphasizeElements extension when present", async () => {
      // Setup: EmphasizeElements.get returns an instance with toJSON
      const emphProps = { neverDrawn: ["0x100"], alwaysDrawn: ["0x200"] };
      itwinFrontendMock.EmphasizeElements.get.mockReturnValue({
        toJSON: vi.fn(() => emphProps),
      });

      const { viewport } = createViewportForCapture(createMockSpatialViewState);

      const result = await captureSavedViewData({
        viewport: viewport as never,
      });

      const emphExtension = result.extensions?.find(
        (ext) => ext.extensionName === "EmphasizeElements",
      );
      expect(emphExtension).toBeDefined();
      expect(JSON.parse(emphExtension!.data)).toEqual({
        emphasizeElementsProps: emphProps,
      });
    });

    it("captures PMCV extension with correct content (spatial only)", async () => {
      const pmcvEntries = [
        { modelId: "0xmod1", categoryId: "0xcat1", visible: true },
        { modelId: "0xmod1", categoryId: "0xcat2", visible: false },
      ];
      const { viewport } = createViewportForCapture(
        createMockSpatialViewState,
        pmcvEntries,
      );

      const result = await captureSavedViewData({
        viewport: viewport as never,
      });

      const pmcvExtension = result.extensions?.find(
        (ext) => ext.extensionName === "PerModelCategoryVisibility",
      );
      expect(pmcvExtension).toBeDefined();
      expect(JSON.parse(pmcvExtension!.data)).toEqual({
        perModelCategoryVisibilityProps: pmcvEntries,
      });
    });

    it("omits emphasis when omitEmphasis=true", async () => {
      itwinFrontendMock.EmphasizeElements.get.mockReturnValue({
        toJSON: vi.fn(() => ({ neverDrawn: ["0x100"] })),
      });

      const { viewport } = createViewportForCapture(createMockSpatialViewState);

      const result = await captureSavedViewData({
        viewport: viewport as never,
        omitEmphasis: true,
      });

      const emphExtension = result.extensions?.find(
        (ext) => ext.extensionName === "EmphasizeElements",
      );
      expect(emphExtension).toBeUndefined();
    });

    it("omits PMCV when omitPerModelCategoryVisibility=true", async () => {
      const pmcvEntries = [
        { modelId: "0xmod1", categoryId: "0xcat1", visible: true },
      ];
      const { viewport } = createViewportForCapture(
        createMockSpatialViewState,
        pmcvEntries,
      );

      const result = await captureSavedViewData({
        viewport: viewport as never,
        omitPerModelCategoryVisibility: true,
      });

      const pmcvExtension = result.extensions?.find(
        (ext) => ext.extensionName === "PerModelCategoryVisibility",
      );
      expect(pmcvExtension).toBeUndefined();
    });
  });

  describe("override capture functions", () => {
    it("uses override capture functions when provided", async () => {
      const overrideCapture = vi.fn(() => JSON.stringify({ custom: "data" }));

      const { viewport } = createViewportForCapture(createMockSpatialViewState);

      const result = await captureSavedViewData({
        viewport: viewport as never,
        overrides: {
          emphasizeElements: { capture: overrideCapture },
        },
      });

      expect(overrideCapture).toHaveBeenCalledWith(viewport);

      const emphExtension = result.extensions?.find(
        (ext) => ext.extensionName === "EmphasizeElements",
      );
      expect(emphExtension?.data).toBe(JSON.stringify({ custom: "data" }));
    });
  });

  describe("blank iModel handling", () => {
    it("handles blank iModel (returns empty arrays for queries)", async () => {
      const { viewport } = createViewportForCapture(
        createMockSpatialViewState,
        [],
        { isBlank: true },
      );

      const result = await captureSavedViewData({
        viewport: viewport as never,
      });

      // Should not throw and should return valid data
      expect(result.viewData).toBeDefined();
    });
  });

  describe("angle conversion", () => {
    it("converts angles from radians to degrees", async () => {
      const { viewport, view } = createViewportForCapture(
        createMockDrawingViewState,
      );

      // Override angle to be in radians
      (view as ReturnType<typeof createMockDrawingViewState>).toJSON = vi.fn(
        () => ({
          classFullName: "BisCore:DrawingViewDefinition",
          id: "0x500",
          baseModelId: "0x1000",
          origin: [0, 0],
          delta: [500, 500],
          angle: { radians: Math.PI / 4 }, // 45 degrees in radians
        }),
      );

      const result = await captureSavedViewData({
        viewport: viewport as never,
      });

      if (result.viewData.type === "iTwinDrawing") {
        expect(result.viewData.angle).toBeCloseTo(45, 1);
      }
    });
  });
});

describe("queryAllSpatiallyLocatedModels", () => {
  it("falls back to simpler query for old iModels (schema error)", async () => {
    const iModel = createMockIModel();

    // First query throws (old schema)
    let callCount = 0;
    iModel.createQueryReader = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        throw new Error("Schema error - IsNotSpatiallyLocated not found");
      }
      return { toArray: vi.fn().mockResolvedValue([["0xmod1"], ["0xmod2"]]) };
    });

    const result = await queryAllSpatiallyLocatedModels(iModel as never);

    // Should have called createQueryReader twice (first failed, second succeeded)
    expect(iModel.createQueryReader).toHaveBeenCalledTimes(2);
    expect(result).toEqual(["0xmod1", "0xmod2"]);
  });
});

describe("queryMissingCategories", () => {
  it("returns empty array for blank iModel", async () => {
    const iModel = createMockIModel({ isBlank: true });

    const result = await queryMissingCategories(iModel as never);

    expect(result).toEqual([]);
  });
});

describe("queryMissingModels", () => {
  it("returns empty array for blank iModel", async () => {
    const iModel = createMockIModel({ isBlank: true });

    const result = await queryMissingModels(iModel as never);

    expect(result).toEqual([]);
  });
});
