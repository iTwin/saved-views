// Copyright (c) Bentley Systems, Incorporated. All rights reserved.
import { SavedView } from "./SavedView.dto";
import { ViewWithLegacy } from "./View.dto";

/**
 * Saved view metadata model for restful get saved view operations following Apim standards.
 */
export interface SavedViewWithData extends SavedView {
  savedViewData: ViewWithLegacy;
}
