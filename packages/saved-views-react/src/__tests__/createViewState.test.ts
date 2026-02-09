/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { describe, expect, it, vi } from "vitest";

import type { ITwin3dViewData, ITwinDrawingdata, ITwinSheetData } from "../SavedView.js";
import {
  createViewState,
  createViewStateFromProps,
  createViewStateProps,
} from "../createViewState.js";
import { createMockIModelConnection } from "./testUtilities.js";

describe("createViewState", () => {
  describe("3D Spatial View State", () => {
    it("should create spatial view state from 3D data", async () => {
      const iModel = createMockIModelConnection();
      
      const viewData: ITwin3dViewData = {
        type: "iTwin3d",
        origin: [10, 20, 30],
        extents: [100, 200, 300],
        categories: {
          enabled: ["0x10", "0x11", "0x12"],
        },
        models: {
          enabled: ["0x20", "0x21"],
        },
      };

      const viewState = await createViewState(iModel, viewData, {
        skipViewStateLoad: true,
      });

      expect(viewState).toBeDefined();
      expect(viewState.isSpatialView()).toBe(true);
    });

    it("should create spatial view state with camera", async () => {
      const iModel = createMockIModelConnection();
      
      const viewData: ITwin3dViewData = {
        type: "iTwin3d",
        origin: [10, 20, 30],
        extents: [100, 200, 300],
        camera: {
          lens: 45,
          focusDist: 150,
          eye: [5, 10, 15],
        },
        categories: {
          enabled: ["0x10"],
        },
        models: {
          enabled: ["0x20"],
        },
      };

      const viewState = await createViewState(iModel, viewData, { skipViewStateLoad: true });

      expect(viewState).toBeDefined();
    });

    it("should create spatial view state with angles", async () => {
      const iModel = createMockIModelConnection();
      
      const viewData: ITwin3dViewData = {
        type: "iTwin3d",
        origin: [0, 0, 0],
        extents: [100, 100, 100],
        angles: {
          yaw: 90,
          pitch: 45,
          roll: 0,
        },
        categories: {
          enabled: ["0x10"],
        },
        models: {
          enabled: ["0x20"],
        },
      };

      const viewState = await createViewState(iModel, viewData, { skipViewStateLoad: true });

      expect(viewState).toBeDefined();
    });

    it("should create spatial view state with view details", async () => {
      const iModel = createMockIModelConnection();
      
      const viewData: ITwin3dViewData = {
        type: "iTwin3d",
        origin: [0, 0, 0],
        extents: [100, 100, 100],
        categories: {
          enabled: ["0x10"],
        },
        models: {
          enabled: ["0x20"],
        },
        viewDetails: {
          acs: "0x123",
          aspectSkew: 1.5,
          gridOrient: 1,
          gridPerRef: 5,
          gridSpaceX: 2.0,
          gridSpaceY: 3.0,
          disable3dManipulations: true,
        },
      };

      const viewState = await createViewState(iModel, viewData, { skipViewStateLoad: true });

      expect(viewState).toBeDefined();
    });

    it("should create spatial view state with model clip groups", async () => {
      const iModel = createMockIModelConnection();
      
      const viewData: ITwin3dViewData = {
        type: "iTwin3d",
        origin: [0, 0, 0],
        extents: [100, 100, 100],
        categories: {
          enabled: ["0x10"],
        },
        models: {
          enabled: ["0x20"],
        },
        viewDetails: {
          modelClipGroups: [
            {
              models: ["0x20"],
              clipVectors: [],
            },
          ],
        },
      };

      const viewState = await createViewState(iModel, viewData, { skipViewStateLoad: true });

      expect(viewState).toBeDefined();
    });

    it("should skip view state load when requested", async () => {
      const iModel = createMockIModelConnection();
      
      const viewData: ITwin3dViewData = {
        type: "iTwin3d",
        origin: [0, 0, 0],
        extents: [100, 100, 100],
        categories: {
          enabled: ["0x10"],
        },
        models: {
          enabled: ["0x20"],
        },
      };

      const viewState = await createViewState(iModel, viewData, {
        skipViewStateLoad: true,
      });

      expect(viewState).toBeDefined();
      // Note: iModel.views.load is called internally to fetch seed view state
    });
  });

  describe("2D Drawing View State", () => {
    it("should create drawing view state from 2D data", async () => {
      const iModel = createMockIModelConnection();
      
      const viewData: ITwinDrawingdata = {
        type: "iTwinDrawing",
        baseModelId: "0x100",
        origin: [10, 20],
        delta: [200, 300],
        angle: 45,
        modelExtents: {} as ITwinDrawingdata["modelExtents"],
        categories: {
          enabled: ["0x10", "0x11"],
        },
      };

      const viewState = await createViewState(iModel, viewData, { skipViewStateLoad: true });

      expect(viewState).toBeDefined();
    });

    it("should create drawing view state with view details", async () => {
      const iModel = createMockIModelConnection();
      
      const viewData: ITwinDrawingdata = {
        type: "iTwinDrawing",
        baseModelId: "0x100",
        origin: [10, 20],
        delta: [200, 300],
        angle: 45,
        modelExtents: {} as ITwinDrawingdata["modelExtents"],
        categories: {
          enabled: ["0x10"],
        },
        viewDetails: {
          acs: "0x456",
          aspectSkew: 2.0,
          gridOrient: 2,
          gridPerRef: 8,
          gridSpaceX: 1.5,
          gridSpaceY: 2.5,
        },
      };

      const viewState = await createViewState(iModel, viewData, { skipViewStateLoad: true });

      expect(viewState).toBeDefined();
    });

    it("should create drawing view state with display style", async () => {
      const iModel = createMockIModelConnection();
      
      const viewData: ITwinDrawingdata = {
        type: "iTwinDrawing",
        baseModelId: "0x100",
        origin: [0, 0],
        delta: [100, 100],
        angle: 0,
        modelExtents: {} as ITwinDrawingdata["modelExtents"],
        categories: {
          enabled: ["0x10"],
        },
        displayStyle: {
          backgroundColor: { r: 255, g: 255, b: 255 },
        },
      };

      const viewState = await createViewState(iModel, viewData, { skipViewStateLoad: true });

      expect(viewState).toBeDefined();
    });
  });

  describe("Sheet View State", () => {
    it("should create sheet view state from sheet data", async () => {
      const iModel = createMockIModelConnection();
      
      const viewData: ITwinSheetData = {
        type: "iTwinSheet",
        baseModelId: "0x100",
        origin: [0, 0],
        delta: [100, 100],
        angle: 0,
        width: 11,
        height: 8.5,
        categories: {
          enabled: ["0x10", "0x11"],
        },
      };

      const viewState = await createViewState(iModel, viewData, { skipViewStateLoad: true });

      expect(viewState).toBeDefined();
    });

    it("should create sheet view state with attachments", async () => {
      const iModel = createMockIModelConnection();
      
      const viewData: ITwinSheetData = {
        type: "iTwinSheet",
        baseModelId: "0x100",
        origin: [0, 0],
        delta: [100, 100],
        angle: 0,
        width: 11,
        height: 8.5,
        sheetAttachments: ["0x200", "0x201", "0x202"],
        categories: {
          enabled: ["0x10"],
        },
      };

      const viewState = await createViewState(iModel, viewData, { skipViewStateLoad: true });

      expect(viewState).toBeDefined();
    });

    it("should create sheet view state with view details", async () => {
      const iModel = createMockIModelConnection();
      
      const viewData: ITwinSheetData = {
        type: "iTwinSheet",
        baseModelId: "0x100",
        origin: [5, 10],
        delta: [150, 200],
        angle: 30,
        width: 17,
        height: 11,
        categories: {
          enabled: ["0x10"],
        },
        viewDetails: {
          acs: "0x789",
          aspectSkew: 0.8,
          gridOrient: 0,
          gridPerRef: 12,
          gridSpaceX: 0.5,
          gridSpaceY: 0.75,
        },
      };

      const viewState = await createViewState(iModel, viewData, { skipViewStateLoad: true });

      expect(viewState).toBeDefined();
    });
  });

  describe("Model Visibility Settings", () => {
    it("should show enabled models when setting is 'show'", async () => {
      const iModel = createMockIModelConnection();
      
      const viewData: ITwin3dViewData = {
        type: "iTwin3d",
        origin: [0, 0, 0],
        extents: [100, 100, 100],
        categories: {
          enabled: ["0x10"],
        },
        models: {
          enabled: ["0x20", "0x21"],
          disabled: ["0x22"],
        },
      };

      const viewState = await createViewState(iModel, viewData, {
        models: {
          enabled: "show",
        },
      });

      expect(viewState).toBeDefined();
      expect(viewState.isSpatialView()).toBe(true);
    });

    it("should hide disabled models when setting is 'hide'", async () => {
      const iModel = createMockIModelConnection();
      
      const viewData: ITwin3dViewData = {
        type: "iTwin3d",
        origin: [0, 0, 0],
        extents: [100, 100, 100],
        categories: {
          enabled: ["0x10"],
        },
        models: {
          enabled: ["0x20"],
          disabled: ["0x22", "0x23"],
        },
      };

      const viewState = await createViewState(iModel, viewData, {
        models: {
          disabled: "hide",
        },
      });

      expect(viewState).toBeDefined();
    });

    it("should handle 'other' models visibility", async () => {
      const iModel = createMockIModelConnection();
      
      const viewData: ITwin3dViewData = {
        type: "iTwin3d",
        origin: [0, 0, 0],
        extents: [100, 100, 100],
        categories: {
          enabled: ["0x10"],
        },
        models: {
          enabled: ["0x20"],
          disabled: ["0x22"],
        },
      };

      const viewState = await createViewState(iModel, viewData, {
        models: {
          other: "show",
        },
      });

      expect(viewState).toBeDefined();
    });
  });

  describe("Category Visibility Settings", () => {
    it("should show enabled categories when setting is 'show'", async () => {
      const iModel = createMockIModelConnection();
      
      const viewData: ITwin3dViewData = {
        type: "iTwin3d",
        origin: [0, 0, 0],
        extents: [100, 100, 100],
        categories: {
          enabled: ["0x10", "0x11"],
          disabled: ["0x12"],
        },
        models: {
          enabled: ["0x20"],
        },
      };

      const viewState = await createViewState(iModel, viewData, {
        categories: {
          enabled: "show",
        },
        subcategories: "ignore",
      });

      expect(viewState).toBeDefined();
    });

    it("should hide disabled categories when setting is 'hide'", async () => {
      const iModel = createMockIModelConnection();
      
      const viewData: ITwin3dViewData = {
        type: "iTwin3d",
        origin: [0, 0, 0],
        extents: [100, 100, 100],
        categories: {
          enabled: ["0x10"],
          disabled: ["0x12", "0x13"],
        },
        models: {
          enabled: ["0x20"],
        },
      };

      const viewState = await createViewState(iModel, viewData, {
        categories: {
          disabled: "hide",
        },
        subcategories: "ignore",
      });

      expect(viewState).toBeDefined();
    });

    it("should handle 'other' categories visibility", async () => {
      const iModel = createMockIModelConnection();
      
      const viewData: ITwin3dViewData = {
        type: "iTwin3d",
        origin: [0, 0, 0],
        extents: [100, 100, 100],
        categories: {
          enabled: ["0x10"],
          disabled: ["0x12"],
        },
        models: {
          enabled: ["0x20"],
        },
      };

      const viewState = await createViewState(iModel, viewData, {
        categories: {
          other: "show",
        },
        subcategories: "ignore",
      });

      expect(viewState).toBeDefined();
    });
  });

  describe("createViewStateProps", () => {
    it("should create view state props for 3D view", async () => {
      const iModel = createMockIModelConnection();
      
      const viewData: ITwin3dViewData = {
        type: "iTwin3d",
        origin: [0, 0, 0],
        extents: [100, 100, 100],
        categories: {
          enabled: ["0x10"],
        },
        models: {
          enabled: ["0x20"],
        },
      };

      const props = await createViewStateProps(iModel, viewData);

      expect(props).toBeDefined();
      expect(props.viewDefinitionProps).toBeDefined();
      expect(props.categorySelectorProps).toBeDefined();
      expect(props.displayStyleProps).toBeDefined();
    });

    it("should create view state props for 2D drawing", async () => {
      const iModel = createMockIModelConnection();
      
      const viewData: ITwinDrawingdata = {
        type: "iTwinDrawing",
        baseModelId: "0x100",
        origin: [0, 0],
        delta: [100, 100],
        angle: 0,
        modelExtents: {} as ITwinDrawingdata["modelExtents"],
        categories: {
          enabled: ["0x10"],
        },
      };

      const props = await createViewStateProps(iModel, viewData);

      expect(props).toBeDefined();
      expect(props.viewDefinitionProps).toBeDefined();
      expect(props.categorySelectorProps).toBeDefined();
      expect(props.displayStyleProps).toBeDefined();
    });

    it("should create view state props for sheet view", async () => {
      const iModel = createMockIModelConnection();
      
      const viewData: ITwinSheetData = {
        type: "iTwinSheet",
        baseModelId: "0x100",
        origin: [0, 0],
        delta: [100, 100],
        angle: 0,
        width: 11,
        height: 8.5,
        categories: {
          enabled: ["0x10"],
        },
      };

      const props = await createViewStateProps(iModel, viewData);

      expect(props).toBeDefined();
      expect(props.viewDefinitionProps).toBeDefined();
      expect(props.categorySelectorProps).toBeDefined();
      expect(props.displayStyleProps).toBeDefined();
    });
  });

  describe("createViewStateFromProps", () => {
    it("should create view state from props for 3D view", async () => {
      const iModel = createMockIModelConnection();
      
      const viewData: ITwin3dViewData = {
        type: "iTwin3d",
        origin: [0, 0, 0],
        extents: [100, 100, 100],
        categories: {
          enabled: ["0x10"],
        },
        models: {
          enabled: ["0x20"],
        },
      };

      const props = await createViewStateProps(iModel, viewData);
      const viewState = await createViewStateFromProps(props, iModel, viewData, {
        skipViewStateLoad: true,
      });

      expect(viewState).toBeDefined();
    });

    it("should create view state from props for drawing view", async () => {
      const iModel = createMockIModelConnection();
      
      const viewData: ITwinDrawingdata = {
        type: "iTwinDrawing",
        baseModelId: "0x100",
        origin: [0, 0],
        delta: [100, 100],
        angle: 0,
        modelExtents: {} as ITwinDrawingdata["modelExtents"],
        categories: {
          enabled: ["0x10"],
        },
      };

      const props = await createViewStateProps(iModel, viewData);
      const viewState = await createViewStateFromProps(props, iModel, viewData, {
        skipViewStateLoad: true,
      });

      expect(viewState).toBeDefined();
    });

    it("should skip load when requested in createViewStateFromProps", async () => {
      const iModel = createMockIModelConnection();
      
      const viewData: ITwin3dViewData = {
        type: "iTwin3d",
        origin: [0, 0, 0],
        extents: [100, 100, 100],
        categories: {
          enabled: ["0x10"],
        },
        models: {
          enabled: ["0x20"],
        },
      };

      const props = await createViewStateProps(iModel, viewData);
      const viewState = await createViewStateFromProps(props, iModel, viewData, {
        skipViewStateLoad: true,
      });

      expect(viewState).toBeDefined();
      // Note: iModel.views.load is called internally to fetch seed view state
    });
  });

  describe("Blank iModel", () => {
    it("should create view state for blank iModel connection", async () => {
      const iModel = createMockIModelConnection();
      iModel.isBlankConnection = vi.fn().mockReturnValue(true);
      
      const viewData: ITwin3dViewData = {
        type: "iTwin3d",
        origin: [0, 0, 0],
        extents: [100, 100, 100],
        categories: {
          enabled: ["0x10"],
        },
        models: {
          enabled: ["0x20"],
        },
      };

      const viewState = await createViewState(iModel, viewData, { skipViewStateLoad: true });

      expect(viewState).toBeDefined();
    });
  });

  describe("Empty Default View", () => {
    it("should handle iModel with no default views", async () => {
      const iModel = createMockIModelConnection();
      iModel.views.queryDefaultViewId = vi.fn().mockResolvedValue("");
      iModel.views.getViewList = vi.fn().mockResolvedValue([]);
      
      const viewData: ITwin3dViewData = {
        type: "iTwin3d",
        origin: [0, 0, 0],
        extents: [100, 100, 100],
        categories: {
          enabled: ["0x10"],
        },
        models: {
          enabled: ["0x20"],
        },
      };

      const viewState = await createViewState(iModel, viewData, { skipViewStateLoad: true });

      expect(viewState).toBeDefined();
    });
  });
});
