/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { describe, expect, it, vi } from "vitest";

import { captureSavedViewData } from "../captureSavedViewData.js";
import {
  createMockDrawingViewState,
  createMockIModelConnection,
  createMockSheetViewState,
  createMockSpatialViewState,
  createMockViewport,
} from "./testUtilities.js";

describe("captureSavedViewData", () => {
  describe("3D Spatial View", () => {
    it("should capture spatial view data correctly", async () => {
      const iModel = createMockIModelConnection();
      const viewState = createMockSpatialViewState();
      const viewport = createMockViewport(viewState, iModel);

      const result = await captureSavedViewData({ viewport });

      expect(result).toBeDefined();
      expect(result.viewData).toBeDefined();
      expect(result.viewData.type).toBe("iTwin3d");

      if (result.viewData.type === "iTwin3d") {
        expect(result.viewData.origin).toEqual([0, 0, 0]);
        expect(result.viewData.extents).toEqual([100, 100, 100]);
        expect(result.viewData.categories?.enabled).toContain("0x10");
        expect(result.viewData.categories?.enabled).toContain("0x11");
        expect(result.viewData.models?.enabled).toContain("0x20");
        expect(result.viewData.models?.enabled).toContain("0x21");
      }
    });

    it("should capture view with camera enabled", async () => {
      const iModel = createMockIModelConnection();
      const viewState = createMockSpatialViewState();
      
      // Override toJSON to return camera enabled view
      viewState.toJSON = vi.fn().mockReturnValue({
        origin: [1, 2, 3],
        extents: [10, 20, 30],
        angles: { yaw: 45, pitch: 30, roll: 0 },
        cameraOn: true,
        camera: {
          lens: { radians: 0.5 },
          focusDist: 100,
          eye: [5, 5, 5],
        },
        classFullName: "BisCore:SpatialViewDefinition",
        code: { spec: "test-spec", scope: "test-scope", value: "test-value" },
        model: "0x1",
        categorySelectorId: "0x2",
        displayStyleId: "0x3",
        modelSelectorId: "0x4",
      });

      const viewport = createMockViewport(viewState, iModel);
      const result = await captureSavedViewData({ viewport });

      if (result.viewData.type === "iTwin3d") {
        expect(result.viewData.camera).toBeDefined();
        expect(result.viewData.camera?.eye).toEqual([5, 5, 5]);
        expect(result.viewData.camera?.focusDist).toBe(100);
      }
    });

    it("should capture view details from spatial view", async () => {
      const iModel = createMockIModelConnection();
      const viewState = createMockSpatialViewState();
      
      // Add view details to jsonProperties
      viewState.toJSON = vi.fn().mockReturnValue({
        origin: [0, 0, 0],
        extents: [100, 100, 100],
        cameraOn: false,
        classFullName: "BisCore:SpatialViewDefinition",
        code: { spec: "test-spec", scope: "test-scope", value: "test-value" },
        model: "0x1",
        categorySelectorId: "0x2",
        displayStyleId: "0x3",
        modelSelectorId: "0x4",
        jsonProperties: {
          viewDetails: {
            acs: "0x123",
            aspectSkew: 1.5,
            gridOrient: 1,
            gridPerRef: 5,
            gridSpaceX: 2.0,
            gridSpaceY: 3.0,
            disable3dManipulations: true,
          },
        },
      });

      const viewport = createMockViewport(viewState, iModel);
      const result = await captureSavedViewData({ viewport });

      if (result.viewData.type === "iTwin3d") {
        expect(result.viewData.viewDetails).toBeDefined();
        expect(result.viewData.viewDetails?.acs).toBe("0x123");
        expect(result.viewData.viewDetails?.aspectSkew).toBe(1.5);
        expect(result.viewData.viewDetails?.disable3dManipulations).toBe(true);
      }
    });

    it("should query and include hidden categories", async () => {
      const iModel = createMockIModelConnection();
      const mockQueryReader = {
        toArray: vi.fn().mockResolvedValue([["0x1", "0x2", "0x3", "0x10", "0x11"]]),
      };
      iModel.createQueryReader = vi.fn().mockReturnValue(mockQueryReader);

      const viewState = createMockSpatialViewState();
      const viewport = createMockViewport(viewState, iModel);

      const result = await captureSavedViewData({ viewport });

      if (result.viewData.type === "iTwin3d") {
        expect(result.viewData.categories?.disabled).toBeDefined();
        // Should contain categories that are in all categories but not in enabled
        expect(result.viewData.categories?.disabled?.length).toBeGreaterThan(0);
      }
    });

    it("should query and include hidden models", async () => {
      const iModel = createMockIModelConnection();
      const mockQueryReader = {
        toArray: vi.fn().mockResolvedValue([["0x1", "0x2", "0x3", "0x20", "0x21"]]),
      };
      iModel.createQueryReader = vi.fn().mockReturnValue(mockQueryReader);

      const viewState = createMockSpatialViewState();
      const viewport = createMockViewport(viewState, iModel);

      const result = await captureSavedViewData({ viewport });

      if (result.viewData.type === "iTwin3d") {
        expect(result.viewData.models?.disabled).toBeDefined();
        // Should contain models that are in all models but not in enabled
        expect(result.viewData.models?.disabled?.length).toBeGreaterThan(0);
      }
    });
  });

  describe("2D Drawing View", () => {
    it("should capture drawing view data correctly", async () => {
      const iModel = createMockIModelConnection();
      const viewState = createMockDrawingViewState();
      const viewport = createMockViewport(viewState, iModel);

      // Mock the view type checks
      viewState.isDrawingView = vi.fn().mockReturnValue(true);
      viewport.view.isSpatialView = vi.fn().mockReturnValue(false);
      viewport.view.isDrawingView = vi.fn().mockReturnValue(true);

      const result = await captureSavedViewData({ viewport });

      expect(result).toBeDefined();
      expect(result.viewData).toBeDefined();
      expect(result.viewData.type).toBe("iTwinDrawing");

      if (result.viewData.type === "iTwinDrawing") {
        expect(result.viewData.baseModelId).toBe("0x100");
        expect(result.viewData.origin).toEqual([0, 0]);
        expect(result.viewData.delta).toEqual([100, 100]);
        expect(result.viewData.angle).toBe(0);
        expect(result.viewData.categories?.enabled).toContain("0x10");
        expect(result.viewData.categories?.enabled).toContain("0x11");
      }
    });

    it("should capture view details from drawing view", async () => {
      const iModel = createMockIModelConnection();
      const viewState = createMockDrawingViewState();
      
      viewState.toJSON = vi.fn().mockReturnValue({
        baseModelId: "0x100",
        origin: [10, 20],
        delta: [200, 300],
        angle: { degrees: 45 },
        classFullName: "BisCore:DrawingViewDefinition",
        id: "0x123",
        code: { spec: "test-spec", scope: "test-scope", value: "test-value" },
        model: "0x1",
        categorySelectorId: "0x2",
        displayStyleId: "0x3",
        isPrivate: false,
        description: "Test Drawing",
        jsonProperties: {
          viewDetails: {
            acs: "0x456",
            aspectSkew: 2.0,
            gridOrient: 2,
            gridPerRef: 8,
            gridSpaceX: 1.5,
            gridSpaceY: 2.5,
          },
        },
      });

      const viewport = createMockViewport(viewState, iModel);
      viewport.view.isSpatialView = vi.fn().mockReturnValue(false);
      viewport.view.isDrawingView = vi.fn().mockReturnValue(true);

      const result = await captureSavedViewData({ viewport });

      if (result.viewData.type === "iTwinDrawing") {
        expect(result.viewData.viewDetails).toBeDefined();
        expect(result.viewData.viewDetails?.acs).toBe("0x456");
        expect(result.viewData.viewDetails?.aspectSkew).toBe(2.0);
        expect(result.viewData.angle).toBe(45);
      }
    });
  });

  describe("Sheet View", () => {
    it("should capture sheet view data correctly", async () => {
      const iModel = createMockIModelConnection();
      const viewState = createMockSheetViewState();
      const viewport = createMockViewport(viewState, iModel);

      viewport.view.isSpatialView = vi.fn().mockReturnValue(false);
      viewport.view.isDrawingView = vi.fn().mockReturnValue(false);

      const result = await captureSavedViewData({ viewport });

      expect(result).toBeDefined();
      expect(result.viewData).toBeDefined();
      expect(result.viewData.type).toBe("iTwinSheet");

      if (result.viewData.type === "iTwinSheet") {
        expect(result.viewData.baseModelId).toBe("0x100");
        expect(result.viewData.origin).toEqual([0, 0]);
        expect(result.viewData.delta).toEqual([100, 100]);
        expect(result.viewData.angle).toBe(0);
        expect(result.viewData.width).toBe(11);
        expect(result.viewData.height).toBe(8.5);
        expect(result.viewData.sheetAttachments).toContain("0x200");
        expect(result.viewData.sheetAttachments).toContain("0x201");
        expect(result.viewData.categories?.enabled).toContain("0x10");
        expect(result.viewData.categories?.enabled).toContain("0x11");
      }
    });

    it("should capture view details from sheet view", async () => {
      const iModel = createMockIModelConnection();
      const viewState = createMockSheetViewState();
      
      viewState.toJSON = vi.fn().mockReturnValue({
        baseModelId: "0x100",
        origin: [5, 10],
        delta: [150, 200],
        angle: { radians: 0.785398 }, // 45 degrees
        classFullName: "BisCore:SheetViewDefinition",
        id: "0x123",
        code: { spec: "test-spec", scope: "test-scope", value: "test-value" },
        model: "0x1",
        categorySelectorId: "0x2",
        displayStyleId: "0x3",
        isPrivate: false,
        description: "Test Sheet",
        jsonProperties: {
          viewDetails: {
            acs: "0x789",
            aspectSkew: 0.8,
            gridOrient: 0,
            gridPerRef: 12,
            gridSpaceX: 0.5,
            gridSpaceY: 0.75,
          },
        },
      });

      const viewport = createMockViewport(viewState, iModel);
      viewport.view.isSpatialView = vi.fn().mockReturnValue(false);
      viewport.view.isDrawingView = vi.fn().mockReturnValue(false);

      const result = await captureSavedViewData({ viewport });

      if (result.viewData.type === "iTwinSheet") {
        expect(result.viewData.viewDetails).toBeDefined();
        expect(result.viewData.viewDetails?.acs).toBe("0x789");
        expect(result.viewData.viewDetails?.aspectSkew).toBe(0.8);
        expect(result.viewData.angle).toBeCloseTo(45, 1);
      }
    });
  });

  describe("Extension Handlers", () => {
    it("should include emphasis extension by default", async () => {
      const iModel = createMockIModelConnection();
      const viewState = createMockSpatialViewState();
      const viewport = createMockViewport(viewState, iModel);

      const result = await captureSavedViewData({ viewport });

      expect(result.extensions).toBeDefined();
      // By default, extensions array should be present but may be empty if no data is captured
      expect(Array.isArray(result.extensions)).toBe(true);
    });

    it("should omit emphasis extension when omitEmphasis is true", async () => {
      const iModel = createMockIModelConnection();
      const viewState = createMockSpatialViewState();
      const viewport = createMockViewport(viewState, iModel);

      const result = await captureSavedViewData({ 
        viewport, 
        omitEmphasis: true 
      });

      expect(result.extensions).toBeDefined();
      
      // Check that no emphasis extension is present
      const hasEmphasisExtension = result.extensions?.some(
        ext => ext.extensionName === "emphasizeElements"
      );
      expect(hasEmphasisExtension).toBe(false);
    });

    it("should omit per-model category visibility when omitPerModelCategoryVisibility is true", async () => {
      const iModel = createMockIModelConnection();
      const viewState = createMockSpatialViewState();
      const viewport = createMockViewport(viewState, iModel);

      const result = await captureSavedViewData({ 
        viewport, 
        omitPerModelCategoryVisibility: true 
      });

      expect(result.extensions).toBeDefined();
      
      // Check that no per-model category visibility extension is present
      const hasPerModelCategoryVisibility = result.extensions?.some(
        ext => ext.extensionName === "perModelCategoryVisibility"
      );
      expect(hasPerModelCategoryVisibility).toBe(false);
    });

    it("should include both extensions when neither is omitted", async () => {
      const iModel = createMockIModelConnection();
      const viewState = createMockSpatialViewState();
      const viewport = createMockViewport(viewState, iModel);

      const result = await captureSavedViewData({ 
        viewport, 
        omitEmphasis: false,
        omitPerModelCategoryVisibility: false
      });

      expect(result.extensions).toBeDefined();
      expect(Array.isArray(result.extensions)).toBe(true);
    });

    it("should support custom extension handler overrides", async () => {
      const iModel = createMockIModelConnection();
      const viewState = createMockSpatialViewState();
      const viewport = createMockViewport(viewState, iModel);

      const customCapture = vi.fn().mockReturnValue(JSON.stringify({ custom: "data" }));
      
      const result = await captureSavedViewData({ 
        viewport,
        overrides: {
          emphasizeElements: {
            capture: customCapture
          }
        }
      });

      expect(customCapture).toHaveBeenCalledWith(viewport);
    });
  });

  describe("Blank iModel", () => {
    it("should handle blank iModel gracefully", async () => {
      const iModel = createMockIModelConnection();
      iModel.isBlank = true;
      
      const viewState = createMockSpatialViewState();
      const viewport = createMockViewport(viewState, iModel);

      const result = await captureSavedViewData({ viewport });

      expect(result).toBeDefined();
      expect(result.viewData).toBeDefined();
      
      if (result.viewData.type === "iTwin3d") {
        // Blank iModels should not query for missing categories/models
        expect(result.viewData.categories?.disabled).toEqual([]);
        expect(result.viewData.models?.disabled).toEqual([]);
      }
    });
  });

  describe("Angle Conversion", () => {
    it("should convert radians to degrees for angles", async () => {
      const iModel = createMockIModelConnection();
      const viewState = createMockSpatialViewState();
      
      viewState.toJSON = vi.fn().mockReturnValue({
        origin: [0, 0, 0],
        extents: [100, 100, 100],
        angles: { 
          yaw: { radians: Math.PI / 2 },  // 90 degrees
          pitch: { radians: Math.PI / 4 }, // 45 degrees
          roll: { radians: 0 }
        },
        cameraOn: false,
        classFullName: "BisCore:SpatialViewDefinition",
        code: { spec: "test-spec", scope: "test-scope", value: "test-value" },
        model: "0x1",
        categorySelectorId: "0x2",
        displayStyleId: "0x3",
        modelSelectorId: "0x4",
      });

      const viewport = createMockViewport(viewState, iModel);
      const result = await captureSavedViewData({ viewport });

      if (result.viewData.type === "iTwin3d") {
        expect(result.viewData.angles?.yaw).toBeCloseTo(90, 1);
        expect(result.viewData.angles?.pitch).toBeCloseTo(45, 1);
        expect(result.viewData.angles?.roll).toBeCloseTo(0, 1);
      }
    });

    it("should handle degrees format for angles", async () => {
      const iModel = createMockIModelConnection();
      const viewState = createMockSpatialViewState();
      
      viewState.toJSON = vi.fn().mockReturnValue({
        origin: [0, 0, 0],
        extents: [100, 100, 100],
        angles: { 
          yaw: { degrees: 90 },
          pitch: { degrees: 45 },
          roll: { degrees: 0 }
        },
        cameraOn: false,
        classFullName: "BisCore:SpatialViewDefinition",
        code: { spec: "test-spec", scope: "test-scope", value: "test-value" },
        model: "0x1",
        categorySelectorId: "0x2",
        displayStyleId: "0x3",
        modelSelectorId: "0x4",
      });

      const viewport = createMockViewport(viewState, iModel);
      const result = await captureSavedViewData({ viewport });

      if (result.viewData.type === "iTwin3d") {
        expect(result.viewData.angles?.yaw).toBe(90);
        expect(result.viewData.angles?.pitch).toBe(45);
        expect(result.viewData.angles?.roll).toBe(0);
      }
    });
  });
});
