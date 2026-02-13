/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================================
// ESM-safe mocking: Define mocks inline in vi.hoisted
// CRITICAL: vi.hoisted runs BEFORE imports, so all mock definitions must be inline
// ============================================================================

const {
  itwinFrontendMock,
  resetItwinFrontendMockDefaults,
  createRichMockSeedViewState,
  createRichMockViewState,
  createMockModelSelector,
  createMockCategorySelector,
} = vi.hoisted(() => {
  // Selector mocks
  function createMockCategorySelector(
    options: {
      id?: string;
      federationGuid?: string;
      categories?: string[];
    } = {},
  ) {
    const {
      id = "0x100",
      federationGuid = "cat-selector-guid",
      categories = [],
    } = options;
    const selector: Record<string, unknown> = {
      id,
      federationGuid,
      categories: [...categories],
      code: { spec: "0x1", scope: "0x1", value: "" },
      toJSON: vi.fn(() => ({
        classFullName: "BisCore:CategorySelector",
        id,
        code: selector.code,
        categories: selector.categories,
      })),
      clone: vi.fn(() =>
        createMockCategorySelector({
          id,
          federationGuid,
          categories: [...(selector.categories as string[])],
        }),
      ),
      addCategories: vi.fn((ids: string[]) => {
        (selector.categories as string[]).push(...ids);
      }),
      dropCategories: vi.fn((ids: string[]) => {
        selector.categories = (selector.categories as string[]).filter(
          (c: string) => !ids.includes(c),
        );
      }),
    };
    return selector;
  }

  function createMockModelSelector(
    options: { id?: string; models?: string[] } = {},
  ) {
    const { id = "0x200", models = [] } = options;
    const selector: Record<string, unknown> = {
      id,
      models: [...models],
      code: { spec: "0x1", scope: "0x1", value: "" },
      toJSON: vi.fn(() => ({
        classFullName: "BisCore:ModelSelector",
        id,
        code: selector.code,
        models: selector.models,
      })),
      clone: vi.fn(() =>
        createMockModelSelector({
          id,
          models: [...(selector.models as string[])],
        }),
      ),
      addModels: vi.fn((ids: string[]) => {
        (selector.models as string[]).push(...ids);
      }),
      dropModels: vi.fn((ids: string[]) => {
        selector.models = (selector.models as string[]).filter(
          (m: string) => !ids.includes(m),
        );
      }),
    };
    return selector;
  }

  function createMockDisplayStyle(
    options: { id?: string; is3d?: boolean } = {},
  ) {
    const { id = "0x300", is3d = true } = options;
    return {
      id,
      classFullName: is3d ? "BisCore:DisplayStyle3d" : "BisCore:DisplayStyle2d",
      code: { spec: "0x1", scope: "0x1", value: "" },
      model: "0x10",
      toJSON: vi.fn(() => ({
        classFullName: is3d
          ? "BisCore:DisplayStyle3d"
          : "BisCore:DisplayStyle2d",
        id,
        code: { spec: "0x1", scope: "0x1", value: "" },
        model: "0x10",
        jsonProperties: { styles: { viewflags: { renderMode: 6 } } },
      })),
    };
  }

  function createRichMockSeedViewState(
    type: "spatial" | "drawing" | "sheet" = "spatial",
  ) {
    const is3d = type === "spatial";
    const isDrawing = type === "drawing";
    const isSheet = type === "sheet";
    const categorySelector = createMockCategorySelector();
    const modelSelector = is3d ? createMockModelSelector() : undefined;
    const displayStyle = createMockDisplayStyle({ is3d });
    return {
      id: "0x500",
      federationGuid: "seed-view-guid",
      isPrivate: false,
      description: "Seed ViewState",
      categorySelector,
      modelSelector,
      displayStyle,
      is3d: vi.fn(() => is3d),
      isSpatialView: vi.fn(() => is3d),
      isDrawingView: vi.fn(() => isDrawing),
      isSheetView: vi.fn(() => isSheet),
      load: vi.fn(() => Promise.resolve()),
      toProps: vi.fn(() => ({
        viewDefinitionProps: {
          classFullName: is3d
            ? "BisCore:SpatialViewDefinition"
            : isDrawing
              ? "BisCore:DrawingViewDefinition"
              : "BisCore:SheetViewDefinition",
          id: "0x500",
          code: { spec: "0x1", scope: "0x1", value: "" },
          model: "0x10",
          origin: is3d ? [0, 0, 0] : [0, 0],
          extents: is3d ? [100, 100, 100] : [100, 100],
          angles: { yaw: 0, pitch: 0, roll: 0 },
          cameraOn: false,
          camera: { lens: 90, focusDist: 1, eye: [0, 0, 0] },
        },
        categorySelectorProps: categorySelector.toJSON(),
        displayStyleProps: displayStyle.toJSON(),
        ...(is3d &&
          modelSelector && { modelSelectorProps: modelSelector.toJSON() }),
      })),
      toJSON: vi.fn(() => ({
        classFullName: is3d
          ? "BisCore:SpatialViewDefinition"
          : isDrawing
            ? "BisCore:DrawingViewDefinition"
            : "BisCore:SheetViewDefinition",
        id: "0x500",
        code: { spec: "0x1", scope: "0x1", value: "" },
        model: "0x10",
        origin: is3d ? [0, 0, 0] : [0, 0],
        extents: is3d ? [100, 100, 100] : [100, 100],
        angles: { yaw: 0, pitch: 0, roll: 0 },
        cameraOn: false,
        camera: { lens: 90, focusDist: 1, eye: [0, 0, 0] },
      })),
      getAuxiliaryCoordinateSystemId: vi.fn(() => "0x0"),
      getAspectRatioSkew: vi.fn(() => 1),
      getGridOrientation: vi.fn(() => 0),
      getGridsPerRef: vi.fn(() => 10),
      getGridSpacing: vi.fn(() => ({ x: 1, y: 1 })),
      allow3dManipulations: vi.fn(() => true),
    };
  }

  function createRichMockViewState(
    options: { is3d?: boolean; isDrawing?: boolean } = {},
  ) {
    const { is3d = true, isDrawing = false } = options;
    const isSheet = !is3d && !isDrawing;
    const categorySelector = createMockCategorySelector();
    const modelSelector = is3d ? createMockModelSelector() : undefined;
    const displayStyle = createMockDisplayStyle({ is3d });
    return {
      id: "0x600",
      categorySelector,
      modelSelector,
      displayStyle,
      is3d: vi.fn(() => is3d),
      isSpatialView: vi.fn(() => is3d),
      isDrawingView: vi.fn(() => isDrawing),
      isSheetView: vi.fn(() => isSheet),
      load: vi.fn(() => Promise.resolve()),
      toProps: vi.fn(() => ({
        viewDefinitionProps: {
          classFullName: is3d
            ? "BisCore:SpatialViewDefinition"
            : isDrawing
              ? "BisCore:DrawingViewDefinition"
              : "BisCore:SheetViewDefinition",
          id: "0x600",
          code: { spec: "0x1", scope: "0x1", value: "" },
          model: "0x10",
          origin: is3d ? [0, 0, 0] : [0, 0],
          extents: is3d ? [100, 100, 100] : [100, 100],
          angles: { yaw: 0, pitch: 0, roll: 0 },
          cameraOn: false,
          camera: { lens: 90, focusDist: 1, eye: [0, 0, 0] },
        },
        categorySelectorProps: categorySelector.toJSON(),
        displayStyleProps: displayStyle.toJSON(),
        ...(is3d &&
          modelSelector && { modelSelectorProps: modelSelector.toJSON() }),
      })),
    };
  }

  class MockViewState {
    is3d = vi.fn(() => true);
    isSpatialView = vi.fn(() => true);
    isDrawingView = vi.fn(() => false);
    isSheetView = vi.fn(() => false);
  }

  class MockViewPose {}

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
    SpatialViewState: {
      createFromProps: vi.fn(() => createRichMockViewState({ is3d: true })),
      createBlank: vi.fn(() => {
        const blankView = createRichMockViewState({ is3d: true });
        // Add grid/acs methods required by createViewState for blank iModels
        (blankView as any).getAuxiliaryCoordinateSystemId = vi.fn(() => "0x0");
        (blankView as any).getAspectRatioSkew = vi.fn(() => 1);
        (blankView as any).getGridOrientation = vi.fn(() => 0);
        (blankView as any).getGridsPerRef = vi.fn(() => 10);
        (blankView as any).getGridSpacing = vi.fn(() => ({ x: 1, y: 1 }));
        (blankView as any).code = { spec: "0x1", scope: "0x1", value: "" };
        (blankView as any).model = "0x10";
        (blankView as any).federationGuid = "blank-view-guid";
        (blankView as any).isPrivate = false;
        (blankView as any).description = "Blank ViewState";
        return blankView;
      }),
    },
    DrawingViewState: {
      createFromProps: vi.fn(() =>
        createRichMockViewState({ is3d: false, isDrawing: true }),
      ),
    },
    SheetViewState: {
      createFromProps: vi.fn(() =>
        createRichMockViewState({ is3d: false, isDrawing: false }),
      ),
    },
    EmphasizeElements: emphasizeElements,
    IModelConnection: {},
    Viewport: {},
  };

  function resetItwinFrontendMockDefaults(mock: typeof itwinFrontendMock) {
    mock.EmphasizeElements.get.mockReturnValue(undefined);
    mock.EmphasizeElements.getOrCreate.mockReturnValue(
      mock.EmphasizeElements.instance,
    );
    mock.EmphasizeElements.instance.clear.mockClear();
    mock.EmphasizeElements.instance.fromJSON.mockClear();
    mock.SpatialViewState.createFromProps.mockImplementation(() =>
      createRichMockViewState({ is3d: true }),
    );
    mock.DrawingViewState.createFromProps.mockImplementation(() =>
      createRichMockViewState({ is3d: false, isDrawing: true }),
    );
    mock.SheetViewState.createFromProps.mockImplementation(() =>
      createRichMockViewState({ is3d: false, isDrawing: false }),
    );
  }

  return {
    itwinFrontendMock,
    resetItwinFrontendMockDefaults,
    createRichMockSeedViewState,
    createRichMockViewState,
    createMockModelSelector,
    createMockCategorySelector,
  };
});

