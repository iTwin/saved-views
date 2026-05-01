/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================================
// ESM-safe mocking: Define mocks inline in vi.hoisted
// CRITICAL: vi.hoisted runs BEFORE imports, so all mock definitions must be inline
// ============================================================================

// Create complete mock INSIDE vi.hoisted - no external imports allowed here
const { itwinFrontendMock, MockViewState, resetItwinFrontendMockDefaults } =
  vi.hoisted(() => {
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
        toJSON: () => ({
          classFullName: "BisCore:CategorySelector",
          id,
          code: selector.code,
          categories: selector.categories,
        }),
        clone: () =>
          createMockCategorySelector({
            id,
            federationGuid,
            categories: [...(selector.categories as string[])],
          }),
        addCategories: (ids: string[]) => {
          (selector.categories as string[]).push(...ids);
        },
        dropCategories: (ids: string[]) => {
          selector.categories = (selector.categories as string[]).filter(
            (c: string) => !ids.includes(c),
          );
        },
      };
      return selector;
    }

    function createMockModelSelector(
      options: { id?: string; models?: string[]; } = {},
    ) {
      const { id = "0x200", models = [] } = options;
      const selector: Record<string, unknown> = {
        id,
        models: [...models],
        code: { spec: "0x1", scope: "0x1", value: "" },
        toJSON: () => ({
          classFullName: "BisCore:ModelSelector",
          id,
          code: selector.code,
          models: selector.models,
        }),
        clone: () =>
          createMockModelSelector({
            id,
            models: [...(selector.models as string[])],
          }),
        addModels: (ids: string[]) => {
          (selector.models as string[]).push(...ids);
        },
        dropModels: (ids: string[]) => {
          selector.models = (selector.models as string[]).filter(
            (m: string) => !ids.includes(m),
          );
        },
      };
      return selector;
    }

    function createMockDisplayStyle(
      options: { id?: string; is3d?: boolean; } = {},
    ) {
      const { id = "0x300", is3d = true } = options;
      return {
        id,
        classFullName: is3d
          ? "BisCore:DisplayStyle3d"
          : "BisCore:DisplayStyle2d",
        code: { spec: "0x1", scope: "0x1", value: "" },
        model: "0x10",
        toJSON: () => ({
          classFullName: is3d
            ? "BisCore:DisplayStyle3d"
            : "BisCore:DisplayStyle2d",
          id,
          code: { spec: "0x1", scope: "0x1", value: "" },
          model: "0x10",
          jsonProperties: { styles: { viewflags: { renderMode: 6 } } },
        }),
      };
    }

    // ViewState class for instanceof
    class MockViewState {
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

    class MockViewPose {}
    class MockViewPose3d extends MockViewPose {
      origin = { x: 0, y: 0, z: 0 };
      extents = { x: 100, y: 100, z: 100 };
      rotation = {
        toJSON: () => [
          [1, 0, 0],
          [0, 1, 0],
          [0, 0, 1],
        ],
      };
      camera = { lens: 90, focusDist: 1, eye: { x: 0, y: 0, z: 0 } };
      cameraOn = true;
    }

    function createRichMockViewState(
      options: { is3d?: boolean; isDrawing?: boolean; } = {},
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
        is3d: () => is3d,
        isSpatialView: () => is3d,
        isDrawingView: () => isDrawing,
        isSheetView: () => isSheet,
        load: () => Promise.resolve(),
        toProps: () => ({
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
        }),
      };
    }

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
      PerModelCategoryVisibility: {
        Override: {
          Show: 1,
          Hide: 2,
          None: 0,
        },
      },
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
      MockViewState,
      MockViewPose3d,
      createRichMockViewState,
      resetItwinFrontendMockDefaults,
    };
  });

vi.mock("@itwin/core-frontend", () => itwinFrontendMock);

// Now import module under test AFTER vi.mock
import { applySavedView } from "../applySavedView.js";
import type { SavedViewData, ITwin3dViewData } from "../SavedView.js";

// Import helper for mocks - safe because they don't need to be hoisted
import { createMockIModel, createMockViewport } from "./mocks/iModelMocks.js";

// ============================================================================
// Fixtures
// ============================================================================

const minimal3dViewData: ITwin3dViewData = {
  type: "iTwin3d",
  origin: [0, 0, 0],
  extents: [100, 100, 100],
  angles: { yaw: 0, pitch: 0, roll: 0 },
  categories: { enabled: [], disabled: [] },
  models: { enabled: [], disabled: [] },
  displayStyle: { viewflags: { renderMode: 6 } },
};

