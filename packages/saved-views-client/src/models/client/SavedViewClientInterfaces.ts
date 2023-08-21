/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { SavedViewCreate } from "../savedViews/SavedViewCreate.dto";
import { SavedViewListResponse } from "../savedViews/SavedViewListResponse.dto";
import { SavedViewResponse } from "../savedViews/SavedViewResponse.dto";
import { SavedViewUpdate } from "../savedViews/SavedViewUpdate.dto";
import { PreferOptions } from "../Prefer";
import { CommonRequestArgs } from "./CommonClientInterfaces";
import { ImageResponse } from "../images/ImageResponse.dto";
import { ImageUpdate } from "../images/ImageUpdate.dto";
import { ImageSize } from "../ImageSize";
import { GroupCreate } from "../groups/GroupCreate.dto";
import { GroupListResponse } from "../groups/GroupListResponse.dto";
import { GroupResponse } from "../groups/GroupResponse.dto";
import { GroupUpdate } from "../groups/GroupUpdate.dto";
import { ExtensionListResponse } from "../extensions/ExtensionListResponse.dto";
import { ExtensionResponse } from "../extensions/ExtensionResponse.dto";
import { ExtensionsUpdate } from "../extensions/ExtensionsUpdate.dto";
import { TagCreate } from "../tags/TagCreate.dto";
import { TagListResponse } from "../tags/TagListResponse.dto";
import { TagResponse } from "../tags/TagResponse.dto";
import { TagUpdate } from "../tags/TagUpdate.dto";

export interface CommonGetAllArgs extends CommonRequestArgs {
  iTwinId: string;

  iModelId?: string;
}

export interface RequestBySavedViewIdArgs extends CommonRequestArgs {
  savedViewId: string;
}

export interface SingleSavedViewArgs extends RequestBySavedViewIdArgs {
  /** affects the granularity of the data returned
   *  ONLY for get requests will be ignored for PUT POST DELETE
   *  MINIMAL = "return=minimal", least info
   *  REPRESENTATION = "return=representation" most info
  */
  prefer?: PreferOptions;
}

export interface GetAllSavedViewArgs extends CommonRequestArgs, CommonGetAllArgs {
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
  savedViewPayload: SavedViewCreate;
}

export interface UpdateSavedViewArgs extends SingleSavedViewArgs {
  savedViewPayload: SavedViewUpdate;
}

export interface GetImageArgs extends RequestBySavedViewIdArgs {
  size: ImageSize;
}

export interface UpdateImageArgs extends RequestBySavedViewIdArgs {
  imagePayload: ImageUpdate;
}

export interface SingleGroupArgs extends CommonRequestArgs {
  groupId: string;
}

export interface CreateGroup extends CommonRequestArgs {
  groupPayload: GroupCreate;
}

export interface UpdateGroupArgs extends SingleGroupArgs {
  groupPayload: GroupUpdate;
}

export interface CreateExtensionArgs extends RequestBySavedViewIdArgs {
  /** extension to be created
   * Extensions allow a saved view to be enhanced with custom data. The extensions have to be defined in a proprietary .JSON schema file. For now, only three extensions are available:
   * 1. PerModelCategoryVisibility
   * 2. EmphasizeElements
   * 3. VisibilityOverride
  */
  extension: ExtensionsUpdate;
}

export interface SingleExtensionArgs extends RequestBySavedViewIdArgs {
  extensionName: string;
}

export interface UpdateTagArgs extends SingleTagArgs {
  tagPayload: TagUpdate;
}

export interface CreateTagArgs extends CommonRequestArgs {
  tagPayload: TagCreate;
}

export interface SingleTagArgs extends CommonRequestArgs {
  tagId: string;
}

export interface SaveViewsClient {
  getSavedView(args: SingleSavedViewArgs): Promise<SavedViewResponse>;

  getAllSavedViews(args: GetAllSavedViewArgs): Promise<SavedViewListResponse>;

  createSavedView(args: CreateSavedViewArgs): Promise<SavedViewResponse>;

  updateSavedView(args: UpdateSavedViewArgs): Promise<SavedViewResponse>;

  deleteSavedView(args: SingleSavedViewArgs): Promise<void>;

  getImage(args: GetImageArgs): Promise<ImageResponse>;

  updateImage(args: UpdateImageArgs): Promise<ImageResponse>;

  getGroup(args: SingleGroupArgs): Promise<GroupResponse>;

  getAllGroups(args: CommonGetAllArgs): Promise<GroupListResponse>;

  createGroup(args: CreateGroup): Promise<GroupResponse>;

  updateGroup(args: UpdateGroupArgs): Promise<GroupResponse>;

  deleteGroup(args: SingleGroupArgs): Promise<void>;

  createExtension(args: CreateExtensionArgs): Promise<ExtensionResponse>;

  getExtension(args: SingleExtensionArgs): Promise<ExtensionResponse>;

  getAllExtensions(args: RequestBySavedViewIdArgs): Promise<ExtensionListResponse>;

  deleteExtension(args: SingleExtensionArgs): Promise<void>;

  createTag(args: CreateTagArgs): Promise<TagResponse>;

  getTag(args: SingleTagArgs): Promise<TagResponse>;

  getAllTags(args: CommonGetAllArgs): Promise<TagListResponse>;

  deleteTag(args: SingleTagArgs): Promise<void>;

  updateTag(args: UpdateTagArgs): Promise<TagResponse>;
}