vi.mock("@itwin/core-frontend", () => itwinFrontendMock);

import {
  createViewState,
  createViewStateProps,
  createViewStateFromProps,
} from "../createViewState.js";
import type {
  ITwin3dViewData,
  ITwinDrawingdata,
  ITwinSheetData,
} from "../SavedView.js";

// Import helper for mocks - safe because they don't need to be hoisted
import { createMockIModel } from "./mocks/iModelMocks.js";

// ============================================================================
// Fixtures
// ============================================================================

const iTwin3dViewData: ITwin3dViewData = {
  type: "iTwin3d",
  origin: [0, 0, 0],
  extents: [100, 100, 100],
  angles: { yaw: 0, pitch: 0, roll: 0 },
  categories: { enabled: ["0xcat1", "0xcat2"], disabled: ["0xcat3"] },
  models: { enabled: ["0xmod1", "0xmod2"], disabled: ["0xmod3"] },
  displayStyle: { viewflags: { renderMode: 6 } },
};

const iTwinDrawingData: ITwinDrawingdata = {
  type: "iTwinDrawing",
  origin: [0, 0],
  extents: [500, 500],
  angle: 0,
  baseModelId: "0x1000",
  categories: { enabled: ["0xcat1"], disabled: [] },
  displayStyle: { viewflags: { renderMode: 6 } },
};

