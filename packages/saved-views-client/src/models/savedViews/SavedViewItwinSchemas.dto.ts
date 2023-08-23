/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { SavedView } from "./SavedView.dto";
import {
  SavedViewBase,
  ViewItwin3d,
  ViewItwinSheet,
  ViewItwinDrawing,
} from "./View.dto";

type ViewType = "itwinSheetView" & "itwin3dView" & "itwinDrawingView";

/** SavedViewRsp */
export interface SavedViewRspBase extends SavedView {
  savedViewData: {
    [key in ViewType]: SavedViewBase;
  };
}

/** SavedViewItwin3d */
export interface SavedViewItwin3d extends SavedViewRspBase {
  /** Store Of View Data Coming From Service */
  savedViewData: { itwin3dView: ViewItwin3d; };
}

export const isSavedViewItwin3d = (
  savedViewRsp: SavedViewRspBase,
): savedViewRsp is SavedViewItwin3d =>
  "itwin3dView" in savedViewRsp.savedViewData;

/** SavedViewItwinSheet */
export interface SavedViewItwinSheet extends SavedViewRspBase {
  /** Store Of View Data Coming From Service */
  savedViewData: { itwinSheetView: ViewItwinSheet; };
}

export const isSavedViewItwinSheet = (
  savedViewRsp: SavedViewRspBase,
): savedViewRsp is SavedViewItwinSheet =>
  "itwinSheetView" in savedViewRsp.savedViewData;

/** SavedViewItwinDrawing */
export interface SavedViewItwinDrawing extends SavedViewRspBase {
  /** Store Of View Data Coming From Service */
  savedViewData: { itwinDrawingView: ViewItwinDrawing; };
}

export const isSavedViewItwinDrawing = (
  savedViewRsp: SavedViewRspBase,
): savedViewRsp is SavedViewItwinDrawing =>
  "itwinDrawingView" in savedViewRsp.savedViewData;
