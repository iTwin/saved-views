// Copyright (c) Bentley Systems, Incorporated. All rights reserved.

import { SavedViewCreate } from "../../../models/savedViews/SavedViewCreate.dto";
import { SavedViewListResponse } from "../../../models/savedViews/SavedViewListResponse.dto";
import { SavedViewResponse } from "../../../models/savedViews/SavedViewResponse.dto";
import { SavedViewUpdate } from "../../../models/savedViews/SavedViewUpdate.dto";
import { PreferOptions } from "../Prefer";
import { CommonRequestArgs } from "./CommonClientInterfaces";

export interface SingleSavedViewArgs extends CommonRequestArgs {
  /** saved view id to query after */
  savedViewId: string;
  /** affects the granularity of the data returned
   *  ONLY for get requests will be ignored for PUT POST DELETE
   *  MINIMAL = "return=minimal", least info
   *  REPRESENTATION = "return=representation" most info
  */
  prefer?: PreferOptions;
}

export interface GetAllSavedViewArgs extends CommonRequestArgs {
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
  prefer?: PreferOptions;
}

export interface CreateSavedViewArgs extends CommonRequestArgs {
  /** payload for savedView*/
  savedViewPayload: SavedViewCreate;
}

export interface UpdateSavedViewArgs extends SingleSavedViewArgs {
  /** payload for savedView */
  savedViewPayload: SavedViewUpdate;
}

export interface SaveViewsClient {
  /** gets a savedView
   * @throws on non 2xx response
 */
  getSavedView(args: SingleSavedViewArgs): Promise<SavedViewResponse>;

  /** gets all savedViews
   * @throws on non 2xx response
 */
  getAllSavedViews(args: GetAllSavedViewArgs): Promise<SavedViewListResponse>;

  /** creates savedView
   * @throws on non 2xx response
 */
  createSavedView(args: CreateSavedViewArgs): Promise<SavedViewResponse>;

  /** creates savedView
  * @throws on non 2xx response
 */
  updateSavedView(args: UpdateSavedViewArgs): Promise<SavedViewResponse>;

  /**deletes a savedView
   * @throws on non 2xx response
 */
  deleteSavedView(args: SingleSavedViewArgs): Promise<void>;
}
