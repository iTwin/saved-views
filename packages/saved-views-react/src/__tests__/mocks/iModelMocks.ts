/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { vi } from "vitest";

// ============================================================================
// Internal mock factories (self-contained, no imports from itwinFrontendMocks)
// ============================================================================

function _createMockCategorySelector(
  options: { id?: string; categories?: string[]; } = {},
) {
  const { id = "0x100", categories = [] } = options;
  return {
    id,
    classFullName: "BisCore:CategorySelector",
    categories: [...categories],
    code: { spec: "0x1", scope: "0x1", value: "" },
    model: "0x10",
    federationGuid: "cat-selector-guid",
    toJSON: vi.fn(() => ({
      classFullName: "BisCore:CategorySelector",
      id,
      categories: [...categories],
    })),
    clone: vi.fn(() =>
      _createMockCategorySelector({ id, categories: [...categories] }),
    ),
    addCategories: vi.fn((ids: string[]) => {
      categories.push(...ids);
    }),
    dropCategories: vi.fn((_ids: string[]) => {}),
  };
}

function _createMockModelSelector(
  options: { id?: string; models?: string[]; } = {},
) {
  const { id = "0x200", models = [] } = options;
  return {
    id,
    classFullName: "BisCore:ModelSelector",
    models: [...models],
    code: { spec: "0x1", scope: "0x1", value: "" },
    model: "0x10",
    federationGuid: "model-selector-guid",
    toJSON: vi.fn(() => ({
      classFullName: "BisCore:ModelSelector",
      id,
      models: [...models],
    })),
    clone: vi.fn(() => _createMockModelSelector({ id, models: [...models] })),
    addModels: vi.fn((ids: string[]) => {
      models.push(...ids);
    }),
    dropModels: vi.fn((_ids: string[]) => {}),
  };
}

function _createMockDisplayStyle(options: { is3d?: boolean; } = {}) {
  const { is3d = true } = options;
  return {
    id: "0x300",
    classFullName: is3d ? "BisCore:DisplayStyle3d" : "BisCore:DisplayStyle2d",
    code: { spec: "0x1", scope: "0x1", value: "" },
    model: "0x10",
    federationGuid: "display-style-guid",
    toJSON: vi.fn(() => ({
      classFullName: is3d ? "BisCore:DisplayStyle3d" : "BisCore:DisplayStyle2d",
      id: "0x300",
      jsonProperties: { styles: { viewflags: { renderMode: 6 } } },
    })),
  };
}

function _createSeedViewState(
  type: "spatial" | "drawing" | "sheet" = "spatial",
) {
  const is3d = type === "spatial";
  const isDrawing = type === "drawing";
  const categorySelector = _createMockCategorySelector();
  const modelSelector = is3d ? _createMockModelSelector() : undefined;
  const displayStyle = _createMockDisplayStyle({ is3d });
  return {
    id: "0x500",
    code: { spec: "0x1", scope: "0x1", value: "" },
    model: "0x10",
    federationGuid: "seed-view-guid",
    isPrivate: false,
    description: "Seed ViewState",
    categorySelector,
    modelSelector,
    displayStyle,
    is3d: vi.fn(() => is3d),
    isSpatialView: vi.fn(() => is3d),
    isDrawingView: vi.fn(() => isDrawing),
    isSheetView: vi.fn(() => !is3d && !isDrawing),
    load: vi.fn(() => Promise.resolve()),
    toProps: vi.fn(() => ({
      viewDefinitionProps: {
        classFullName: is3d
          ? "BisCore:SpatialViewDefinition"
          : isDrawing
            ? "BisCore:DrawingViewDefinition"
            : "BisCore:SheetViewDefinition",
        id: "0x500",
        origin: is3d ? [0, 0, 0] : [0, 0],
        extents: is3d ? [100, 100, 100] : [100, 100],
      },
      categorySelectorProps: categorySelector.toJSON(),
      displayStyleProps: displayStyle.toJSON(),
      ...(is3d &&
        modelSelector && { modelSelectorProps: modelSelector.toJSON() }),
    })),
    getAuxiliaryCoordinateSystemId: vi.fn(() => "0x0"),
    getAspectRatioSkew: vi.fn(() => 1),
    getGridOrientation: vi.fn(() => 0),
    getGridsPerRef: vi.fn(() => 10),
    getGridSpacing: vi.fn(() => ({ x: 1, y: 1 })),
  };
}

