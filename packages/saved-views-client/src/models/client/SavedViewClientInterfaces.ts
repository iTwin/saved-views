/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { SavedViewCreate } from "../savedViews/SavedViewCreate.dto";
import { SavedViewListResponse } from "../savedViews/SavedViewListResponse.dto";
import { SavedViewResponse } from "../savedViews/SavedViewResponse.dto";
import { SavedViewUpdate } from "../savedViews/SavedViewUpdate.dto";
import { PreferOptions } from "../Prefer";
import { CommonRequestParams } from "./CommonClientInterfaces";
import { ImageResponse, ImageUpdate } from "../Image.dto";
import { ImageSize } from "../ImageSize";
import { ExtensionListResponse, ExtensionResponse, ExtensionsUpdate } from "../Extension.dto";
import { GroupCreate, GroupListResponse, GroupResponse, GroupUpdate } from "../Group.dto";
import { TagCreate, TagListResponse, TagResponse, TagUpdate } from "../Tag.dto";


export interface GetExtensionsParams extends CommonRequestParams {
  savedViewId: string;
}

export interface SingleSavedViewParams extends GetExtensionsParams {
  /**
   * affects the granularity of the data returned
   *  ONLY for get requests will be ignored for PUT POST DELETE
   *  MINIMAL = "return=minimal", least info
   *  REPRESENTATION = "return=representation" most info
  */
  prefer?: PreferOptions;
}

export interface GetSavedViewsParams extends CommonRequestParams {
  iTwinId: string;
  iModelId?: string;
  groupId?: string;
  /** optional param for top of page */
  top?: string;
  /** optional param for skip of page*/
  skip?: string;
  /**
   * affects the granularity of the data returned
   *  MINIMAL = "return=minimal", least info
   *  REPRESENTATION = "return=representation" most info
  */
  prefer?: PreferOptions;
}

export interface CreateSavedViewParams extends CommonRequestParams {
  body: SavedViewCreate;
}

export interface UpdateSavedViewParams extends SingleSavedViewParams {
  body: SavedViewUpdate;
}

export interface GetImageParams extends GetExtensionsParams {
  size: ImageSize;
}

export interface UpdateImageParams extends GetExtensionsParams {
  body: ImageUpdate;
}

export interface GetGroupsParams extends CommonRequestParams {
  iTwinId: string;
  iModelId?: string;
}

export interface SingleGroupParams extends CommonRequestParams {
  groupId: string;
}

export interface CreateGroupParams extends CommonRequestParams {
  body: GroupCreate;
}

export interface UpdateGroupParams extends SingleGroupParams {
  body: GroupUpdate;
}

export interface CreateExtensionParams extends GetExtensionsParams {
  /**
   * extension to be created
   * Extensions allow a saved view to be enhanced with custom data. The extensions have to be defined in a proprietary .JSON schema file.
   * For now, only three extensions are available:
   * 1. PerModelCategoryVisibility
   * 2. EmphasizeElements
   * 3. VisibilityOverride
  */
  body: ExtensionsUpdate;
}

export interface SingleExtensionParams extends GetExtensionsParams {
  extensionName: string;
}

export interface GetTagsParams extends CommonRequestParams {
  iTwinId: string;

  iModelId?: string;
}
export interface UpdateTagParams extends SingleTagParams {
  body: TagUpdate;
}

export interface CreateTagParams extends CommonRequestParams {
  body: TagCreate;
}

export interface SingleTagParams extends CommonRequestParams {
  tagId: string;
}

export interface SaveViewsClient {
  getSavedView(args: SingleSavedViewParams): Promise<SavedViewResponse>;
  getAllSavedViews(args: GetSavedViewsParams): Promise<SavedViewListResponse>;
  createSavedView(args: CreateSavedViewParams): Promise<SavedViewResponse>;
  updateSavedView(args: UpdateSavedViewParams): Promise<SavedViewResponse>;
  deleteSavedView(args: SingleSavedViewParams): Promise<void>;

  getImage(args: GetImageParams): Promise<ImageResponse>;
  updateImage(args: UpdateImageParams): Promise<ImageResponse>;

  getGroup(args: SingleGroupParams): Promise<GroupResponse>;
  getAllGroups(args: GetGroupsParams): Promise<GroupListResponse>;
  createGroup(args: CreateGroupParams): Promise<GroupResponse>;
  updateGroup(args: UpdateGroupParams): Promise<GroupResponse>;
  deleteGroup(args: SingleGroupParams): Promise<void>;

  createExtension(args: CreateExtensionParams): Promise<ExtensionResponse>;
  getExtension(args: SingleExtensionParams): Promise<ExtensionResponse>;
  getAllExtensions(args: GetExtensionsParams): Promise<ExtensionListResponse>;
  deleteExtension(args: SingleExtensionParams): Promise<void>;

  createTag(args: CreateTagParams): Promise<TagResponse>;
  getTag(args: SingleTagParams): Promise<TagResponse>;
  getAllTags(args: GetTagsParams): Promise<TagListResponse>;
  deleteTag(args: SingleTagParams): Promise<void>;
  updateTag(args: UpdateTagParams): Promise<TagResponse>;
}
