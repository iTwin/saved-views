/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { IModelReadRpcInterface, ViewQueryParams, ViewStateProps } from "@itwin/core-common";
import {
  DrawingViewState, EmphasizeElements, IModelConnection, ScreenViewport, SheetViewState,
  SpatialViewState, Viewport, ViewState,
} from "@itwin/core-frontend";
import {
  Extension, SavedViewWithDataRepresentation, ViewData, ViewDataItwin3d, ViewDataITwinDrawing,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ViewDataITwinSheet, ViewDataWithLegacy,
} from "@itwin/saved-views-client";

import { ViewTypes } from "../../../SavedViewTypes.js";
import {
  isDrawingSavedView, isSheetSavedView, isSpatialSavedView,
} from "../../clients/ISavedViewsClient.js";
import {
  SavedView as LegacySavedView, SavedView2d as LegacySavedView2d,
  SavedViewBase as LegacySavedViewBase,
} from "../SavedViewTypes.js";
import { applyHiddenModelsAndCategories } from "./ModelsAndCategoriesHelper.js";
import { SavedViewsExtensionHandlers } from "./SavedViewsExtensionHandlers.js";
import {
  cleanLegacyViewModelSelectorPropsModels, savedViewITwin3dToLegacy3dSavedView,
  savedViewItwinDrawingToLegacyDrawingView, savedViewItwinSheetToLegacySheetSavedView,
} from "./viewExtractorSavedViewToLegacySavedView.js";

/**
 * Type-check for {@link ViewDataItwin3d}
 */
function isSavedViewItwin3d(savedViewData: ViewData): savedViewData is ViewDataItwin3d {
  return (savedViewData as ViewDataItwin3d).itwin3dView !== undefined;
}

/**
 * Type-check for {@link ViewDataITwinSheet}
 */
function isSavedViewItwinSheet(savedViewData: ViewData): savedViewData is ViewDataITwinSheet {
  return (savedViewData as ViewDataITwinSheet).itwinSheetView !== undefined;
}

/**
 * Type-check for {@link ViewDataITwinDrawing}
 */
function isSavedViewItwinDrawing(savedViewData: ViewData): savedViewData is ViewDataITwinDrawing {
  return (savedViewData as ViewDataITwinDrawing).itwinDrawingView !== undefined;
}

/**
 * Extract the legacy saved view data from a legacy saved view response
 * @param legacySavedViewResponse
 * @returns SavedViewBase legacy view data
 */
function legacyViewFrom(legacySavedViewResponse: SavedViewWithDataRepresentation): LegacySavedViewBase {
  return legacySavedViewResponse.savedViewData.legacyView as LegacySavedViewBase;
}

/**
 * Converts a saved view response to a saved view response that includes a legacy view.
 * @param savedViewResponse A saved view response with or without a legacy view.
 * @param iModelConnection The {@link IModelConnection} for the saved view; used to query for additional information.
 * @returns A {@link SavedViewWithDataRepresentation} that contains legacy saved view data (i.e., {@link ViewDataWithLegacy.legacyView}).
 */
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
 * Converts a legacy saved view (response) to an iTwin.js ViewState.
 * @param legacySavedViewResponse A saved view response that includes a legacy view (i.e., {@link ViewDataWithLegacy.legacyView}).
 * @param iModelConnection The {@link IModelConnection} for the saved view; used to query for additional information.
 * @returns A {@link ViewState} with the saved view applied.
 */
export async function translateLegacySavedViewToITwinJsViewState(legacySavedViewResponse: SavedViewWithDataRepresentation, iModelConnection: IModelConnection): Promise<ViewState | undefined> {
  const legacySavedView = legacyViewFrom(legacySavedViewResponse);
  const viewState = await createViewState(iModelConnection, legacySavedView);

  if (viewState) {
    await applyHiddenModelsAndCategories(viewState, legacySavedView, iModelConnection);
  }

  return viewState;
}

/**
 * Apply extension data (overrides) onto the supplied viewport. Only works with legacy-formatted extension data.
 * @param viewport The {@link ScreenViewport} used to display the saved view and iModel.
 * @param legacySavedViewResponse A saved view response that includes a legacy view (i.e., {@link ViewDataWithLegacy.legacyView}).
 */
export async function applyExtensionsToViewport(viewport: ScreenViewport, legacySavedViewResponse: SavedViewWithDataRepresentation | undefined) {
  if (!legacySavedViewResponse) {
    return;
  }
  await applyExtensionOverrides(legacyViewFrom(legacySavedViewResponse), viewport);
}

/**
* Creates legacy saved view data from a saved view response.
* @param savedViewResponse A saved view response with or without a legacy view.
* @param iModelConnection The {@link IModelConnection} for the saved view; used to query for additional information.
* @resolves The saved views formatted as a legacy SavedViewBase.
*/
async function translateSavedViewToLegacySavedView(
  savedViewResponse: SavedViewWithDataRepresentation,
  iModelConnection: IModelConnection,
 ): Promise<LegacySavedViewBase> {
  const savedViewData = savedViewResponse.savedViewData;
  // If the legacy view already exists, use that; otherwise, use extraction code to get the legacy view
  let legacySavedView: LegacySavedViewBase;
  if (savedViewData.legacyView) {
    savedViewResponse = cleanLegacyViewModelSelectorPropsModels(savedViewResponse);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    legacySavedView = savedViewData.legacyView as any;
    // legacySavedView.id = savedView.id; // Change legacy sv id to comboId

  } else if (isSavedViewItwin3d(savedViewData)) {
    const iModelViewData = await fetchIModelViewData(
      ViewTypes.ViewDefinition3d,
      iModelConnection,
    );
    const actual = savedViewITwin3dToLegacy3dSavedView(
      savedViewResponse,
      iModelViewData as SpatialViewState,
    );
    legacySavedView = actual;

  } else if (isSavedViewItwinDrawing(savedViewData)) {
    const iModelViewData = await fetchIModelViewData(
      ViewTypes.DrawingViewDefinition,
      iModelConnection,
    );
    const actual = savedViewItwinDrawingToLegacyDrawingView(
      savedViewResponse,
      iModelViewData as DrawingViewState,
    );
    legacySavedView = actual;

  } else if (isSavedViewItwinSheet(savedViewData)) {
    const iModelViewData = await fetchIModelViewData(
      ViewTypes.SheetViewDefinition,
      iModelConnection,
    );
    const actual = savedViewItwinSheetToLegacySheetSavedView(
      savedViewResponse,
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
  for (const ext of savedViewResponse.extensions as Extension[]) {
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
  const viewId = await getDefaultViewIdFromClassName(
    iModelConnection,
    viewClassName,
  );
  const seedViewState = await iModelConnection.views.load(viewId);
  return seedViewState;
}

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

/**
 * Apply overrides onto the supplied viewportbased on extension data. Only works with legacy-formatted extension data.
 * @param legacySavedView A legacy saved view.
 * @param viewport The {@link ScreenViewport} used to display the saved view and iModel.
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
