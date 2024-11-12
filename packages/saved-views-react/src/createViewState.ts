/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import {
  Camera, type CodeProps, type SpatialViewDefinitionProps, type ViewDefinition2dProps,
  type ViewStateProps,
} from "@itwin/core-common";
import {
  DrawingViewState, SheetViewState, SpatialViewState, type IModelConnection, type ViewState,
} from "@itwin/core-frontend";
import type { ViewITwin3d, ViewITwinDrawing, ViewITwinSheet } from "@itwin/saved-views-client";

import { queryMissingCategories, queryMissingModels } from "./captureSavedViewData.js";
import type { ViewData } from "./SavedView.js";
import { extractClipVectors } from "./translation/clipVectorsExtractor.js";
import { extractDisplayStyle, extractDisplayStyle3d } from "./translation/displayStyleExtractor.js";

export interface ViewStateCreateSettings {
  /**
   * Normally {@link createViewState} function invokes and awaits {@linkcode ViewState.load}
   * method before returning. You may skip this step if you intend to perform it later.
   * @default false
   *
   * @example
   * const viewState = await createViewState(iModel, savedViewData.viewData, { skipViewStateLoad: true });
   * viewState.categorySelector.addCategories("<additional_category_id>");
   * await viewState.load();
   */
  skipViewStateLoad?: boolean | undefined;

  /**
   * How to handle visibility of models and categories that exist in iModel but
   * not captured in Saved View data.
   * @default "hidden"
   */
  modelAndCategoryVisibilityFallback?: "visible" | "hidden" | undefined;
}

/**
 * Creates {@link ViewState} object out of Saved View data. It provides a lower-level
 * access to view data for advanced use.
 *
 * @example
 * const viewState = await createViewState(iModel, savedViewData.viewData);
 * await applySavedView(iModel, viewport, savedViewData, { viewState });
 *
 * // The two lines above are equivalent to
 * await applySavedView(iModel, viewport, savedViewData);
 */
export async function createViewState(
  iModel: IModelConnection,
  viewData: ViewData,
  settings: ViewStateCreateSettings = {},
): Promise<ViewState> {
  const viewState = await createViewStateVariant(iModel, viewData);
  if (settings.modelAndCategoryVisibilityFallback === "visible") {
    await unhideNewModelsAndCategories(iModel, viewState, viewData);
  }

  if (!settings.skipViewStateLoad) {
    await viewState.load();
  }

  return viewState;
}

async function createViewStateVariant(
  iModel: IModelConnection,
  viewData: ViewData,
): Promise<ViewState> {
  if (viewData.type === "iTwinDrawing") {
    return createDrawingViewState(iModel, viewData);
  }

  if (viewData.type === "iTwinSheet") {
    return createSheetViewState(iModel, viewData);
  }

  return createSpatialViewState(iModel, viewData);
}

interface SpatialViewStateProps extends ViewStateProps {
  viewDefinitionProps: SpatialViewDefinitionProps;
}

async function createSpatialViewState(iModel: IModelConnection, viewData: ViewITwin3d): Promise<SpatialViewState> {
  const seedViewState = await fetchIModelViewData(iModel, SpatialViewState.classFullName) as SpatialViewState;
  const props: SpatialViewStateProps = {
    viewDefinitionProps: {
      origin: viewData.origin,
      extents: viewData.extents,
      angles: viewData.angles,
      camera: viewData.camera ?? new Camera(),
      jsonProperties: {
        viewDetails: extractClipVectors(viewData),
      },
      classFullName: seedViewState.classFullName,
      code: seedViewState.code,
      model: seedViewState.model,
      categorySelectorId: seedViewState.categorySelector.id,
      displayStyleId: seedViewState.displayStyle.id,
      cameraOn: viewData.camera !== undefined,
      modelSelectorId: seedViewState.modelSelector.id,
    },
    categorySelectorProps: {
      classFullName: seedViewState.categorySelector.classFullName,
      categories: viewData.categories?.enabled ?? [],
      code: cloneCode(seedViewState.categorySelector.code),
      model: seedViewState.categorySelector.model,
    },
    modelSelectorProps: {
      classFullName: seedViewState.modelSelector.classFullName,
      code: cloneCode(seedViewState.modelSelector.code),
      model: seedViewState.modelSelector.model,
      models: viewData.models?.enabled ?? [],
    },
    displayStyleProps: {
      id: seedViewState.displayStyle.id,
      classFullName: seedViewState.displayStyle.classFullName,
      code: seedViewState.displayStyle.code,
      model: seedViewState.displayStyle.model,
      jsonProperties: {
        styles: extractDisplayStyle3d(viewData),
      },
    },
  };
  return SpatialViewState.createFromProps(props, iModel);
}

