/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { vi } from "vitest";

// ============================================================================
// Selector mocks with clone/add/drop support
// ============================================================================

export function createMockCategorySelector(
  options: { id?: string; federationGuid?: string; categories?: string[] } = {},
) {
  const {
    id = "0x100",
    federationGuid = "cat-selector-guid",
    categories = [],
  } = options;

  const selector = {
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
        categories: [...selector.categories],
      }),
    ),
    addCategories: vi.fn((ids: string[]) => {
      selector.categories.push(...ids);
    }),
    dropCategories: vi.fn((ids: string[]) => {
      selector.categories = selector.categories.filter(
        (c: string) => !ids.includes(c),
      );
    }),
  };

  return selector;
}

export function createMockModelSelector(
  options: { id?: string; models?: string[] } = {},
) {
  const { id = "0x200", models = [] } = options;

  const selector = {
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
      createMockModelSelector({ id, models: [...selector.models] }),
    ),
    addModels: vi.fn((ids: string[]) => {
      selector.models.push(...ids);
    }),
    dropModels: vi.fn((ids: string[]) => {
      selector.models = selector.models.filter((m: string) => !ids.includes(m));
    }),
  };

  return selector;
}

export function createMockDisplayStyle(
  options: {
    id?: string;
    is3d?: boolean;
    scheduleScript?: unknown;
    timePoint?: number;
  } = {},
) {
  const {
    id = "0x300",
    is3d = true,
    scheduleScript = undefined,
    timePoint = undefined,
  } = options;

  return {
    id,
    classFullName: is3d ? "BisCore:DisplayStyle3d" : "BisCore:DisplayStyle2d",
    code: { spec: "0x1", scope: "0x1", value: "" },
    model: "0x10",
    scheduleScript,
    toJSON: vi.fn(() => ({
      classFullName: is3d ? "BisCore:DisplayStyle3d" : "BisCore:DisplayStyle2d",
      id,
      code: { spec: "0x1", scope: "0x1", value: "" },
      model: "0x10",
      jsonProperties: {
        styles: {
          ...(timePoint !== undefined && { timePoint }),
          ...(scheduleScript !== undefined && { scheduleScript }),
          viewflags: { renderMode: 6 },
        },
      },
    })),
  };
}

// ============================================================================
// Class stubs for instanceof checks
// CRITICAL: applySavedView uses instanceof for ViewState, ViewPose, ViewPose2d, ViewPose3d
//
// ⚠️ WARNING: The same class exported here MUST be used for both:
//   1. The module mock's ViewState export
//   2. Test instantiation (new MockViewState())
// If different classes are used, instanceof checks will silently fail.
// ============================================================================

/**
 * Thin MockViewState for applySavedView tests (bypasses createViewStateProps).
 * Sufficient for "viewState instanceof ViewState" check.
 */
export class MockViewState {
  toProps = vi.fn(() => ({
    viewDefinitionProps: {
      classFullName: "BisCore:SpatialViewDefinition",
      id: "0x400",
      code: { spec: "0x1", scope: "0x1", value: "" },
      model: "0x10",
      origin: [0, 0, 0],
      extents: [100, 100, 100],
      angles: { yaw: 0, pitch: 0, roll: 0 },
      cameraOn: false,
      camera: { lens: 90, focusDist: 1, eye: [0, 0, 0] },
    },
    categorySelectorProps: {
      classFullName: "BisCore:CategorySelector",
      id: "0x100",
      categories: [],
    },
    displayStyleProps: {
      classFullName: "BisCore:DisplayStyle3d",
      id: "0x300",
    },
    modelSelectorProps: {
      classFullName: "BisCore:ModelSelector",
      id: "0x200",
      models: [],
    },
  }));
  is3d = vi.fn(() => true);
  isSpatialView = vi.fn(() => true);
  isDrawingView = vi.fn(() => false);
  isSheetView = vi.fn(() => false);
  load = vi.fn(() => Promise.resolve());
}

/**
 * Rich seed ViewState for createViewState tests.
 * This is the ViewState returned by iModel.views.load
 */
