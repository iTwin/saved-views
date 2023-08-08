// Copyright (c) Bentley Systems, Incorporated. All rights reserved.

import { CombinedId, ExtensionsUpdate, ExtensionResponse, ExtensionListResponse, GroupCreate, GroupListResponse, GroupResponse, GroupUpdate, ImageResponse, ImageUpdate, SavedViewCreate, SavedViewListResponse, SavedViewResponse, SavedViewUpdate, TagCreate, TagListResponse, TagResponse, TagUpdate } from "@bentley/itwin-saved-views-utilities";
import { ImageSize } from "./imageSize";
import { preferOptions } from "./prefer";

export interface IImageClient {
  /**
   * gets a image
   *@param token auth token fro request
   *@param savedViewId id to query after
   *@param size size of the image
   *@returns ImageResponse on success and undefined on error
 */
  getImage(token: string, saveViewId: CombinedId, size: ImageSize): Promise<ImageResponse | undefined>;

  /**
   * updates a image
   *@param token auth token fro request
   *@param savedViewId id to query after
   *@param imagePayload payload to update image with
   *@returns ImageResponse on success and undefined on error
 */
  updateImage(token: string, saveViewId: CombinedId, imagePayload: ImageUpdate): Promise<ImageResponse | undefined>;
}


export interface SaveViewsClient {
  /**
   * gets a savedView
   *@param token auth token fro request
   *@param savedViewId id to query after
    @param prefer optional affects the granularity of the data returned
   *@returns SaveViewResponse on success and undefined on error
 */
  getSavedView(token: string, savedViewId: CombinedId, prefer?: preferOptions): Promise<SavedViewResponse | undefined>;

  /**
   * gets all savedViews
   *@param token auth token fro request
    @param iTwinId id of the project/iTwin the views belong to
    @param iModel optional id of the project/iTwin the views belong to
    @param groupId optional groupId to query
   *@param top optional param for top of page
   *@param skip optional param for skip of page
    @param prefer optional affects the granularity of the data returned
   *@returns SaveViewListResponse on success and undefined on error
 */
  getAllSavedViews(token: string, iTwinId: string, iModelId?: string, groupId?: string, top?: string, skip?: string, prefer?: preferOptions): Promise<SavedViewListResponse | undefined>;

  /**
   * creates savedView
   *@param token auth token fro request
   *@param savedViewPayload payload for savedView
   *@returns SavedViewResponse on success and undefined on error
 */
  createSavedView(token: string, savedViewPayload: SavedViewCreate): Promise<SavedViewResponse | undefined>;

  /**
   * creates savedView
   *@param token auth token fro request
   *@param savedViewPayload payload for savedView
   *@returns SavedViewResponse on success and undefined on error
 */
  updateSavedView(token: string, savedViewId: CombinedId, savedViewPayload: SavedViewUpdate): Promise<SavedViewResponse | undefined>;

  /**
   * deletes a savedView
   *@param token auth token fro request
   *@param savedViewId id to query after
   *@param savedViewId id to query after
 */
  deleteSavedView(token: string, savedViewId: CombinedId): Promise<void>;
}


export interface TagsClient {
  /**
   * creates tag
   *@param token auth token fro request
   *@param tagPayload payload for savedView
   *@returns TagResponse on success and undefined on error
 */
  createTag(token: string, tagPayload: TagCreate): Promise<TagResponse | undefined>;

  /**
   * gets tag
   *@param token auth token fro request
   *@param tagId Id for tag
   *@returns TagResponse on success and undefined on error
 */
  getTag(token: string, tagId: CombinedId): Promise<TagResponse | undefined>;

  /**
   * gets all savedViews
   *@param token auth token fro request
   *@param iTwinId id of the project/iTwin the views belong to
   *@param iModel optional id of the project/iTwin the views belong to
   *@returns TagListResponse on success and undefined on error
 */
  getAllTags(token: string, iTwinId: string, iModelId?: string): Promise<TagListResponse | undefined>;

  /**
   * deletes Tag
   *@param token auth token fro request
   *@param tagId Id for tag
 */
  deleteTag(token: string, tagId: CombinedId): Promise<void>;

  /**
   * creates tag
   *@param token auth token fro request
   *@param tagId Id for tag
   *@param tagPayload payload for savedView
   *@returns TagResponse on success and undefined on error
 */
  updateTag(token: string, tagId: CombinedId, tagPayload: TagUpdate): Promise<TagResponse | undefined>;
}