const iTwinSheetData: ITwinSheetData = {
  type: "iTwinSheet",
  origin: [0, 0],
  extents: [200, 300],
  angle: 0,
  baseModelId: "0x2000",
  width: 200,
  height: 300,
  categories: { enabled: ["0xcat1"], disabled: [] },
  displayStyle: { viewflags: { renderMode: 6 } },
};

// ============================================================================
// Tests
// ============================================================================

describe("createViewState", () => {
  let mockIModel: ReturnType<typeof createMockIModel>;

  beforeEach(() => {
    vi.clearAllMocks();
    resetItwinFrontendMockDefaults(itwinFrontendMock);
    mockIModel = createMockIModel();
  });

  describe("view type creation", () => {
    it("creates SpatialViewState for iTwin3d", async () => {
      await createViewState(mockIModel as never, iTwin3dViewData);

      expect(
        itwinFrontendMock.SpatialViewState.createFromProps,
      ).toHaveBeenCalled();
    });

    it("creates DrawingViewState for iTwinDrawing", async () => {
      // Override seed view state type for drawing
      mockIModel = createMockIModel({ seedViewStateType: "drawing" });

      await createViewState(mockIModel as never, iTwinDrawingData);

      expect(
        itwinFrontendMock.DrawingViewState.createFromProps,
      ).toHaveBeenCalled();
    });

    it("creates SheetViewState for iTwinSheet", async () => {
      // Override seed view state type for sheet
      mockIModel = createMockIModel({ seedViewStateType: "sheet" });

      await createViewState(mockIModel as never, iTwinSheetData);

      expect(
        itwinFrontendMock.SheetViewState.createFromProps,
      ).toHaveBeenCalled();
    });
  });

  describe("view state load", () => {
    it("calls ViewState.load by default", async () => {
      const viewState = await createViewState(
        mockIModel as never,
        iTwin3dViewData,
      );

      expect(viewState.load).toHaveBeenCalled();
    });

    it("skips load when skipViewStateLoad=true", async () => {
      const viewState = await createViewState(
        mockIModel as never,
        iTwin3dViewData,
        {
          skipViewStateLoad: true,
        },
      );

      expect(viewState.load).not.toHaveBeenCalled();
    });
  });

  describe("blank iModel handling", () => {
    it("handles blank iModel connection", async () => {
      mockIModel = createMockIModel({ isBlank: true });

      // Should not throw
      const viewState = await createViewState(
        mockIModel as never,
        iTwin3dViewData,
      );

      expect(viewState).toBeDefined();
    });
  });

  describe("fallback paths", () => {
    it("fallback: invalid default view uses first from view list", async () => {
      // Setup: queryProps returns empty (no default view)
      mockIModel.elements.queryProps.mockResolvedValue([]);
      // Setup: getViewList returns a view
      mockIModel.views.getViewList.mockResolvedValue([
        {
          id: "0x2",
          name: "Fallback View",
          className: "SpatialViewDefinition",
        },
      ]);

      await createViewState(mockIModel as never, iTwin3dViewData);

      // Should have called getViewList
      expect(mockIModel.views.getViewList).toHaveBeenCalled();
    });
  });

  describe("model selector settings", () => {
    it("with models enabled=show: clone called on createFromProps result, addModels called", async () => {
      // Create a known selector we can inspect
      const knownModelSelector = createMockModelSelector();
      const viewStateForTest = createRichMockViewState({ is3d: true });
      viewStateForTest.modelSelector = knownModelSelector;

      itwinFrontendMock.SpatialViewState.createFromProps.mockImplementationOnce(
        () => viewStateForTest,
      );

      const result = await createViewState(
        mockIModel as never,
        iTwin3dViewData,
        {
          models: { enabled: "show", disabled: "ignore", other: "ignore" },
        },
      );

      // Assert on the selector from createFromProps result
      expect(knownModelSelector.clone).toHaveBeenCalled();
      const clonedSelector = knownModelSelector.clone.mock.results[0].value;
      expect(clonedSelector.addModels).toHaveBeenCalledWith(
        iTwin3dViewData.models.enabled,
      );
      expect(result.modelSelector).toBe(clonedSelector);
    });

    it("with models enabled=hide: clone called on createFromProps result, dropModels called", async () => {
      const knownModelSelector = createMockModelSelector();
      const viewStateForTest = createRichMockViewState({ is3d: true });
      viewStateForTest.modelSelector = knownModelSelector;

      itwinFrontendMock.SpatialViewState.createFromProps.mockImplementationOnce(
        () => viewStateForTest,
      );

      const result = await createViewState(
        mockIModel as never,
        iTwin3dViewData,
        {
          models: { enabled: "hide", disabled: "ignore", other: "ignore" },
        },
      );

      expect(knownModelSelector.clone).toHaveBeenCalled();
      const clonedSelector = knownModelSelector.clone.mock.results[0].value;
      expect(clonedSelector.dropModels).toHaveBeenCalledWith(
        iTwin3dViewData.models.enabled,
      );
      expect(result.modelSelector).toBe(clonedSelector);
    });

    it("with models disabled=show: addModels called with disabled models", async () => {
      const knownModelSelector = createMockModelSelector();
      const viewStateForTest = createRichMockViewState({ is3d: true });
      viewStateForTest.modelSelector = knownModelSelector;

      itwinFrontendMock.SpatialViewState.createFromProps.mockImplementationOnce(
        () => viewStateForTest,
      );

      await createViewState(mockIModel as never, iTwin3dViewData, {
        models: { enabled: "ignore", disabled: "show", other: "ignore" },
      });

      const clonedSelector = knownModelSelector.clone.mock.results[0].value;
      expect(clonedSelector.addModels).toHaveBeenCalledWith(
        iTwin3dViewData.models.disabled,
      );
    });

    it("with models disabled=hide: dropModels called with disabled models", async () => {
      const knownModelSelector = createMockModelSelector();
      const viewStateForTest = createRichMockViewState({ is3d: true });
      viewStateForTest.modelSelector = knownModelSelector;

      itwinFrontendMock.SpatialViewState.createFromProps.mockImplementationOnce(
        () => viewStateForTest,
      );

      await createViewState(mockIModel as never, iTwin3dViewData, {
        models: { enabled: "ignore", disabled: "hide", other: "ignore" },
      });

      const clonedSelector = knownModelSelector.clone.mock.results[0].value;
      expect(clonedSelector.dropModels).toHaveBeenCalledWith(
        iTwin3dViewData.models.disabled,
      );
    });
  });

  describe("category selector settings", () => {
    it("with categories enabled=show (subcategories=ignore): clone called, addCategories called", async () => {
      const knownCategorySelector = createMockCategorySelector();
      const viewStateForTest = createRichMockViewState({ is3d: true });
      viewStateForTest.categorySelector = knownCategorySelector;

      itwinFrontendMock.SpatialViewState.createFromProps.mockImplementationOnce(
        () => viewStateForTest,
      );

      const result = await createViewState(
        mockIModel as never,
        iTwin3dViewData,
        {
          categories: { enabled: "show", disabled: "ignore", other: "ignore" },
          subcategories: "ignore",
        },
      );

      expect(knownCategorySelector.clone).toHaveBeenCalled();
      const clonedSelector = knownCategorySelector.clone.mock.results[0].value;
      expect(clonedSelector.addCategories).toHaveBeenCalledWith(
        iTwin3dViewData.categories.enabled,
      );
      expect(result.categorySelector).toBe(clonedSelector);
    });

    it("with categories enabled=hide: dropCategories called", async () => {
      const knownCategorySelector = createMockCategorySelector();
      const viewStateForTest = createRichMockViewState({ is3d: true });
      viewStateForTest.categorySelector = knownCategorySelector;

      itwinFrontendMock.SpatialViewState.createFromProps.mockImplementationOnce(
        () => viewStateForTest,
      );

      await createViewState(mockIModel as never, iTwin3dViewData, {
        categories: { enabled: "hide", disabled: "ignore", other: "ignore" },
        subcategories: "ignore",
      });

      const clonedSelector = knownCategorySelector.clone.mock.results[0].value;
      expect(clonedSelector.dropCategories).toHaveBeenCalledWith(
        iTwin3dViewData.categories.enabled,
      );
    });

    it("with categories disabled=show: addCategories called with disabled categories", async () => {
      const knownCategorySelector = createMockCategorySelector();
      const viewStateForTest = createRichMockViewState({ is3d: true });
      viewStateForTest.categorySelector = knownCategorySelector;

      itwinFrontendMock.SpatialViewState.createFromProps.mockImplementationOnce(
        () => viewStateForTest,
      );

      await createViewState(mockIModel as never, iTwin3dViewData, {
        categories: { enabled: "ignore", disabled: "show", other: "ignore" },
        subcategories: "ignore",
      });

      const clonedSelector = knownCategorySelector.clone.mock.results[0].value;
      expect(clonedSelector.addCategories).toHaveBeenCalledWith(
        iTwin3dViewData.categories.disabled,
      );
    });
  });

  describe("ignore settings (no mutation)", () => {
    it("with all settings=ignore: clone is NOT called", async () => {
      const knownModelSelector = createMockModelSelector();
      const knownCategorySelector = createMockCategorySelector();
      const viewStateForTest = createRichMockViewState({ is3d: true });
      viewStateForTest.modelSelector = knownModelSelector;
      viewStateForTest.categorySelector = knownCategorySelector;

      itwinFrontendMock.SpatialViewState.createFromProps.mockImplementationOnce(
        () => viewStateForTest,
      );

      await createViewState(mockIModel as never, iTwin3dViewData, {
        models: { enabled: "ignore", disabled: "ignore", other: "ignore" },
        categories: { enabled: "ignore", disabled: "ignore", other: "ignore" },
        subcategories: "ignore",
      });

      // When all settings are "ignore", selectors should not be cloned/modified
      expect(knownModelSelector.clone).not.toHaveBeenCalled();
      expect(knownCategorySelector.clone).not.toHaveBeenCalled();
    });
  });
});