function _createRichMockViewState(
  options: { is3d?: boolean; isDrawing?: boolean; } = {},
) {
  const { is3d = true, isDrawing = false } = options;
  const categorySelector = _createMockCategorySelector();
  const modelSelector = is3d ? _createMockModelSelector() : undefined;
  const displayStyle = _createMockDisplayStyle({ is3d });
  return {
    id: "0x600",
    categorySelector,
    modelSelector,
    displayStyle,
    is3d: vi.fn(() => is3d),
    isSpatialView: vi.fn(() => is3d),
    isDrawingView: vi.fn(() => isDrawing),
    isSheetView: vi.fn(() => !is3d && !isDrawing),
    load: vi.fn(() => Promise.resolve()),
    toProps: vi.fn(() => ({
      viewDefinitionProps: {
        classFullName: is3d
          ? "BisCore:SpatialViewDefinition"
          : isDrawing
            ? "BisCore:DrawingViewDefinition"
            : "BisCore:SheetViewDefinition",
        id: "0x600",
        origin: is3d ? [0, 0, 0] : [0, 0],
        extents: is3d ? [100, 100, 100] : [100, 100],
      },
      categorySelectorProps: categorySelector.toJSON(),
      displayStyleProps: displayStyle.toJSON(),
      ...(is3d &&
        modelSelector && { modelSelectorProps: modelSelector.toJSON() }),
    })),
  };
}

/**
 * Creates a mock IModelConnection.
 *
 * @param options Configuration options
 * @param options.isBlank Whether this is a blank connection
 * @param options.seedViewStateType The type of seed ViewState to return from views.load
 * @param options.queryPropsResults Results to return from elements.queryProps
 * @param options.getViewListResults Results to return from views.getViewList
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function createMockIModel(
  options: {
    isBlank?: boolean;
    seedViewStateType?: "spatial" | "drawing" | "sheet";
    queryPropsResults?: unknown[];
    getViewListResults?: Array<{ id: string; name: string; className: string; }>;
  } = {},
): Record<string, unknown> {
  const {
    isBlank = false,
    seedViewStateType = "spatial",
    queryPropsResults = [{ id: "0x1" }],
    getViewListResults = [
      { id: "0x1", name: "Default View", className: "SpatialViewDefinition" },
    ],
  } = options;

  const seedViewState = _createSeedViewState(seedViewStateType);

  return {
    isBlank,
    isBlankConnection: vi.fn(() => isBlank),
    elements: {
      queryProps: vi.fn().mockResolvedValue(queryPropsResults),
    },
    views: {
      load: vi.fn().mockResolvedValue(seedViewState),
      getViewList: vi.fn().mockResolvedValue(getViewListResults),
      queryDefaultViewId: vi.fn().mockResolvedValue("0x1"),
    },
    query: vi.fn().mockImplementation(async function* () {
      yield { id: "0x1" };
    }),
    createQueryReader: vi.fn().mockReturnValue({
      toArray: vi.fn().mockResolvedValue([{ id: "0x1" }]),
    }),
    // Mock for queryMissingCategories/Models
    categories: {
      queryCategories: vi.fn().mockResolvedValue([]),
    },
    models: {
      queryModels: vi.fn().mockResolvedValue([]),
    },
    // Methods for createViewState
    subcategories: {
      load: vi.fn().mockResolvedValue(undefined),
    },
    hilited: {
      clear: vi.fn(),
    },
    selectionSet: {
      elements: new Set<string>(),
    },
    seedViewState,
  };
}

/**
 * Create mock viewport with ITERABLE perModelCategoryVisibility.
 *
 * @param iModel Optional mock IModelConnection
 * @param perModelCategoryVisibilityEntries Entries for perModelCategoryVisibility iterator
 */
