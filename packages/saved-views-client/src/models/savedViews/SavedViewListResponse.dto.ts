/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { SavedView } from "./SavedView.dto";

type HalLinks<T extends Array<string | undefined>> = {
  [K in keyof T as T[K] & string]: { href: string; };
};

/** Saved view list response model for restful get all saved views operations. */
export interface SavedViewListResponse {
  savedViews: SavedView[];
  _links: HalLinks<["self", "prev"?, "next"?]>;
}
