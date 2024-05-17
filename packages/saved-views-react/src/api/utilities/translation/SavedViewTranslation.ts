/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { IModelReadRpcInterface, type ViewQueryParams, type ViewStateProps } from "@itwin/core-common";
import {
  DisplayStyle3dState, DrawingViewState, EmphasizeElements, SheetViewState, SpatialViewState, type IModelConnection,
  type ViewState, type Viewport,
} from "@itwin/core-frontend";
import {
  isViewDataITwin3d, isViewDataITwinDrawing, isViewDataITwinSheet, type SavedViewRepresentation,
} from "@itwin/saved-views-client";

import { getMissingCategories, getMissingModels } from "../../../captureSavedViewData.js";
import {
  isDrawingSavedView, isSavedView3d, isSheetSavedView, isSpatialSavedView,
} from "../../clients/ISavedViewsClient.js";
import type { LegacySavedView2d, LegacySavedView3d, LegacySavedViewBase } from "../SavedViewTypes.js";
import { SavedViewsExtensionHandlers } from "./SavedViewsExtensionHandlers.js";
import {
  savedViewITwin3dToLegacy3dSavedView, savedViewItwinDrawingToLegacyDrawingView,
  savedViewItwinSheetToLegacySheetSavedView,
} from "./viewExtractorSavedViewToLegacySavedView.js";

/**
 * Converts a legacy saved view (response) to an iTwin.js ViewState.
 * @param legacySavedView a saved view response that includes a legacy view
 * @param iModel the {@linkcode IModelConnection} for the saved view; used to query for additional information
 * @param useHiddenModelsAndCategories when explicitly set to `false`, the returned {@linkcode ViewState} does not have
 *                                     populated category and model selectors
 * @returns a {@linkcode ViewState} with the saved view applied
 */
export async function translateLegacySavedViewToITwinJsViewState(
  legacySavedView: LegacySavedViewBase,
  iModel: IModelConnection,
  useHiddenModelsAndCategories = true,
): Promise<ViewState | undefined> {
  const viewState = await createViewState(iModel, legacySavedView);
  if (viewState && useHiddenModelsAndCategories) {
    await applyHiddenModelsAndCategories(iModel, viewState, legacySavedView);
  }

  return viewState;
}

async function createViewState(
  iModel: IModelConnection,
  savedView: LegacySavedViewBase,
): Promise<ViewState | undefined> {
  if (isSpatialSavedView(savedView)) {
    return createSpatialViewState(iModel, savedView);
  }

  if (isDrawingSavedView(savedView)) {
    return createDrawingViewState(iModel, savedView);
  }

  if (isSheetSavedView(savedView)) {
    return createSheetViewState(iModel, savedView);
  }

  return undefined;
}

async function createSpatialViewState(
  iModel: IModelConnection,
  savedView: LegacySavedView3d,
): Promise<SpatialViewState | undefined> {
  const props: ViewStateProps = {
    viewDefinitionProps: savedView.viewDefinitionProps,
    categorySelectorProps: savedView.categorySelectorProps,
    modelSelectorProps: savedView.modelSelectorProps,
    displayStyleProps: savedView.displayStyleProps,
  };
  const viewState = SpatialViewState.createFromProps(props, iModel);
  await viewState.load();
  return viewState;
}

async function createDrawingViewState(
  iModelConnection: IModelConnection,
  savedView: LegacySavedView2d,
): Promise<DrawingViewState | undefined> {
  const props: ViewStateProps = {
    viewDefinitionProps: savedView.viewDefinitionProps,
    categorySelectorProps: savedView.categorySelectorProps,
    displayStyleProps: savedView.displayStyleProps,
  };
  const viewState = DrawingViewState.createFromProps(props, iModelConnection) as DrawingViewState;
  await viewState.load();
  return viewState;
}

async function createSheetViewState(
  iModelConnection: IModelConnection,
  savedView: LegacySavedView2d,
): Promise<SheetViewState | undefined> {
  if (savedView.sheetProps === undefined || savedView.sheetAttachments === undefined) {
    return undefined;
  }

  const props: ViewStateProps = {
    viewDefinitionProps: savedView.viewDefinitionProps,
    categorySelectorProps: savedView.categorySelectorProps,
    displayStyleProps: savedView.displayStyleProps,
    sheetProps: savedView.sheetProps,
    sheetAttachments: savedView.sheetAttachments,
  };
  const viewState = SheetViewState.createFromProps(props, iModelConnection);
  await viewState.load();
  return viewState;
}

async function applyHiddenModelsAndCategories(
  iModel: IModelConnection,
  viewState: ViewState,
  savedView: LegacySavedViewBase,
): Promise<void> {
  if (!legacyViewHasValidHiddenModelsAndCategories(savedView)) {
    return;
  }

  const visible = await getVisibleModelsAndCategories(savedView, iModel);
  if (visible.categories) {
    viewState.categorySelector.addCategories(visible.categories);
  }

  if (viewState.isSpatialView() && visible.models) {
    viewState.modelSelector.addModels(visible.models);
  }

  await viewState.load();
}

