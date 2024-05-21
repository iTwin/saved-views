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
  isViewDataITwin3d, isViewDataITwinDrawing, isViewDataITwinSheet, type SavedViewRepresentation, type ViewDataITwin3d,
  type ViewDataITwinDrawing, type ViewDataITwinSheet,
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

async function createViewStateVariant(iModel: IModelConnection, savedViewRsp: SavedViewRepresentation): Promise<ViewState> {
  if (isViewDataITwinDrawing(savedViewRsp.savedViewData)) {
    const viewState = await fetchIModelViewData(iModel, ViewTypes.DrawingViewDefinition) as DrawingViewState;
    return createDrawingViewState(iModel, savedViewRsp, viewState);
  }

  if (isViewDataITwinSheet(savedViewRsp.savedViewData)) {
    const viewState = await fetchIModelViewData(iModel, ViewTypes.SheetViewDefinition) as SheetViewState;
    return createSheetViewState(iModel, savedViewRsp, viewState);
  }

  const viewState = await fetchIModelViewData(iModel, ViewTypes.ViewDefinition3d) as SpatialViewState;
  return createSpatialViewState(iModel, savedViewRsp, viewState);
}

enum ViewTypes {
  SheetViewDefinition,
  ViewDefinition3d,
  DrawingViewDefinition,
}

async function fetchIModelViewData(iModel: IModelConnection, viewClassName: ViewTypes): Promise<ViewState> {
  if (iModel.isBlankConnection()) {
    return manufactureEmptyViewState(iModel, viewClassName);
  }

  const viewId = await getDefaultViewIdFromClassName(iModel, viewClassName);
  if (viewId === "") {
    return manufactureEmptyViewState(iModel, viewClassName);
  }

  return iModel.views.load(viewId);
}

function manufactureEmptyViewState(iModel: IModelConnection, viewClassName: ViewTypes): ViewState {
  const blankViewState = SpatialViewState.createBlank(
    iModel,
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
  );

  if (viewClassName === ViewTypes.ViewDefinition3d) {
    return blankViewState;
  }

  const blankViewStateProps: ViewStateProps = {
    viewDefinitionProps: blankViewState.toJSON(),
    categorySelectorProps: blankViewState.categorySelector.toJSON(),
    displayStyleProps: blankViewState.displayStyle.toJSON(),
  };

  switch (viewClassName) {
    case ViewTypes.DrawingViewDefinition:
      return DrawingViewState.createFromProps(blankViewStateProps, iModel);
    case ViewTypes.SheetViewDefinition:
      return SheetViewState.createFromProps(blankViewStateProps, iModel);
    default:
      return blankViewState;
  }
}

async function getDefaultViewIdFromClassName(iModel: IModelConnection, savedViewType: ViewTypes): Promise<string> {
  let viewFullName = undefined;
  switch (savedViewType) {
    case ViewTypes.ViewDefinition3d:
      viewFullName = SpatialViewState.classFullName;
      break;
    case ViewTypes.DrawingViewDefinition:
      viewFullName = DrawingViewState.classFullName;
      break;
    case ViewTypes.SheetViewDefinition:
      viewFullName = SheetViewState.classFullName;
      break;
    default:
      throw new Error("Unrecognized View Type");
  }

  // Check validity of default view
  const viewId = await iModel.views.queryDefaultViewId();
  const params: ViewQueryParams = {};
  params.from = viewFullName;
  params.where = "ECInstanceId=" + viewId;
  const viewProps = await IModelReadRpcInterface.getClient().queryElementProps(iModel.getRpcProps(), params);
  if (viewProps.length > 0) {
    return viewId;
  }

  // Return the first view we can find
  const viewList = await iModel.views.getViewList({ from: viewFullName, wantPrivate: false });
  if (viewList.length === 0) {
    return "";
  }

  return viewList[0].id;
}

interface SpatialViewStateProps extends ViewStateProps {
  viewDefinitionProps: SpatialViewDefinitionProps;
}

async function createSpatialViewState(
  iModel: IModelConnection,
  savedViewRsp: SavedViewRepresentation,
  seedSpatialViewState: SpatialViewState,
): Promise<SpatialViewState> {
  const modelSelector = seedSpatialViewState.modelSelector;
  const itwin3dView = (savedViewRsp.savedViewData as ViewDataITwin3d).itwin3dView;
  const props: SpatialViewStateProps = {
    viewDefinitionProps: {
      origin: itwin3dView.origin,
      extents: itwin3dView.extents,
      angles: itwin3dView.angles,
      camera: itwin3dView.camera ?? new Camera(),
      jsonProperties: {
        viewDetails: extractClipVectors(itwin3dView),
      },
      classFullName: seedSpatialViewState.classFullName,
      code: seedSpatialViewState.code,
      model: seedSpatialViewState.model,
      categorySelectorId: seedSpatialViewState.categorySelector.id,
      displayStyleId: seedSpatialViewState.displayStyle.id,
      cameraOn: itwin3dView.camera !== undefined,
      modelSelectorId: seedSpatialViewState.modelSelector.id,
    },
    categorySelectorProps: {
      classFullName: seedSpatialViewState.categorySelector.classFullName,
      categories: itwin3dView.categories?.enabled ?? [],
      code: cloneCode(seedSpatialViewState.categorySelector.code),
      model: seedSpatialViewState.categorySelector.model,
    },
    modelSelectorProps: {
      classFullName: modelSelector.classFullName,
      code: cloneCode(modelSelector.code),
      model: modelSelector.model,
      models: itwin3dView.models?.enabled ?? [],
    },
    displayStyleProps: {
      id: seedSpatialViewState.displayStyle.id,
      classFullName: seedSpatialViewState.displayStyle.classFullName,
      code: seedSpatialViewState.displayStyle.code,
      model: seedSpatialViewState.displayStyle.model,
      jsonProperties: {
        styles: extractDisplayStyle3d(itwin3dView),
      },
    },
  };
  const viewState = SpatialViewState.createFromProps(props, iModel);
  return viewState;
}

