/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import {
  Camera, IModelReadRpcInterface, type CodeProps, type SpatialViewDefinitionProps, type ViewDefinition2dProps,
  type ViewQueryParams, type ViewStateProps,
} from "@itwin/core-common";
import {
  DrawingViewState, SheetViewState, SpatialViewState, type IModelConnection, type ViewState,
} from "@itwin/core-frontend";
import {
  ViewITwinDrawing, ViewITwinSheet, isViewDataITwin3d, isViewDataITwinDrawing, isViewDataITwinSheet,
  type SavedViewRepresentation, type ViewITwin3d,
} from "@itwin/saved-views-client";

import { extractClipVectors } from "./api/utilities/translation/clipVectorsExtractor.js";
import { extractDisplayStyle, extractDisplayStyle3d } from "./api/utilities/translation/displayStyleExtractor.js";
import { getMissingCategories, getMissingModels } from "./captureSavedViewData.js";

export async function createViewState(
  iModel: IModelConnection,
  savedViewRsp: SavedViewRepresentation,
  useHiddenModelsAndCategories = true,
): Promise<ViewState | undefined> {
  const viewState = await createViewStateVariant(iModel, savedViewRsp);
  if (useHiddenModelsAndCategories) {
    await applyHiddenModelsAndCategories(iModel, viewState, savedViewRsp);
  }

  await viewState.load();
  return viewState;
}

async function createViewStateVariant(
  iModel: IModelConnection,
  savedViewRsp: SavedViewRepresentation,
): Promise<ViewState> {
  if (isViewDataITwinDrawing(savedViewRsp.savedViewData)) {
    return createDrawingViewState(iModel, savedViewRsp.savedViewData.itwinDrawingView);
  }

  if (isViewDataITwinSheet(savedViewRsp.savedViewData)) {
    return createSheetViewState(iModel, savedViewRsp.savedViewData.itwinSheetView);
  }

  return createSpatialViewState(iModel, savedViewRsp.savedViewData.itwin3dView);
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
  const params: ViewQueryParams = {};
  params.from = viewClassName;
  params.where = "ECInstanceId=" + viewId;
  const viewProps = await IModelReadRpcInterface.getClient().queryElementProps(iModel.getRpcProps(), params);
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

async function applyHiddenModelsAndCategories(
  iModel: IModelConnection,
  viewState: ViewState,
  savedViewRsp: SavedViewRepresentation,
): Promise<void> {
  if (isViewDataITwin3d(savedViewRsp.savedViewData)) {
    if (!viewState.isSpatialView()) {
      return;
    }

    const savedViewData = savedViewRsp.savedViewData.itwin3dView;
    if (!savedViewData.categories?.disabled || !savedViewData.models?.disabled) {
      return;
    }

    const [visibleCategories, visibleModels] = await Promise.all([
      getMissingCategories(iModel, new Set(savedViewData.categories.disabled)),
      getMissingModels(iModel, new Set(savedViewData.models.disabled)),
    ]);

    viewState.categorySelector.addCategories(visibleCategories);
    viewState.modelSelector.addModels(visibleModels);
    return;
  }

  const savedViewData = isViewDataITwinDrawing(savedViewRsp.savedViewData)
    ? savedViewRsp.savedViewData.itwinDrawingView
    : savedViewRsp.savedViewData.itwinSheetView;

  if (!savedViewData.categories?.disabled) {
    return;
  }

  const visibleCategories = await getMissingCategories(iModel, new Set(savedViewData.categories.disabled));
  viewState.categorySelector.addCategories(visibleCategories);
}