interface DrawingViewStateProps extends ViewStateProps {
  viewDefinitionProps: ViewDefinition2dProps;
}

async function createDrawingViewState(iModel: IModelConnection, viewData: ViewITwinDrawing): Promise<DrawingViewState> {
  const seedViewState = await fetchIModelViewData(iModel, DrawingViewState.classFullName) as DrawingViewState;
  const props: DrawingViewStateProps = {
    viewDefinitionProps: {
      classFullName: seedViewState.classFullName,
      id: seedViewState.id,
      jsonProperties: {
        viewDetails: {
          gridOrient: seedViewState.getGridOrientation(),
        },
      },
      code: cloneCode(seedViewState.code),
      model: seedViewState.model,
      federationGuid: seedViewState.federationGuid,
      categorySelectorId: seedViewState.categorySelector.id,
      displayStyleId: seedViewState.displayStyle.id,
      isPrivate: seedViewState.isPrivate,
      description: seedViewState.description,
      origin: viewData.origin,
      delta: viewData.delta,
      angle: viewData.angle,
      baseModelId: viewData.baseModelId,
    },
    categorySelectorProps: {
      classFullName: seedViewState.categorySelector.classFullName,
      categories: viewData.categories?.enabled ?? [],
      code: cloneCode(seedViewState.categorySelector.code),
      model: seedViewState.categorySelector.model,
      federationGuid: seedViewState.categorySelector.federationGuid,
      id: seedViewState.categorySelector.id,
    },
    displayStyleProps: {
      classFullName: seedViewState.displayStyle.classFullName,
      id: seedViewState.displayStyle.id,
      jsonProperties: {
        styles: extractDisplayStyle(viewData, seedViewState),
      },
      code: cloneCode(seedViewState.displayStyle.code),
      model: seedViewState.displayStyle.model,
      federationGuid: seedViewState.displayStyle.federationGuid,
    },
  };
  return DrawingViewState.createFromProps(props, iModel);
}

interface SheetViewStateProps extends ViewStateProps {
  viewDefinitionProps: ViewDefinition2dProps;
}

async function createSheetViewState(iModel: IModelConnection, viewData: ViewITwinSheet): Promise<SheetViewState> {
  const seedViewState = await fetchIModelViewData(iModel, SheetViewState.classFullName) as SheetViewState;
  const props: SheetViewStateProps = {
    viewDefinitionProps: {
      classFullName: seedViewState.classFullName,
      id: seedViewState.id,
      jsonProperties: {
        viewDetails: {
          gridOrient: seedViewState.getGridOrientation(),
        },
      },
      code: cloneCode(seedViewState.code),
      model: seedViewState.model,
      federationGuid: seedViewState.federationGuid,
      categorySelectorId: seedViewState.categorySelector.id,
      displayStyleId: seedViewState.displayStyle.id,
      isPrivate: seedViewState.isPrivate,
      description: seedViewState.description,
      origin: viewData.origin,
      delta: viewData.delta,
      angle: viewData.angle,
      baseModelId: viewData.baseModelId,
    },
    categorySelectorProps: {
      classFullName: seedViewState.categorySelector.classFullName,
      categories: viewData.categories?.enabled ?? [],
      code: cloneCode(seedViewState.categorySelector.code),
      model: seedViewState.categorySelector.model,
      federationGuid: seedViewState.categorySelector.federationGuid,
      id: seedViewState.categorySelector.id,
    },
    displayStyleProps: {
      classFullName: seedViewState.displayStyle.classFullName,
      id: seedViewState.displayStyle.id,
      jsonProperties: {
        styles: extractDisplayStyle(viewData, seedViewState),
      },
      code: cloneCode(seedViewState.displayStyle.code),
      model: seedViewState.displayStyle.model,
      federationGuid: seedViewState.displayStyle.federationGuid,
    },
    sheetProps: {
      width: viewData.width,
      height: viewData.height,
      model: seedViewState.displayStyle.model,
      classFullName: SheetViewState.classFullName,
      code: {
        spec: seedViewState.displayStyle.code.spec,
        scope: seedViewState.displayStyle.code.scope,
        value: "",
      },
    },
    sheetAttachments: viewData.sheetAttachments,
  };
  return SheetViewState.createFromProps(props, iModel);
}

