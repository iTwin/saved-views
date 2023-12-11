// Copyright (c) Bentley Systems, Incorporated. All rights reserved.
import { IModelReadRpcInterface, ViewQueryParams, ViewStateProps } from "@itwin/core-common";
import {
  DrawingViewState, EmphasizeElements, IModelConnection, ScreenViewport, SheetViewState, SpatialViewState, ViewState, Viewport,
} from "@itwin/core-frontend";
import {
  Extension, SavedViewWithDataRepresentation, ViewData, ViewDataItwin3d, ViewDataITwinDrawing,
  ViewDataITwinSheet,
} from "@itwin/saved-views-client";

import { ViewTypes } from "../../../SavedViewTypes.js";
import {
  isDrawingSavedView, isSheetSavedView, isSpatialSavedView,
} from "../../clients/ISavedViewsClient.js";
import {
  SavedView as LegacySavedView, SavedView2d as LegacySavedView2d,
  SavedViewBase as LegacySavedViewBase,
} from "../SavedViewTypes.js";
import {
  cleanLegacyViewModelSelectorPropsModels, savedViewITwin3dToLegacy3dSavedView,
  savedViewItwinDrawingToLegacyDrawingView, savedViewItwinSheetToLegacySheetSavedView,
} from "./viewExtractorSavedViewToLegacySavedView.js";
import { SavedViewsExtensionHandlers } from "./SavedViewsExtensionHandlers.js";
import { applyHiddenModelsAndCategories } from "./ModelsAndCategoriesHelper.js";

function isSavedViewItwin3d(savedViewData: ViewData): savedViewData is ViewDataItwin3d {
  return (savedViewData as ViewDataItwin3d).itwin3dView !== undefined;
}

function isSavedViewItwinSheet(savedViewData: ViewData): savedViewData is ViewDataITwinSheet {
  return (savedViewData as ViewDataITwinSheet).itwinSheetView !== undefined;
}

function isSavedViewItwinDrawing(savedViewData: ViewData): savedViewData is ViewDataITwinDrawing {
  return (savedViewData as ViewDataITwinDrawing).itwinDrawingView !== undefined;
}

function legacyViewFrom(legacySavedViewResponse: SavedViewWithDataRepresentation): LegacySavedViewBase {
  return legacySavedViewResponse.savedViewData.legacyView as LegacySavedViewBase;
}

export async function translateSavedViewResponseToLegacySavedViewResponse(
  savedViewResponse: SavedViewWithDataRepresentation,
  iModelConnection: IModelConnection,
 ): Promise<SavedViewWithDataRepresentation> {
  const legacySavedView = await translateSavedViewToLegacySavedView(savedViewResponse, iModelConnection);
  const legacySavedViewResponse = savedViewResponse;
  legacySavedViewResponse.savedViewData.legacyView = legacySavedView;
  return legacySavedViewResponse;
}

/**
* Convert the saved view response recieved from the itwin-saved-views API into a SavedViewBaseSetting
* @param id
* @param savedView
* @returns Promise<SavedViewBase>
*/
async function translateSavedViewToLegacySavedView(
  savedView: SavedViewWithDataRepresentation,
  iModelConnection: IModelConnection,
 ): Promise<LegacySavedViewBase> {
  const savedViewData = savedView.savedViewData;
  // If the legacy view already exists, use that; otherwise, use extraction code to get the legacy view
  let legacySavedView: LegacySavedViewBase;
  if (savedViewData.legacyView) {
    savedView = cleanLegacyViewModelSelectorPropsModels(savedView);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    legacySavedView = savedViewData.legacyView as any;
    // legacySavedView.id = savedView.id; // Change legacy sv id to comboId

  } else if (isSavedViewItwin3d(savedViewData)) {
    const iModelViewData = await fetchIModelViewData(
      ViewTypes.ViewDefinition3d,
      iModelConnection,
    );

    const actual = savedViewITwin3dToLegacy3dSavedView(
      savedView,
      iModelViewData as SpatialViewState,
    );
    legacySavedView = actual;
  } else if (isSavedViewItwinDrawing(savedViewData)) {
    const iModelViewData = await fetchIModelViewData(
      ViewTypes.DrawingViewDefinition,
      iModelConnection,
    );
    const actual = savedViewItwinDrawingToLegacyDrawingView(
      savedView,
      iModelViewData as DrawingViewState,
    );
    legacySavedView = actual;
  } else if (isSavedViewItwinSheet(savedViewData)) {
    const iModelViewData = await fetchIModelViewData(
      ViewTypes.SheetViewDefinition,
      iModelConnection,
    );
    const actual = savedViewItwinSheetToLegacySheetSavedView(
      savedView,
      iModelViewData as SheetViewState,
    );
    legacySavedView = actual;
  } else {
    throw new Error(
      "Could not translate itwin-saved-views API response to a SavedViewBaseSetting",
    );
  }

  // Append all extensions to the saved view
  legacySavedView.extensions = new Map<string, string>();
  for (const ext of savedView.extensions as Extension[]) {
    if (ext.extensionName && ext.data) {
      legacySavedView.extensions.set(ext.extensionName, ext.data);
    }
  }

  return legacySavedView;
}