interface DrawingViewStateProps extends ViewStateProps {
  viewDefinitionProps: ViewDefinition2dProps;
}

async function createDrawingViewState(
  iModel: IModelConnection,
  savedViewRsp: SavedViewRepresentation,
  seedDrawingViewState: DrawingViewState,
): Promise<DrawingViewState> {
  const iTwinDrawingView = (savedViewRsp.savedViewData as ViewDataITwinDrawing).itwinDrawingView;
  const props: DrawingViewStateProps = {
    viewDefinitionProps: {
      classFullName: seedDrawingViewState.classFullName,
      id: seedDrawingViewState.id,
      jsonProperties: {
        viewDetails: {
          gridOrient: seedDrawingViewState.getGridOrientation(),
        },
      },
      code: cloneCode(seedDrawingViewState.code),
      model: seedDrawingViewState.model,
      federationGuid: seedDrawingViewState.federationGuid,
      categorySelectorId: seedDrawingViewState.categorySelector.id,
      displayStyleId: seedDrawingViewState.displayStyle.id,
      isPrivate: seedDrawingViewState.isPrivate,
      description: seedDrawingViewState.description,
      origin: iTwinDrawingView.origin,
      delta: iTwinDrawingView.delta,
      angle: iTwinDrawingView.angle,
      baseModelId: iTwinDrawingView.baseModelId,
    },
    categorySelectorProps: {
      classFullName: seedDrawingViewState.categorySelector.classFullName,
      categories: iTwinDrawingView.categories?.enabled ?? [],
      code: cloneCode(seedDrawingViewState.categorySelector.code),
      model: seedDrawingViewState.categorySelector.model,
      federationGuid: seedDrawingViewState.categorySelector.federationGuid,
      id: seedDrawingViewState.categorySelector.id,
    },
    displayStyleProps: {
      classFullName: seedDrawingViewState.displayStyle.classFullName,
      id: seedDrawingViewState.displayStyle.id,
      jsonProperties: {
        styles: extractDisplayStyle(iTwinDrawingView, seedDrawingViewState),
      },
      code: cloneCode(seedDrawingViewState.displayStyle.code),
      model: seedDrawingViewState.displayStyle.model,
      federationGuid: seedDrawingViewState.displayStyle.federationGuid,
    },
  };
  const viewState = DrawingViewState.createFromProps(props, iModel) as DrawingViewState;
  return viewState;
}

interface SheetViewStateProps extends ViewStateProps {
  viewDefinitionProps: ViewDefinition2dProps;
}

async function createSheetViewState(
  iModel: IModelConnection,
  savedViewRsp: SavedViewRepresentation,
  seedSheetViewState: ViewState,
): Promise<SheetViewState> {
  const itwinSheetView = (savedViewRsp.savedViewData as ViewDataITwinSheet).itwinSheetView;
  const props: SheetViewStateProps = {
    viewDefinitionProps: {
      classFullName: seedSheetViewState.classFullName,
      id: seedSheetViewState.id,
      jsonProperties: {
        viewDetails: {
          gridOrient: seedSheetViewState.getGridOrientation(),
        },
      },
      code: cloneCode(seedSheetViewState.code),
      model: seedSheetViewState.model,
      federationGuid: seedSheetViewState.federationGuid,
      categorySelectorId: seedSheetViewState.categorySelector.id,
      displayStyleId: seedSheetViewState.displayStyle.id,
      isPrivate: seedSheetViewState.isPrivate,
      description: seedSheetViewState.description,
      origin: itwinSheetView.origin,
      delta: itwinSheetView.delta,
      angle: itwinSheetView.angle,
      baseModelId: itwinSheetView.baseModelId,
    },
    categorySelectorProps: {
      classFullName: seedSheetViewState.categorySelector.classFullName,
      categories: itwinSheetView.categories?.enabled ?? [],
      code: cloneCode(seedSheetViewState.categorySelector.code),
      model: seedSheetViewState.categorySelector.model,
      federationGuid: seedSheetViewState.categorySelector.federationGuid,
      id: seedSheetViewState.categorySelector.id,
    },
    displayStyleProps: {
      classFullName: seedSheetViewState.displayStyle.classFullName,
      id: seedSheetViewState.displayStyle.id,
      jsonProperties: {
        styles: extractDisplayStyle(itwinSheetView, seedSheetViewState),
      },
      code: cloneCode(seedSheetViewState.displayStyle.code),
      model: seedSheetViewState.displayStyle.model,
      federationGuid: seedSheetViewState.displayStyle.federationGuid,
    },
    sheetProps: {
      width: itwinSheetView.width,
      height: itwinSheetView.height,
      model: seedSheetViewState.displayStyle.model,
      classFullName: SheetViewState.classFullName,
      code: {
        spec: seedSheetViewState.displayStyle.code.spec,
        scope: seedSheetViewState.displayStyle.code.scope,
        value: "",
      },
    },
    sheetAttachments: itwinSheetView.sheetAttachments,
  };
  const viewState = SheetViewState.createFromProps(props, iModel);
  return viewState;
}

function cloneCode(code: CodeProps): CodeProps {
  return { spec: code.spec, scope: code.scope, value: code.value };
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

    const visible = {
      categories: await getMissingCategories(iModel, new Set(savedViewData.categories.disabled)),
      models: await getMissingModels(iModel, new Set(savedViewData.models.disabled)),
    };

    viewState.categorySelector.addCategories(visible.categories);
    viewState.modelSelector.addModels(visible.models);
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