export function createRichMockSeedViewState(
  type: "spatial" | "drawing" | "sheet" = "spatial",
) {
  const is3d = type === "spatial";
  const isDrawing = type === "drawing";
  const isSheet = type === "sheet";

  const categorySelector = createMockCategorySelector();
  const modelSelector = is3d ? createMockModelSelector() : undefined;
  const displayStyle = createMockDisplayStyle({ is3d });

  const base = {
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
    // Grid-related methods for SpatialViewState
    getAuxiliaryCoordinateSystemId: vi.fn(() => "0x0"),
    getAspectRatioSkew: vi.fn(() => 1),
    getGridOrientation: vi.fn(() => 0),
    getGridsPerRef: vi.fn(() => 10),
    getGridSpacing: vi.fn(() => ({ x: 1, y: 1 })),
    allow3dManipulations: vi.fn(() => true),
  };

  return base;
}

/**
 * Rich ViewState for createFromProps return.
 * This is returned by SpatialViewState.createFromProps, DrawingViewState.createFromProps, etc.
 */
export function createRichMockViewState(
  options: {
    is3d?: boolean;
    isDrawing?: boolean;
    cameraForKeepTest?: object;
  } = {},
) {
  const { is3d = true, isDrawing = false, cameraForKeepTest } = options;
  const isSheet = !is3d && !isDrawing;

  const categorySelector = createMockCategorySelector();
  const modelSelector = is3d ? createMockModelSelector() : undefined;
  const displayStyle = createMockDisplayStyle({ is3d });

  const viewState: Record<string, unknown> = {
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
        cameraOn: !!cameraForKeepTest,
        camera: cameraForKeepTest ?? { lens: 90, focusDist: 1, eye: [0, 0, 0] },
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
      id: "0x600",
      code: { spec: "0x1", scope: "0x1", value: "" },
      model: "0x10",
      origin: is3d ? [0, 0, 0] : [0, 0],
      extents: is3d ? [100, 100, 100] : [100, 100],
      angles: { yaw: 0, pitch: 0, roll: 0 },
      cameraOn: !!cameraForKeepTest,
      camera: cameraForKeepTest ?? { lens: 90, focusDist: 1, eye: [0, 0, 0] },
    })),
  };

  return viewState;
}

export class MockViewPose {}

export class MockViewPose3d extends MockViewPose {
  origin = { x: 0, y: 0, z: 0 };
  extents = { x: 100, y: 100, z: 100 };
  rotation = {
    toJSON: vi.fn(() => [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ]),
  };
  camera = { lens: 90, focusDist: 1, eye: { x: 0, y: 0, z: 0 } };
  cameraOn = true;
}

export class MockViewPose2d extends MockViewPose {
  origin = { x: 0, y: 0 };
  extents = { x: 100, y: 100 };
  angle = { radians: 0 };
}

// ============================================================================
// EmphasizeElements mock with configurable get() behavior
// ============================================================================

export function createEmphasizeElementsMock(): Record<string, unknown> {
  const instance = {
    clear: vi.fn(),
    fromJSON: vi.fn(),
    toJSON: vi.fn(() => ({})),
  };

  return {
    get: vi.fn(() => undefined), // Default: returns undefined (no emphasis)
    getOrCreate: vi.fn(() => instance),
    clear: vi.fn(),
    instance,
  };
}

// ============================================================================
// Full @itwin/core-frontend mock factory
// ============================================================================

export function createItwinFrontendMock(): Record<string, unknown> {
  const emphasizeElements = createEmphasizeElementsMock();

  return {
    ViewState: MockViewState,
    ViewPose: MockViewPose,
    ViewPose2d: MockViewPose2d,
    ViewPose3d: MockViewPose3d,
    SpatialViewState: {
      createFromProps: vi.fn(() => createRichMockViewState({ is3d: true })),
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
    IModelConnection: {
      // Basic IModelConnection methods
    },
    Viewport: {
      // Basic Viewport methods
    },
  };
}

// ============================================================================
// Helper to restore canonical defaults in beforeEach
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resetItwinFrontendMockDefaults(mock: any): void {
  // Reset EmphasizeElements to default (get returns undefined)
  mock.EmphasizeElements.get.mockReturnValue(undefined);
  mock.EmphasizeElements.getOrCreate.mockReturnValue(
    mock.EmphasizeElements.instance,
  );
  mock.EmphasizeElements.instance.clear.mockClear();
  mock.EmphasizeElements.instance.fromJSON.mockClear();

  // Reset ViewState factories
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
