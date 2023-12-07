// Copyright (c) Bentley Systems, Incorporated. All rights reserved.
import { IModelReadRpcInterface, ViewQueryParams, ViewStateProps } from '@itwin/core-common';
import {
  DrawingViewState, IModelConnection, SheetViewState, SpatialViewState, ViewState
} from '@itwin/core-frontend';
import {
  Extension, SavedViewWithDataRepresentation, ViewData, ViewDataItwin3d, ViewDataITwinDrawing,
  ViewDataITwinSheet
} from '@itwin/saved-views-client';

import { ViewTypes } from '../../../SavedViewTypes.js';
import {
  isDrawingSavedView, isSheetSavedView, isSpatialSavedView
} from '../../clients/ISavedViewsClient.js';
import {
  SavedView as LegacySavedView, SavedView2d as LegacySavedView2d,
  SavedViewBase as LegacySavedViewBase
} from '../SavedViewTypes.js';
import {
  cleanLegacyViewModelSelectorPropsModels, savedViewITwin3dToLegacy3dSavedView,
  savedViewItwinDrawingToLegacyDrawingView, savedViewItwinSheetToLegacySheetSavedView
} from './viewExtractorSavedViewToLegacySavedView.js';

/*
 * Converts a Saved View into an iTwin.js-style ViewState
 */
export async function translateSavedViewIntoITwinJsViewState(savedView: SavedViewWithDataRepresentation, iModelConnection: IModelConnection): Promise<ViewState | undefined> {

  /*
   * This fucntion converts a saved view from the Saved View API into a legacy view,
   * then converts the legacy view into an iTwin.js-style ViewState.
   *
   * Once legacy views are officially retired, a straight translation from Saved View to ViewState can be done instead
   * (but code has not been created for that yet).
   */

  // Translate into legacy view
  const legacySavedView: LegacySavedView | LegacySavedView2d = await translateSavedViewToLegacySavedView(savedView, iModelConnection);

  // Translate into iTwin.js-style ViewState
  const viewState = await translateLegacySavedViewToITwinJsViewState(legacySavedView, iModelConnection);

  return viewState;
}

declare const isSavedViewItwin3d: (savedViewData: ViewData) => savedViewData is ViewDataItwin3d;
declare const isSavedViewItwinSheet: (savedViewData: ViewData) => savedViewData is ViewDataITwinSheet;
declare const isSavedViewItwinDrawing: (savedViewData: ViewData) => savedViewData is ViewDataITwinDrawing;

/**
* Convert the saved view response recieved from the itwin-saved-views API into a SavedViewBaseSetting
* @param id
* @param savedView
* @returns Promise<SavedViewBase>
*/
async function translateSavedViewToLegacySavedView(
  savedView: SavedViewWithDataRepresentation,
  iModelConnection: IModelConnection,
 ): Promise<LegacySavedView | LegacySavedView2d> {
  const savedViewData = savedView.savedViewData;
  // If the legacy view already exists, use that; otherwise, use extraction code to get the legacy view
  let legacySavedView: LegacySavedView | LegacySavedView2d;
  if (savedViewData.legacyView) {
    savedView = cleanLegacyViewModelSelectorPropsModels(savedView);
    legacySavedView = savedViewData.legacyView as any;
    // legacySavedView.id = savedView.id; // Change legacy sv id to comboId

  } else if (isSavedViewItwin3d(savedViewData)) {
    const iModelViewData = await fetchIModelViewData(
      ViewTypes.ViewDefinition3d,
      iModelConnection,
    );

    const actual = savedViewITwin3dToLegacy3dSavedView(
      savedView,
      iModelViewData as SpatialViewState
    );
    legacySavedView = actual;
  } else if (isSavedViewItwinDrawing(savedViewData)) {
    const iModelViewData = await fetchIModelViewData(
      ViewTypes.DrawingViewDefinition,
      iModelConnection,
    );
    const actual = savedViewItwinDrawingToLegacyDrawingView(
      savedView,
      iModelViewData as DrawingViewState
    );
    legacySavedView = actual;
  } else if (isSavedViewItwinSheet(savedViewData)) {
    const iModelViewData = await fetchIModelViewData(
      ViewTypes.SheetViewDefinition,
      iModelConnection,
    );
    const actual = savedViewItwinSheetToLegacySheetSavedView(
      savedView,
      iModelViewData as SheetViewState
    );
    legacySavedView = actual;
  } else {
    throw new Error(
      "Could not translate itwin-saved-views API response to a SavedViewBaseSetting"
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
    viewClassName
  );
  let seedViewState = await iModelConnection.views.load(viewId);
  // this._seedViewStates.set(viewClassName, seedViewState);
  return seedViewState;
}

// code is not D.R.Y but this decision was made to uphold existing contracts
// method shared some implementation with getDefaultViewId
async function getDefaultViewIdFromClassName(
  iModelConnection: IModelConnection,
  savedViewType: ViewTypes
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
  // eslint-disable-next-line deprecation/deprecation
  const viewId = await iModelConnection.views.queryDefaultViewId();
  const params: ViewQueryParams = {};
  params.from = viewFullName;
  params.where = "ECInstanceId=" + viewId;

  // Check validity of default view
  const viewProps =
    await IModelReadRpcInterface.getClient().queryElementProps(
      iModelConnection.getRpcProps(),
      params
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

async function translateLegacySavedViewToITwinJsViewState(legacySavedView: LegacySavedView | LegacySavedView2d, iModelConnection: IModelConnection): Promise<ViewState | undefined> {
  return createViewState(iModelConnection, legacySavedView);
}
