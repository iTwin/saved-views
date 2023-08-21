/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { SavedView } from "./SavedView.dto";
import { SavedViewListLinks } from "./SavedViewLinks.dto";

/**
 * Saved view list response model for restful get all saved views operations.
 */
export interface SavedViewListResponse {
  savedViews: SavedView[];
  _links: SavedViewListLinks;
}