/**
 * Grabs Seeded SavedView From IModel
 * @throws if iModel Connection of App is invalid
 * @returns iModelViewData
 */
async function fetchIModelViewData(viewClassName: ViewTypes, iModelConnection: IModelConnection) {
  // let seedViewState = this._seedViewStates.get(viewClassName);
  // if (seedViewState) {
  //   return seedViewState;
  // }
  // const iModelConnection = UiFramework.getIModelConnection();
  // if (!iModelConnection) {
  //   throw new Error("IModel Connection is invalid ");
  // }
  const viewId = await getDefaultViewIdFromClassName(
    iModelConnection,
    viewClassName,
  );
  const seedViewState = await iModelConnection.views.load(viewId);
  // this._seedViewStates.set(viewClassName, seedViewState);
  return seedViewState;
}

// code is not D.R.Y but this decision was made to uphold existing contracts
// method shared some implementation with getDefaultViewId
async function getDefaultViewIdFromClassName(
  iModelConnection: IModelConnection,
  savedViewType: ViewTypes,
) {
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
  const viewId = await iModelConnection.views.queryDefaultViewId();
  const params: ViewQueryParams = {};
  params.from = viewFullName;
  params.where = "ECInstanceId=" + viewId;

  // Check validity of default view
  const viewProps =
    await IModelReadRpcInterface.getClient().queryElementProps(
      iModelConnection.getRpcProps(),
      params,
    );
  if (viewProps.length === 0) {
    // Return the first view we can find
    const viewList = await iModelConnection.views.getViewList({
      from: viewFullName,
      wantPrivate: false,
    });
    if (viewList.length === 0) {
      return "";
    }
    return viewList[0].id;
  }

  return viewId;
}

/**
 * Creates a ViewState from a SavedView object returned by the SavedViewsClient
 * @param iModelConnection IModelConnection to use for requesting source view states
 * @param savedView SavedView object obtained from SavedViewsClient
 */
async function createViewState(
  iModelConnection: IModelConnection,
  savedView: LegacySavedViewBase,
): Promise<ViewState | undefined> {
  if (isSpatialSavedView(savedView)) {
    return _createSpatialViewState(iModelConnection, savedView as LegacySavedView);
  } else if (isDrawingSavedView(savedView)) {
    return _createDrawingViewState(iModelConnection, savedView as LegacySavedView2d);
  } else if (isSheetSavedView(savedView)) {
    return _createSheetViewState(iModelConnection, savedView as LegacySavedView2d);
  }
  return undefined;
}

/** Creates a spatial view state from the saved view object props */
async function _createSpatialViewState(
  iModelConnection: IModelConnection,
  savedView: LegacySavedView,
): Promise<SpatialViewState | undefined> {
  const props: ViewStateProps = {
    viewDefinitionProps: savedView.viewDefinitionProps,
    categorySelectorProps: savedView.categorySelectorProps,
    modelSelectorProps: savedView.modelSelectorProps,
    displayStyleProps: savedView.displayStyleProps,
  };
  const viewState = SpatialViewState.createFromProps(props, iModelConnection);
  await viewState.load();
  return viewState;
}

/** Creates a drawing view state from the data object */
async function _createDrawingViewState(
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

/** Creates a sheet view state from the data object */
async function _createSheetViewState(
  iModelConnection: IModelConnection,
  savedView: LegacySavedView2d,
): Promise<SheetViewState | undefined> {
  if (
    savedView.sheetProps === undefined ||
    savedView.sheetAttachments === undefined
  ) {
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

export async function translateLegacySavedViewToITwinJsViewState(legacySavedViewResponse: SavedViewWithDataRepresentation, iModelConnection: IModelConnection): Promise<ViewState | undefined> {
  const legacySavedView = legacyViewFrom(legacySavedViewResponse);
  const viewState = await createViewState(iModelConnection, legacySavedView);

  if (viewState) {
    await applyHiddenModelsAndCategories(viewState, legacySavedView, iModelConnection);
  }

  return viewState;
}

/*
 * Apply overrides for the supplied viewport based on extension data. Only works with legacy-formatted extension data.
 */
async function applyExtensionOverrides(legacySavedView: LegacySavedViewBase, viewport: Viewport) {
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

/*
 * Apply extension data (overrides) onto the supplied viewport. Only works with legacy-formatted extension data.
 */
export async function applyExtensionsToViewport(viewport: ScreenViewport, legacySavedViewResponse: SavedViewWithDataRepresentation | undefined) {
  if (!legacySavedViewResponse) {
    return;
  }

  await applyExtensionOverrides(legacyViewFrom(legacySavedViewResponse), viewport);
}
