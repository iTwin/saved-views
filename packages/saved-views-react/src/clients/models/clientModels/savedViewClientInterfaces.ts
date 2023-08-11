// Copyright (c) Bentley Systems, Incorporated. All rights reserved.

import { preferOptions } from "../prefer";
import { commonRequestArgs } from "./commonClientInterfaces";
import { CombinedId, SavedViewResponse, SavedViewListResponse, SavedViewCreate, SavedViewUpdate } from '@bentley/itwin-saved-views-utilities';

export interface singleSavedViewArgs extends commonRequestArgs {
  /** saved view id to query after */
  savedViewsId: CombinedId;
  /** affects the granularity of the data returned
   *  ONLY for get requests will be ignored for PUT POST DELETE
   *  MINIMAL = "return=minimal", least info
   *  REPRESENTATION = "return=representation" most info
  */
  prefer?: preferOptions;
}

export interface getAllSavedViewArgs extends commonRequestArgs {
  /** id of the project/iTwin the views belong to */
  iTwinId: string;
  /** optional id of the project/iTwin the views belong to */
  iModelId?: string;
  /** optional groupId to query*/
  groupId?: string;
  /** optional param for top of page */
  top?: string;
  /** optional param for skip of page*/
  skip?: string;
  /** affects the granularity of the data returned
   *  MINIMAL = "return=minimal", least info
   *  REPRESENTATION = "return=representation" most info
  */
  prefer?: preferOptions;
}

export interface createSavedViewArgs extends commonRequestArgs {
  /** payload for savedView*/
  savedViewPayload: SavedViewCreate;
}

export interface updateSavedViewArgs extends singleSavedViewArgs {
  /** payload for savedView */
  savedViewPayload: SavedViewUpdate;
}

export interface SaveViewsClient {
  /** gets a savedView
   * @throws on non 2xx response
 */
  getSavedView(args: singleSavedViewArgs): Promise<SavedViewResponse>;

  /** gets all savedViews
   * @throws on non 2xx response
 */
  getAllSavedViews(args: getAllSavedViewArgs): Promise<SavedViewListResponse>;

  /** creates savedView
   * @throws on non 2xx response
 */
  createSavedView(args: createSavedViewArgs): Promise<SavedViewResponse>;

  /** creates savedView
  * @throws on non 2xx response
 */
  updateSavedView(args: updateSavedViewArgs): Promise<SavedViewResponse>;

  /**deletes a savedView
   * @throws on non 2xx response
 */
  deleteSavedView(args: singleSavedViewArgs): Promise<void>;
}