export function createMockViewport(
  iModel?: ReturnType<typeof createMockIModel>,
  perModelCategoryVisibilityEntries: Array<{
    modelId: string;
    categoryId: string;
    visible: boolean;
  }> = [],
): Record<string, unknown> {
  const iModelInstance = iModel ?? createMockIModel();
  const viewState = _createRichMockViewState({ is3d: true });

  return {
    iModel: iModelInstance,
    view: viewState,
    changeView: vi.fn(),
    changeCategoryDisplay: vi.fn(),
    perModelCategoryVisibility: {
      [Symbol.iterator]: function* () {
        for (const entry of perModelCategoryVisibilityEntries) {
          yield entry;
        }
      },
      setOverride: vi.fn(),
      clearOverrides: vi.fn(),
    },
    displayStyle: viewState.displayStyle,
    // For applySavedView
    viewFlags: {
      clone: vi.fn(() => ({})),
    },
    synchWithView: vi.fn(),
  };
}

/**
 * Creates viewport for capture tests with specific view state type.
 */
export function createCaptureViewport(
  viewType: "spatial" | "drawing" | "sheet" = "spatial",
  options: {
    hiddenCategories?: string[];
    hiddenModels?: string[];
    perModelCategoryVisibilityEntries?: Array<{
      modelId: string;
      categoryId: string;
      visible: boolean;
    }>;
    displayStyleOptions?: {
      scheduleScript?: unknown;
      timePoint?: number;
    };
  } = {},
): Record<string, unknown> {
  const {
    hiddenCategories = [],
    hiddenModels = [],
    perModelCategoryVisibilityEntries = [],
    displayStyleOptions = {},
  } = options;

  const is3d = viewType === "spatial";
  const isDrawing = viewType === "drawing";

  const iModel = createMockIModel({
    isBlank: false,
    seedViewStateType: viewType,
  });

  // Configure hidden categories/models queries
  const allCategories = ["0xcat1", "0xcat2", "0xcat3"];
  const enabledCategories = allCategories.filter(
    (c) => !hiddenCategories.includes(c),
  );

  const allModels = is3d ? ["0xmod1", "0xmod2", "0xmod3"] : [];
  const enabledModels = allModels.filter((m) => !hiddenModels.includes(m));

  const categorySelector = {
    id: "0x100",
    toJSON: vi.fn(() => ({
      classFullName: "BisCore:CategorySelector",
      id: "0x100",
      categories: enabledCategories,
    })),
  };

  const modelSelector = is3d
    ? {
        id: "0x200",
        toJSON: vi.fn(() => ({
          classFullName: "BisCore:ModelSelector",
          id: "0x200",
          models: enabledModels,
        })),
      }
    : undefined;

  const displayStyle = {
    id: "0x300",
    classFullName: is3d ? "BisCore:DisplayStyle3d" : "BisCore:DisplayStyle2d",
    scheduleScript: displayStyleOptions.scheduleScript,
    toJSON: vi.fn(() => ({
      classFullName: is3d ? "BisCore:DisplayStyle3d" : "BisCore:DisplayStyle2d",
      id: "0x300",
      code: { spec: "0x1", scope: "0x1", value: "" },
      model: "0x10",
      jsonProperties: {
        styles: {
          ...(displayStyleOptions.timePoint !== undefined && {
            timePoint: displayStyleOptions.timePoint,
          }),
          ...(displayStyleOptions.scheduleScript !== undefined && {
            scheduleScript: displayStyleOptions.scheduleScript,
          }),
          viewflags: { renderMode: 6 },
        },
      },
    })),
  };

  const viewState = {
    categorySelector,
    modelSelector,
    displayStyle,
    is3d: vi.fn(() => is3d),
    isSpatialView: vi.fn(() => is3d),
    isDrawingView: vi.fn(() => isDrawing),
    isSheetView: vi.fn(() => !is3d && !isDrawing),
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
      camera: { lens: 1.5707963267948966, focusDist: 1, eye: [0, 0, 0] }, // lens in radians
    })),
  };

  return {
    iModel,
    view: viewState,
    changeView: vi.fn(),
    changeCategoryDisplay: vi.fn(),
    perModelCategoryVisibility: {
      [Symbol.iterator]: function* () {
        for (const entry of perModelCategoryVisibilityEntries) {
          yield entry;
        }
      },
      setOverride: vi.fn(),
      clearOverrides: vi.fn(),
    },
    displayStyle,
    viewFlags: {
      clone: vi.fn(() => ({})),
    },
    synchWithView: vi.fn(),
  };
}
