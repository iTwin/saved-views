/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import type {
  DisplayStyleProps,
  QueryRowFormat,
  SpatialViewDefinitionProps,
  ViewDefinition2dProps,
} from "@itwin/core-common";
import { Camera, type CodeProps } from "@itwin/core-common";
import type {
  DrawingViewState,
  IModelConnection,
  SheetViewState,
  SpatialViewState,
  Viewport,
} from "@itwin/core-frontend";
import { vi } from "vitest";

/**
 * Creates a mock IModelConnection for testing
 */
export function createMockIModelConnection(): IModelConnection {
  const mockQueryReader = {
    toArray: vi.fn().mockResolvedValue([["0x1", "0x2", "0x3"]]),
  };

  const code: CodeProps = {
    spec: "test-spec",
    scope: "test-scope",
    value: "test-value",
  };

  // Create a minimal mock view state inline to avoid circular dependency
  const mockLoadedViewState = {
    isSpatialView: vi.fn().mockReturnValue(true),
    is3d: vi.fn().mockReturnValue(true),
    classFullName: "BisCore:SpatialViewDefinition",
    code,
    model: "0x1",
    id: "0x123",
    categorySelector: {
      id: "0x2",
      classFullName: "BisCore:CategorySelector",
      code,
      model: "0x1",
      toJSON: vi.fn().mockReturnValue({ categories: ["0x10", "0x11"] }),
    },
    modelSelector: {
      id: "0x4",
      classFullName: "BisCore:ModelSelector",
      code,
      model: "0x1",
      toJSON: vi.fn().mockReturnValue({ models: ["0x20", "0x21"] }),
      clone: vi.fn().mockReturnThis(),
      addModels: vi.fn(),
      dropModels: vi.fn(),
    },
    displayStyle: {
      id: "0x3",
      classFullName: "BisCore:DisplayStyle3d",
      code,
      model: "0x1",
      toJSON: vi.fn().mockReturnValue({ jsonProperties: { styles: {} } }),
    },
    getAuxiliaryCoordinateSystemId: vi.fn().mockReturnValue("0x0"),
    getAspectRatioSkew: vi.fn().mockReturnValue(1.0),
    getGridOrientation: vi.fn().mockReturnValue(0),
    getGridsPerRef: vi.fn().mockReturnValue(10),
    getGridSpacing: vi.fn().mockReturnValue({ x: 1.0, y: 1.0 }),
    allow3dManipulations: true,
  };

  return {
    isBlank: false,
    isBlankConnection: vi.fn().mockReturnValue(false),
    createQueryReader: vi.fn().mockReturnValue(mockQueryReader),
    views: {
      load: vi.fn().mockResolvedValue(mockLoadedViewState),
      queryDefaultViewId: vi.fn().mockResolvedValue("0x123"),
      getViewList: vi.fn().mockResolvedValue([{ id: "0x123" }]),
    },
    elements: {
      queryProps: vi.fn().mockResolvedValue([{ id: "0x123" }]),
    },
  } as unknown as IModelConnection;
}

/**
 * Creates a mock SpatialViewState for testing
 */