describe("createViewStateProps", () => {
  let mockIModel: ReturnType<typeof createMockIModel>;

  beforeEach(() => {
    vi.clearAllMocks();
    resetItwinFrontendMockDefaults(itwinFrontendMock);
    mockIModel = createMockIModel();
  });

  it("returns proper ViewStateProps structure for 3D", async () => {
    const props = await createViewStateProps(
      mockIModel as never,
      iTwin3dViewData,
    );

    expect(props.viewDefinitionProps).toBeDefined();
    expect(props.categorySelectorProps).toBeDefined();
    expect(props.displayStyleProps).toBeDefined();
    expect(props.modelSelectorProps).toBeDefined();
  });

  it("reads grid settings from seed ViewState", async () => {
    const props = await createViewStateProps(
      mockIModel as never,
      iTwin3dViewData,
    );

    // The seed view state's grid methods should have been called
    const seedViewState = mockIModel.seedViewState;
    expect(seedViewState.getGridSpacing).toHaveBeenCalled();
    expect(seedViewState.getGridOrientation).toHaveBeenCalled();
    expect(seedViewState.getGridsPerRef).toHaveBeenCalled();
    expect(seedViewState.getAuxiliaryCoordinateSystemId).toHaveBeenCalled();
    expect(seedViewState.getAspectRatioSkew).toHaveBeenCalled();
  });

  it("reads federationGuid from seed for Drawing view", async () => {
    mockIModel = createMockIModel({ seedViewStateType: "drawing" });

    const props = await createViewStateProps(
      mockIModel as never,
      iTwinDrawingData,
    );

    // Props should contain federationGuid from seed
    expect(props.viewDefinitionProps.federationGuid).toBe("seed-view-guid");
  });

  it("includes origin and extents from view data", async () => {
    const props = await createViewStateProps(
      mockIModel as never,
      iTwin3dViewData,
    );

    expect(props.viewDefinitionProps.origin).toEqual(iTwin3dViewData.origin);
    expect(props.viewDefinitionProps.extents).toEqual(iTwin3dViewData.extents);
  });

  it("includes categories from view data", async () => {
    const props = await createViewStateProps(
      mockIModel as never,
      iTwin3dViewData,
    );

    expect(props.categorySelectorProps.categories).toEqual(
      iTwin3dViewData.categories.enabled,
    );
  });

  it("includes models from view data (3D)", async () => {
    const props = await createViewStateProps(
      mockIModel as never,
      iTwin3dViewData,
    );

    expect(props.modelSelectorProps?.models).toEqual(
      iTwin3dViewData.models.enabled,
    );
  });
});