function legacyViewHasValidHiddenModelsAndCategories(savedView: LegacySavedViewBase): boolean {
  if (isSavedView3d(savedView)) {
    return !!(savedView.hiddenCategories && savedView.hiddenModels);
  }

  return !!savedView.hiddenCategories;
}

async function getVisibleModelsAndCategories(
  savedView: LegacySavedViewBase,
  iModel: IModelConnection,
): Promise<{ models?: string[]; categories?: string[]; }> {
  return {
    models: isSavedView3d(savedView) ? await getMissingModels(iModel, new Set(savedView.hiddenModels)) : undefined,
    categories: await getMissingCategories(iModel, new Set(savedView.hiddenCategories)),
  };
}

export async function augmentWithScheduleScript(
  iModel: IModelConnection,
  savedView: LegacySavedView3d,
  viewState: SpatialViewState,
): Promise<boolean> {
  if (!savedView.displayStyleProps.jsonProperties?.styles?.timePoint) {
    return false;
  }

  try {
    const viewList = await iModel.views.getViewList({ wantPrivate: false });
    const viewStates = await Promise.all(viewList.map(({ id }) => iModel.views.load(id)));
    const scheduleViewState = viewStates.find(({ scheduleScript }) => scheduleScript && !scheduleScript.duration.isNull);
    if (scheduleViewState) {
      savedView.displayStyleProps.id = scheduleViewState.id;
      viewState.displayStyle = new DisplayStyle3dState(
        savedView.displayStyleProps,
        iModel,
        scheduleViewState.displayStyle as DisplayStyle3dState,
      );
    }
  } catch {
    return false;
  }

  return true;
}

/**
 * Apply extension data (overrides) onto the supplied viewport. Only works with legacy-formatted extension data.
 * @param viewport The {@link Viewport} used to display the saved view and iModel.
 * @param legacySavedView A saved view response that includes a legacy view.
 */
export async function applyExtensionsToViewport(
  viewport: Viewport,
  legacySavedView: LegacySavedViewBase,
): Promise<void> {
  // Clear the current if there's any (this should always happen, even if there are no extensions)
  if (EmphasizeElements.get(viewport)) {
    EmphasizeElements.clear(viewport);
    viewport.isFadeOutActive = false;
  }

  const defaultHandlers = [
    SavedViewsExtensionHandlers.EmphasizeElements,
    SavedViewsExtensionHandlers.PerModelCategoryVisibility,
    SavedViewsExtensionHandlers.VisibilityOverride,
  ];

  for (const extHandler of defaultHandlers) {
    const extData = legacySavedView.extensions?.get(extHandler.extensionName);
    if (extData) {
      await extHandler.onViewApply(extData, viewport);
    }
  }
}

/**
* Creates legacy saved view data from a saved view response.
* @param savedViewResponse A saved view response with or without a legacy view.
* @param iModel The {@link IModelConnection} for the saved view; used to query for additional information.
* @resolves The saved views formatted as a legacy SavedViewBase.
*/
export async function translateSavedViewToLegacySavedView(
  iModel: IModelConnection,
  savedViewResponse: SavedViewRepresentation,
): Promise<LegacySavedViewBase> {
  const savedViewData = savedViewResponse.savedViewData;
  // If the legacy view already exists, use that; otherwise, use extraction code to get the legacy view
  let legacySavedView: LegacySavedViewBase;
  if (savedViewData.legacyView) {
    legacySavedView = savedViewData.legacyView as LegacySavedViewBase;
    if (isSavedView3d(legacySavedView)) {
      legacySavedView.modelSelectorProps.models = legacySavedView.modelSelectorProps.models.filter((model) => !!model);
    }
  } else if (isViewDataITwin3d(savedViewData)) {
    const viewState = await fetchIModelViewData(iModel, ViewTypes.ViewDefinition3d) as SpatialViewState;
    legacySavedView = savedViewITwin3dToLegacy3dSavedView(savedViewResponse, viewState);
  } else if (isViewDataITwinDrawing(savedViewData)) {
    const viewState = await fetchIModelViewData(iModel, ViewTypes.DrawingViewDefinition) as DrawingViewState;
    legacySavedView = savedViewItwinDrawingToLegacyDrawingView(savedViewResponse, viewState);
  } else if (isViewDataITwinSheet(savedViewData)) {
    const viewState = await fetchIModelViewData(iModel, ViewTypes.SheetViewDefinition) as SheetViewState;
    legacySavedView = savedViewItwinSheetToLegacySheetSavedView(savedViewResponse, viewState);
  } else {
    throw new Error("Could not translate itwin-saved-views API response to a SavedViewBaseSetting");
  }

  // Append all extensions to the saved view
  legacySavedView.extensions = new Map<string, string>();
  for (const { extensionName, data } of savedViewResponse.extensions ?? []) {
    if (extensionName && data) {
      legacySavedView.extensions.set(extensionName, data);
    }
  }

  return legacySavedView;
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

enum ViewTypes {
  SheetViewDefinition,
  ViewDefinition3d,
  DrawingViewDefinition,
}
