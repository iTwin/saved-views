/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { HalLinks } from "../Links.dto";
import { SavedView } from "./SavedView.dto";

/** Saved view list response model for restful get all saved views operations. */
export interface SavedViewListResponse {
  savedViews: SavedView[];
  _links: HalLinks<["self", "prev"?, "next"?]>;
}