describe("createViewStateFromProps", () => {
  let mockIModel: ReturnType<typeof createMockIModel>;

  beforeEach(() => {
    vi.clearAllMocks();
    resetItwinFrontendMockDefaults(itwinFrontendMock);
    mockIModel = createMockIModel();
  });

  it("creates ViewState from props for 3D", async () => {
    const props = await createViewStateProps(
      mockIModel as never,
      iTwin3dViewData,
    );
    const viewState = await createViewStateFromProps(
      props,
      mockIModel as never,
      iTwin3dViewData,
    );

    expect(
      itwinFrontendMock.SpatialViewState.createFromProps,
    ).toHaveBeenCalled();
    expect(viewState).toBeDefined();
  });

  it("creates ViewState from props for Drawing", async () => {
    mockIModel = createMockIModel({ seedViewStateType: "drawing" });
    const props = await createViewStateProps(
      mockIModel as never,
      iTwinDrawingData,
    );
    const viewState = await createViewStateFromProps(
      props,
      mockIModel as never,
      iTwinDrawingData,
    );

    expect(
      itwinFrontendMock.DrawingViewState.createFromProps,
    ).toHaveBeenCalled();
    expect(viewState).toBeDefined();
  });

  it("creates ViewState from props for Sheet", async () => {
    mockIModel = createMockIModel({ seedViewStateType: "sheet" });
    const props = await createViewStateProps(
      mockIModel as never,
      iTwinSheetData,
    );
    const viewState = await createViewStateFromProps(
      props,
      mockIModel as never,
      iTwinSheetData,
    );

    expect(itwinFrontendMock.SheetViewState.createFromProps).toHaveBeenCalled();
    expect(viewState).toBeDefined();
  });

  it("applies settings when provided", async () => {
    const knownModelSelector = createMockModelSelector();
    const viewStateForTest = createRichMockViewState({ is3d: true });
    viewStateForTest.modelSelector = knownModelSelector;

    itwinFrontendMock.SpatialViewState.createFromProps.mockImplementationOnce(
      () => viewStateForTest,
    );

    const props = await createViewStateProps(
      mockIModel as never,
      iTwin3dViewData,
    );
    await createViewStateFromProps(
      props,
      mockIModel as never,
      iTwin3dViewData,
      {
        models: { enabled: "show", disabled: "ignore", other: "ignore" },
      },
    );

    // Settings should be applied
    expect(knownModelSelector.clone).toHaveBeenCalled();
  });
});
