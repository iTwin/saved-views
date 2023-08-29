/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { SavedView } from "./SavedView.js";
import { ViewWithLegacy } from "./View.js";

/** Saved view metadata model for restful get saved view operations following Apim standards. */
export interface SavedViewWithData extends SavedView {
  savedViewData: ViewWithLegacy;
}