export function createMockSpatialViewState(
  overrides?: Partial<SpatialViewState>,
): SpatialViewState {
  const code: CodeProps = {
    spec: "test-spec",
    scope: "test-scope",
    value: "test-value",
  };

  const viewDefinitionProps: SpatialViewDefinitionProps = {
    origin: [0, 0, 0],
    extents: [100, 100, 100],
    angles: { yaw: 0, pitch: 0, roll: 0 },
    camera: new Camera(),
    cameraOn: false,
    classFullName: "BisCore:SpatialViewDefinition",
    code,
    model: "0x1",
    categorySelectorId: "0x2",
    displayStyleId: "0x3",
    modelSelectorId: "0x4",
    jsonProperties: {
      viewDetails: {
        acs: "0x0",
        aspectSkew: 1.0,
        gridOrient: 0,
        gridPerRef: 10,
        gridSpaceX: 1.0,
        gridSpaceY: 1.0,
        disable3dManipulations: false,
      },
    },
  };

  const displayStyleProps: DisplayStyleProps = {
    id: "0x3",
    classFullName: "BisCore:DisplayStyle3d",
    code,
    model: "0x1",
    jsonProperties: {
      styles: {},
    },
  };

  return {
    isSpatialView: vi.fn().mockReturnValue(true),
    is3d: vi.fn().mockReturnValue(true),
    toJSON: vi.fn().mockReturnValue(viewDefinitionProps),
    classFullName: "BisCore:SpatialViewDefinition",
    code,
    model: "0x1",
    id: "0x123",
    categorySelector: {
      id: "0x2",
      classFullName: "BisCore:CategorySelector",
      code,
      model: "0x1",
      toJSON: vi.fn().mockReturnValue({ categories: ["0x10", "0x11"] }),
    },
    modelSelector: {
      id: "0x4",
      classFullName: "BisCore:ModelSelector",
      code,
      model: "0x1",
      toJSON: vi.fn().mockReturnValue({ models: ["0x20", "0x21"] }),
      clone: vi.fn().mockReturnThis(),
      addModels: vi.fn(),
      dropModels: vi.fn(),
    },
    displayStyle: {
      id: "0x3",
      classFullName: "BisCore:DisplayStyle3d",
      code,
      model: "0x1",
      toJSON: vi.fn().mockReturnValue(displayStyleProps),
      scheduleScript: undefined,
    },
    getAuxiliaryCoordinateSystemId: vi.fn().mockReturnValue("0x0"),
    getAspectRatioSkew: vi.fn().mockReturnValue(1.0),
    getGridOrientation: vi.fn().mockReturnValue(0),
    getGridsPerRef: vi.fn().mockReturnValue(10),
    getGridSpacing: vi.fn().mockReturnValue({ x: 1.0, y: 1.0 }),
    allow3dManipulations: true,
    load: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as SpatialViewState;
}

/**
 * Creates a mock DrawingViewState for testing
 */
export function createMockDrawingViewState(
  overrides?: Partial<DrawingViewState>,
): DrawingViewState {
  const code: CodeProps = {
    spec: "test-spec",
    scope: "test-scope",
    value: "test-value",
  };

  const viewDefinitionProps: ViewDefinition2dProps = {
    baseModelId: "0x100",
    origin: [0, 0],
    delta: [100, 100],
    angle: 0,
    classFullName: "BisCore:DrawingViewDefinition",
    id: "0x123",
    code,
    model: "0x1",
    categorySelectorId: "0x2",
    displayStyleId: "0x3",
    isPrivate: false,
    description: "Test Drawing",
    jsonProperties: {
      viewDetails: {
        acs: "0x0",
        aspectSkew: 1.0,
        gridOrient: 0,
        gridPerRef: 10,
        gridSpaceX: 1.0,
        gridSpaceY: 1.0,
      },
    },
  };

  const displayStyleProps: DisplayStyleProps = {
    id: "0x3",
    classFullName: "BisCore:DisplayStyle",
    code,
    model: "0x1",
    jsonProperties: {
      styles: {},
    },
  };

  return {
    isDrawingView: vi.fn().mockReturnValue(true),
    toJSON: vi.fn().mockReturnValue(viewDefinitionProps),
    classFullName: "BisCore:DrawingViewDefinition",
    code,
    model: "0x1",
    id: "0x123",
    federationGuid: "test-guid",
    isPrivate: false,
    description: "Test Drawing",
    categorySelector: {
      id: "0x2",
      classFullName: "BisCore:CategorySelector",
      code,
      model: "0x1",
      federationGuid: "test-guid",
      toJSON: vi.fn().mockReturnValue({ categories: ["0x10", "0x11"] }),
      clone: vi.fn().mockReturnThis(),
      addCategories: vi.fn(),
      dropCategories: vi.fn(),
    },
    displayStyle: {
      id: "0x3",
      classFullName: "BisCore:DisplayStyle",
      code,
      model: "0x1",
      federationGuid: "test-guid",
      toJSON: vi.fn().mockReturnValue(displayStyleProps),
    },
    getAuxiliaryCoordinateSystemId: vi.fn().mockReturnValue("0x0"),
    getAspectRatioSkew: vi.fn().mockReturnValue(1.0),
    getGridOrientation: vi.fn().mockReturnValue(0),
    getGridsPerRef: vi.fn().mockReturnValue(10),
    getGridSpacing: vi.fn().mockReturnValue({ x: 1.0, y: 1.0 }),
    load: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as DrawingViewState;
}

/**
 * Creates a mock SheetViewState for testing
 */
export function createMockSheetViewState(
  overrides?: Partial<SheetViewState>,
): SheetViewState {
  const code: CodeProps = {
    spec: "test-spec",
    scope: "test-scope",
    value: "test-value",
  };

  const viewDefinitionProps: ViewDefinition2dProps = {
    baseModelId: "0x100",
    origin: [0, 0],
    delta: [100, 100],
    angle: 0,
    classFullName: "BisCore:SheetViewDefinition",
    id: "0x123",
    code,
    model: "0x1",
    categorySelectorId: "0x2",
    displayStyleId: "0x3",
    isPrivate: false,
    description: "Test Sheet",
    jsonProperties: {
      viewDetails: {
        acs: "0x0",
        aspectSkew: 1.0,
        gridOrient: 0,
        gridPerRef: 10,
        gridSpaceX: 1.0,
        gridSpaceY: 1.0,
      },
    },
  };

  const displayStyleProps: DisplayStyleProps = {
    id: "0x3",
    classFullName: "BisCore:DisplayStyle",
    code,
    model: "0x1",
    jsonProperties: {
      styles: {},
    },
  };

  return {
    toJSON: vi.fn().mockReturnValue(viewDefinitionProps),
    classFullName: "BisCore:SheetViewDefinition",
    code,
    model: "0x1",
    id: "0x123",
    federationGuid: "test-guid",
    isPrivate: false,
    description: "Test Sheet",
    sheetSize: { x: 11, y: 8.5 },
    attachmentIds: ["0x200", "0x201"],
    categorySelector: {
      id: "0x2",
      classFullName: "BisCore:CategorySelector",
      code,
      model: "0x1",
      federationGuid: "test-guid",
      toJSON: vi.fn().mockReturnValue({ categories: ["0x10", "0x11"] }),
      clone: vi.fn().mockReturnThis(),
      addCategories: vi.fn(),
      dropCategories: vi.fn(),
    },
    displayStyle: {
      id: "0x3",
      classFullName: "BisCore:DisplayStyle",
      code,
      model: "0x1",
      federationGuid: "test-guid",
      toJSON: vi.fn().mockReturnValue(displayStyleProps),
    },
    getAuxiliaryCoordinateSystemId: vi.fn().mockReturnValue("0x0"),
    getAspectRatioSkew: vi.fn().mockReturnValue(1.0),
    getGridOrientation: vi.fn().mockReturnValue(0),
    getGridsPerRef: vi.fn().mockReturnValue(10),
    getGridSpacing: vi.fn().mockReturnValue({ x: 1.0, y: 1.0 }),
    load: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as SheetViewState;
}

/**
 * Creates a mock Viewport for testing
 */
export function createMockViewport(
  view: SpatialViewState | DrawingViewState | SheetViewState,
  iModel: IModelConnection,
): Viewport {
  // Create a Map-like object for perModelCategoryVisibility
  const perModelCategoryVisibilityMap = new Map();
  
  return {
    view,
    iModel,
    findFeatureOverrideProviderOfType: vi.fn().mockReturnValue(undefined),
    perModelCategoryVisibility: {
      toJSON: vi.fn().mockReturnValue({}),
      [Symbol.iterator]: vi.fn().mockReturnValue(perModelCategoryVisibilityMap[Symbol.iterator]()),
    },
  } as unknown as Viewport;
}