const minimalSavedViewData: SavedViewData = {
  viewData: minimal3dViewData,
  extensions: [],
};

const savedViewWithEmphasis: SavedViewData = {
  viewData: minimal3dViewData,
  extensions: [
    {
      extensionName: "EmphasizeElements",
      data: JSON.stringify({
        emphasizeElementsProps: {
          neverDrawn: ["0x100"],
          alwaysDrawn: ["0x200"],
          wantEmphasis: true,
        },
      }),
    },
  ],
};

const savedViewWithPMCV: SavedViewData = {
  viewData: minimal3dViewData,
  extensions: [
    {
      extensionName: "PerModelCategoryVisibility",
      data: JSON.stringify({
        perModelCategoryVisibilityProps: [
          { modelId: "0x300", categoryId: "0x100", visible: true },
          { modelId: "0x300", categoryId: "0x101", visible: false },
        ],
      }),
    },
  ],
};

const savedViewWithBothExtensions: SavedViewData = {
  viewData: minimal3dViewData,
  extensions: [
    ...savedViewWithEmphasis.extensions!,
    ...savedViewWithPMCV.extensions!,
  ],
};

// ============================================================================
// Tests
// ============================================================================

describe("applySavedView", () => {
  let mockIModel: ReturnType<typeof createMockIModel>;
  let mockViewport: ReturnType<typeof createMockViewport>;

  beforeEach(() => {
    vi.clearAllMocks();
    resetItwinFrontendMockDefaults(itwinFrontendMock);

    mockIModel = createMockIModel();
    mockViewport = createMockViewport(mockIModel);

    // Default: settings.viewState = new MockViewState() to bypass createViewStateProps
    // This causes the instanceof ViewState check to pass
  });

  describe("core functionality", () => {
    it("calls viewport.changeView", async () => {
      await applySavedView(
        mockIModel as never,
        mockViewport as never,
        minimalSavedViewData,
        { viewState: new MockViewState() },
      );

      expect(mockViewport.changeView).toHaveBeenCalled();
    });

    it("applies camera from saved view data (non-ViewPose branch)", async () => {
      await applySavedView(
        mockIModel as never,
        mockViewport as never,
        minimalSavedViewData,
        { viewState: new MockViewState() },
      );

      // Control flow verified by changeView being called
      expect(mockViewport.changeView).toHaveBeenCalled();
    });

    it("forwards viewChangeOptions to changeView", async () => {
      const viewChangeOptions = { animateFrustumChange: true };

      await applySavedView(
        mockIModel as never,
        mockViewport as never,
        minimalSavedViewData,
        {
          viewState: new MockViewState(),
          viewChangeOptions,
        },
      );

      expect(mockViewport.changeView).toHaveBeenCalledWith(
        expect.anything(),
        viewChangeOptions,
      );
    });
  });

  describe("viewState handling", () => {
    it("keeps ViewState when viewState='keep'", async () => {
      const viewToProps = vi.fn(() => ({
        viewDefinitionProps: {
          classFullName: "BisCore:SpatialViewDefinition",
          id: "0x400",
          origin: [0, 0, 0],
          extents: [100, 100, 100],
          cameraOn: true,
          camera: { lens: 90, focusDist: 1, eye: [0, 0, 0] },
        },
        categorySelectorProps: { categories: [] },
        displayStyleProps: {},
        modelSelectorProps: { models: [] },
      }));

      mockViewport.view.toProps = viewToProps;

      await applySavedView(
        mockIModel as never,
        mockViewport as never,
        minimalSavedViewData,
        { viewState: "keep" },
      );

      expect(viewToProps).toHaveBeenCalled();
    });

    it("uses custom ViewState instance when viewState is ViewState (instanceof branch)", async () => {
      const mockViewStateInstance = new MockViewState();

      await applySavedView(
        mockIModel as never,
        mockViewport as never,
        minimalSavedViewData,
        { viewState: mockViewStateInstance },
      );

      // mockViewStateInstance.toProps should be called, NOT viewport.view.toProps
      expect(mockViewStateInstance.toProps).toHaveBeenCalled();
    });
  });

  describe("camera handling", () => {
    it("keeps camera when camera='keep'", async () => {
      const keptCamera = { lens: 45, focusDist: 50, eye: [10, 20, 30] };

      mockViewport.view.toProps = vi.fn(() => ({
        viewDefinitionProps: {
          classFullName: "BisCore:SpatialViewDefinition",
          id: "0x400",
          origin: [0, 0, 0],
          extents: [100, 100, 100],
          cameraOn: true,
          camera: keptCamera,
        },
        categorySelectorProps: { categories: [] },
        displayStyleProps: {},
        modelSelectorProps: { models: [] },
      }));

      await applySavedView(
        mockIModel as never,
        mockViewport as never,
        minimalSavedViewData,
        {
          viewState: new MockViewState(),
          camera: "keep",
        },
      );

      // The camera from viewport.view.toProps should be used
      expect(mockViewport.view.toProps).toHaveBeenCalled();
    });
  });

  describe("emphasis extension", () => {
    it("apply calls EmphasizeElements.getOrCreate.fromJSON", async () => {
      // Setup: get() returns undefined initially (no existing emphasis)
      itwinFrontendMock.EmphasizeElements.get.mockReturnValue(undefined);

      await applySavedView(
        mockIModel as never,
        mockViewport as never,
        savedViewWithEmphasis,
        {
          viewState: new MockViewState(),
          emphasis: "apply",
        },
      );

      expect(
        itwinFrontendMock.EmphasizeElements.getOrCreate,
      ).toHaveBeenCalledWith(mockViewport);
      expect(
        itwinFrontendMock.EmphasizeElements.instance.fromJSON,
      ).toHaveBeenCalled();
    });

    it("clear resets (when get returns truthy) and does NOT apply", async () => {
      // Setup: get() returns truthy (emphasis exists)
      itwinFrontendMock.EmphasizeElements.get.mockReturnValue(
        itwinFrontendMock.EmphasizeElements.instance,
      );

      await applySavedView(
        mockIModel as never,
        mockViewport as never,
        savedViewWithEmphasis,
        {
          viewState: new MockViewState(),
          emphasis: "clear",
        },
      );

      // clear should be called since get() returned truthy
      expect(itwinFrontendMock.EmphasizeElements.clear).toHaveBeenCalledWith(
        mockViewport,
      );
      // fromJSON should NOT be called
      expect(
        itwinFrontendMock.EmphasizeElements.instance.fromJSON,
      ).not.toHaveBeenCalled();
    });

    it("keep does NOT reset and does NOT apply", async () => {
      await applySavedView(
        mockIModel as never,
        mockViewport as never,
        savedViewWithEmphasis,
        {
          viewState: new MockViewState(),
          emphasis: "keep",
        },
      );

      // Neither clear nor fromJSON should be called
      expect(itwinFrontendMock.EmphasizeElements.clear).not.toHaveBeenCalled();
      expect(
        itwinFrontendMock.EmphasizeElements.instance.fromJSON,
      ).not.toHaveBeenCalled();
    });
  });

  describe("perModelCategoryVisibility extension", () => {
    it("apply calls setOverride for each entry", async () => {
      await applySavedView(
        mockIModel as never,
        mockViewport as never,
        savedViewWithPMCV,
        {
          viewState: new MockViewState(),
          perModelCategoryVisibility: "apply",
        },
      );

      expect(
        mockViewport.perModelCategoryVisibility.setOverride,
      ).toHaveBeenCalledTimes(2);
    });

    it("clear calls clearOverrides and does NOT apply", async () => {
      await applySavedView(
        mockIModel as never,
        mockViewport as never,
        savedViewWithPMCV,
        {
          viewState: new MockViewState(),
          perModelCategoryVisibility: "clear",
        },
      );

      expect(
        mockViewport.perModelCategoryVisibility.clearOverrides,
      ).toHaveBeenCalled();
      expect(
        mockViewport.perModelCategoryVisibility.setOverride,
      ).not.toHaveBeenCalled();
    });

    it("keep does NOT clear and does NOT apply", async () => {
      await applySavedView(
        mockIModel as never,
        mockViewport as never,
        savedViewWithPMCV,
        {
          viewState: new MockViewState(),
          perModelCategoryVisibility: "keep",
        },
      );

      expect(
        mockViewport.perModelCategoryVisibility.clearOverrides,
      ).not.toHaveBeenCalled();
      expect(
        mockViewport.perModelCategoryVisibility.setOverride,
      ).not.toHaveBeenCalled();
    });
  });

  describe("subcategories handling", () => {
    it("ignore does NOT call changeCategoryDisplay", async () => {
      await applySavedView(
        mockIModel as never,
        mockViewport as never,
        minimalSavedViewData,
        {
          viewState: new MockViewState(),
          subcategories: "ignore",
        },
      );

      expect(mockViewport.changeCategoryDisplay).not.toHaveBeenCalled();
    });

    it("show calls changeCategoryDisplay exactly twice in correct order", async () => {
      await applySavedView(
        mockIModel as never,
        mockViewport as never,
        minimalSavedViewData,
        {
          viewState: new MockViewState(),
          subcategories: "show",
        },
      );

      // Subcategories "show" triggers two calls to changeCategoryDisplay:
      // 1. First call with (dropCategories, false)
      // 2. Second call with (addCategories, true, true)
      expect(mockViewport.changeCategoryDisplay).toHaveBeenCalledTimes(2);

      const calls = mockViewport.changeCategoryDisplay.mock.calls;
      // First call should be to hide (false)
      expect(calls[0][1]).toBe(false);
      // Second call should be to show (true) with subcategories enabled (true)
      expect(calls[1][1]).toBe(true);
      expect(calls[1][2]).toBe(true);
    });

    it("hide calls changeCategoryDisplay with correct subcategory flag", async () => {
      await applySavedView(
        mockIModel as never,
        mockViewport as never,
        minimalSavedViewData,
        {
          viewState: new MockViewState(),
          subcategories: "hide",
        },
      );

      expect(mockViewport.changeCategoryDisplay).toHaveBeenCalledTimes(2);

      const calls = mockViewport.changeCategoryDisplay.mock.calls;
      // Second call should be to show but with subcategories hidden (false)
      expect(calls[1][1]).toBe(true);
      expect(calls[1][2]).toBe(false);
    });
  });

  describe("saved view without extensions", () => {
    it("handles SavedViewData without extensions (resets still occur)", async () => {
      // Setup: get() returns truthy to verify reset is called
      itwinFrontendMock.EmphasizeElements.get.mockReturnValue(
        itwinFrontendMock.EmphasizeElements.instance,
      );

      await applySavedView(
        mockIModel as never,
        mockViewport as never,
        minimalSavedViewData, // No extensions
        {
          viewState: new MockViewState(),
          emphasis: "apply",
          perModelCategoryVisibility: "apply",
        },
      );

      // Resets should still happen even with no extensions
      expect(itwinFrontendMock.EmphasizeElements.clear).toHaveBeenCalled();
      expect(
        mockViewport.perModelCategoryVisibility.clearOverrides,
      ).toHaveBeenCalled();

      // But applies should NOT happen (no extension data)
      expect(
        itwinFrontendMock.EmphasizeElements.instance.fromJSON,
      ).not.toHaveBeenCalled();
      expect(
        mockViewport.perModelCategoryVisibility.setOverride,
      ).not.toHaveBeenCalled();
    });
  });

  describe("override handlers", () => {
    it("uses override apply handlers when provided", async () => {
      const overrideApply = vi.fn();
      const overrideReset = vi.fn();

      await applySavedView(
        mockIModel as never,
        mockViewport as never,
        savedViewWithEmphasis,
        {
          viewState: new MockViewState(),
          emphasis: "apply",
        },
        {
          emphasizeElements: {
            apply: overrideApply,
            reset: overrideReset,
          },
        },
      );

      expect(overrideReset).toHaveBeenCalled();
      expect(overrideApply).toHaveBeenCalled();
    });

    it("uses override reset handlers for PMCV", async () => {
      const overrideReset = vi.fn();

      await applySavedView(
        mockIModel as never,
        mockViewport as never,
        savedViewWithPMCV,
        {
          viewState: new MockViewState(),
          perModelCategoryVisibility: "clear",
        },
        {
          perModelCategoryVisibility: {
            reset: overrideReset,
          },
        },
      );

      expect(overrideReset).toHaveBeenCalled();
    });
  });

  describe("combined extensions", () => {
    it("handles both emphasis and PMCV extensions", async () => {
      await applySavedView(
        mockIModel as never,
        mockViewport as never,
        savedViewWithBothExtensions,
        {
          viewState: new MockViewState(),
          emphasis: "apply",
          perModelCategoryVisibility: "apply",
        },
      );

      expect(
        itwinFrontendMock.EmphasizeElements.instance.fromJSON,
      ).toHaveBeenCalled();
      expect(
        mockViewport.perModelCategoryVisibility.setOverride,
      ).toHaveBeenCalled();
    });
  });
});