async function fetchIModelViewData(iModel: IModelConnection, viewClassName: string): Promise<ViewState> {
  if (iModel.isBlankConnection()) {
    return createEmptyViewState(iModel, viewClassName);
  }

  const viewId = await getDefaultViewIdFromClassName(iModel, viewClassName);
  if (viewId === "") {
    return createEmptyViewState(iModel, viewClassName);
  }

  return iModel.views.load(viewId);
}

function createEmptyViewState(iModel: IModelConnection, viewClassName: string): ViewState {
  const blankViewState = SpatialViewState.createBlank(
    iModel,
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
  );

  if (viewClassName === SpatialViewState.classFullName) {
    return blankViewState;
  }

  const blankViewStateProps: ViewStateProps = {
    viewDefinitionProps: blankViewState.toJSON(),
    categorySelectorProps: blankViewState.categorySelector.toJSON(),
    displayStyleProps: blankViewState.displayStyle.toJSON(),
  };

  switch (viewClassName) {
    case DrawingViewState.classFullName:
      return DrawingViewState.createFromProps(blankViewStateProps, iModel);
    case SheetViewState.classFullName:
      return SheetViewState.createFromProps(blankViewStateProps, iModel);
    default:
      return blankViewState;
  }
}

async function getDefaultViewIdFromClassName(iModel: IModelConnection, viewClassName: string): Promise<string> {
  // Check validity of default view
  const viewId = await iModel.views.queryDefaultViewId();
  const viewProps = await iModel.elements.queryProps({ from: viewClassName, where: "ECInstanceId=" + viewId });
  if (viewProps.length > 0) {
    return viewId;
  }

  // Return the first view we can find
  const viewList = await iModel.views.getViewList({ from: viewClassName, wantPrivate: false });
  if (viewList.length === 0) {
    return "";
  }

  return viewList[0].id;
}

function cloneCode({ spec, scope, value }: CodeProps): CodeProps {
  return { spec, scope, value };
}

async function unhideNewModelsAndCategories(
  iModel: IModelConnection,
  viewState: ViewState,
  viewData: ViewData,
): Promise<void> {
  if (viewData.type === "iTwin3d") {
    if (!viewState.isSpatialView()) {
      return;
    }

    if (!viewData.categories?.disabled || !viewData.models?.disabled) {
      return;
    }

    const [visibleCategories, visibleModels] = await Promise.all([
      queryMissingCategories(iModel, new Set(viewData.categories.disabled)),
      queryMissingModels(iModel, new Set(viewData.models.disabled)),
    ]);

    viewState.categorySelector.addCategories(visibleCategories);
    viewState.modelSelector.addModels(visibleModels);
    return;
  }

  if (!viewData.categories?.disabled) {
    return;
  }

  const visibleCategories = await queryMissingCategories(
    iModel,
    new Set(viewData.categories.disabled),
  );
  viewState.categorySelector.addCategories(visibleCategories);
}
