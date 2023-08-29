/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Extension, ExtensionListItem, ExtensionMin, ExtensionSavedViewCreate } from "../Extension.js";
import { Group } from "../Group.js";
import { HalLinks } from "../Links.js";
import { Tag } from "../Tag.js";
import { SavedView, SavedViewWithData, View } from "../savedViews/View.js";

export interface CommonRequestParams {
  signal?: AbortSignal;
  headers?: Record<string, string>;
  body?: object;
}

/** Image Size enum for request. */
export enum ImageSize {
  FULL = "full",
  THUMBNAIL = "thumbnail",
}

/** Prefer enum for request. */
export enum PreferOptions {
  MINIMAL = "return=minimal",
  REPRESENTATION = "return=representation",
}

export interface GetExtensionsParams extends CommonRequestParams {
  savedViewId: string;
}

export interface SingleSavedViewParams extends CommonRequestParams {
  /**
   * affects the granularity of the data returned
   *  ONLY for get requests will be ignored for PUT POST DELETE
   *  MINIMAL = "return=minimal", least info
   *  REPRESENTATION = "return=representation" most info
  */
  savedViewId: string;
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
  body: {
    iTwinId?: string;
    iModelId?: string;
    id?: string;
    savedViewData: View;
    groupId?: string;
    category?: string;
    displayName: string;
    shared?: boolean;
    tagIds?: string[];
    extensions?: ExtensionSavedViewCreate[];
  };
}

export interface UpdateSavedViewParams extends CommonRequestParams {
  savedViewId: string;
  body: {
    savedViewData?: View;
    groupId?: string;
    displayName?: string;
    shared?: boolean;
    tagIds?: string[];
    extensions?: ExtensionMin[];
    category?: string;
  };
}

export interface SavedViewResponse {
  savedView: SavedViewWithData;
}

export interface SavedViewListResponse {
  savedViews: SavedView[];
  _links: HalLinks<["self", "prev"?, "next"?]>;
}

export interface GetImageParams extends CommonRequestParams {
  size: ImageSize;
  savedViewId: string;
}

export interface UpdateImageParams {
  body: { image: string; };
  savedViewId: string;
}

export type ImageResponse = HalLinks<["href"]>;

export interface GetGroupsParams extends CommonRequestParams {
  iTwinId: string;
  iModelId?: string;
}

export interface SingleGroupParams extends CommonRequestParams {
  groupId: string;
}

export interface CreateGroupParams extends CommonRequestParams {
  body: {
    iTwinId?: string;
    iModelId?: string;
    displayName: string;
    shared?: boolean;
  };
}

export interface UpdateGroupParams extends CommonRequestParams {
  groupId: string;
  body: {
    displayName?: string;
    shared?: boolean;
  };
}

export interface GroupResponse {
  group: Group;
}

export interface GroupListResponse {
  groups: Group[];
  _links: HalLinks<["self"]>;
}

export interface CreateExtensionParams extends CommonRequestParams {
  /**
   * extension to be created
   * Extensions allow a saved view to be enhanced with custom data. The extensions have to be defined in a proprietary .JSON schema file.
   * For now, only three extensions are available:
   * 1. PerModelCategoryVisibility
   * 2. EmphasizeElements
   * 3. VisibilityOverride
  */
  savedViewId: string;
  body: {
    extensionName: string;
    data: string;
  };
}

export interface SingleExtensionParams extends CommonRequestParams {
  savedViewId: string;
  extensionName: string;
}

export interface ExtensionListResponse {
  extensions: ExtensionListItem[];
}

export interface ExtensionResponse {
  extension: Extension;
}

export interface GetTagsParams extends CommonRequestParams {
  iTwinId: string;
  iModelId?: string;
}
export interface UpdateTagParams extends CommonRequestParams {
  tagId: string;
  body: { displayName?: string; };
}

export interface CreateTagParams extends CommonRequestParams {
  body: {
    iTwinId?: string;
    iModelId?: string;
    displayName: string;
  };
}

export interface SingleTagParams extends CommonRequestParams {
  tagId: string;
}

export interface TagResponse {
  tag: Tag;
}

export interface TagListResponse {
  tags: Tag[];
  _links: HalLinks<["self"]>;
}

export interface SavedViewsClient {
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
