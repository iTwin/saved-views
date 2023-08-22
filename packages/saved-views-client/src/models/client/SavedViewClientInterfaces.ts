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
import { ImageResponse, ImageUpdate } from "../Image.dto";
import { ImageSize } from "../ImageSize";
import { ExtensionListResponse, ExtensionResponse, ExtensionsUpdate } from "../Extension.dto";
import { GroupCreate, GroupListResponse, GroupResponse, GroupUpdate } from "../Group.dto";
import { TagCreate, TagListResponse, TagResponse, TagUpdate } from "../Tag.dto";


export interface RequestBySavedViewId extends CommonRequestArgs {
  savedViewId: string;
}

export interface SingleSavedView extends RequestBySavedViewId {
  /** affects the granularity of the data returned
   *  ONLY for get requests will be ignored for PUT POST DELETE
   *  MINIMAL = "return=minimal", least info
   *  REPRESENTATION = "return=representation" most info
  */
  prefer?: PreferOptions;
}

export interface GetSavedViews extends CommonRequestArgs {
  iTwinId: string;
  iModelId?: string;
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

export interface CreateSavedView extends CommonRequestArgs {
  savedViewPayload: SavedViewCreate & Record<string, unknown>;
}

export interface UpdateSavedView extends SingleSavedView {
  savedViewPayload: SavedViewUpdate & Record<string, unknown>;
}

export interface GetImage extends RequestBySavedViewId {
  size: ImageSize;
}

export interface UpdateImage extends RequestBySavedViewId {
  imagePayload: ImageUpdate & Record<string, unknown>;
}

export interface GetGroups extends CommonRequestArgs {
  iTwinId: string;
  iModelId?: string;
}

export interface SingleGroup extends CommonRequestArgs {
  groupId: string;
}

export interface CreateGroup extends CommonRequestArgs {
  groupPayload: GroupCreate & Record<string, unknown>;
}

export interface UpdateGroup extends SingleGroup {
  groupPayload: GroupUpdate & Record<string, unknown>;
}

export interface CreateExtension extends RequestBySavedViewId {
  /** extension to be created
   * Extensions allow a saved view to be enhanced with custom data. The extensions have to be defined in a proprietary .JSON schema file. For now, only three extensions are available:
   * 1. PerModelCategoryVisibility
   * 2. EmphasizeElements
   * 3. VisibilityOverride
  */
  extension: ExtensionsUpdate & Record<string, unknown>;
}

export interface SingleExtension extends RequestBySavedViewId {
  extensionName: string;
}

export interface GetTags extends CommonRequestArgs {
  iTwinId: string;

  iModelId?: string;
}
export interface UpdateTag extends SingleTag {
  tagPayload: TagUpdate & Record<string, unknown>;
}

export interface CreateTag extends CommonRequestArgs {
  tagPayload: TagCreate & Record<string, unknown>;
}

export interface SingleTag extends CommonRequestArgs {
  tagId: string;
}

export interface SaveViewsClient {
  getSavedView(args: SingleSavedView): Promise<SavedViewResponse>;
  getAllSavedViews(args: GetSavedViews): Promise<SavedViewListResponse>;
  createSavedView(args: CreateSavedView): Promise<SavedViewResponse>;
  updateSavedView(args: UpdateSavedView): Promise<SavedViewResponse>;
  deleteSavedView(args: SingleSavedView): Promise<void>;

  getImage(args: GetImage): Promise<ImageResponse>;
  updateImage(args: UpdateImage): Promise<ImageResponse>;

  getGroup(args: SingleGroup): Promise<GroupResponse>;
  getAllGroups(args: GetGroups): Promise<GroupListResponse>;
  createGroup(args: CreateGroup): Promise<GroupResponse>;
  updateGroup(args: UpdateGroup): Promise<GroupResponse>;
  deleteGroup(args: SingleGroup): Promise<void>;

  createExtension(args: CreateExtension): Promise<ExtensionResponse>;
  getExtension(args: SingleExtension): Promise<ExtensionResponse>;
  getAllExtensions(args: RequestBySavedViewId): Promise<ExtensionListResponse>;
  deleteExtension(args: SingleExtension): Promise<void>;

  createTag(args: CreateTag): Promise<TagResponse>;
  getTag(args: SingleTag): Promise<TagResponse>;
  getAllTags(args: GetTags): Promise<TagListResponse>;
  deleteTag(args: SingleTag): Promise<void>;
  updateTag(args: UpdateTag): Promise<TagResponse>;
}
