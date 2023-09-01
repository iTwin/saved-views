/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Extension, ExtensionListItem, ExtensionMin, ExtensionSavedViewCreate } from "../models/Extension.js";
import { Group } from "../models/Group.js";
import { HalLinks } from "../models/Links.js";
import { Tag } from "../models/Tag.js";
import { SavedViewWithDataMinimal, SavedViewWithDataRepresentation, View } from "../models/savedViews/View.js";

export interface CommonRequestParams {
  signal?: AbortSignal;
  headers?: Record<string, string>;
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
  savedViewId: string;
}

export interface GetSavedViewsParams extends CommonRequestParams {
  iTwinId: string;
  iModelId?: string;
  groupId?: string;
  top?: string;
  skip?: string;
}

export interface CreateSavedViewParams extends CommonRequestParams {
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
}

export interface UpdateSavedViewParams extends CommonRequestParams {
  savedViewId: string;
  savedViewData?: View;
  groupId?: string;
  displayName?: string;
  shared?: boolean;
  tagIds?: string[];
  extensions?: ExtensionMin[];
  category?: string;
}

export interface SavedViewRepresentationResponse {
  savedView: SavedViewWithDataRepresentation;
}

export interface SavedViewMinimalResponse {
  savedView: SavedViewWithDataMinimal;
}

export interface SavedViewListMinimalResponse {
  savedViews: SavedViewWithDataMinimal[];
  _links: HalLinks<["self", "prev"?, "next"?]>;
}

export interface SavedViewListRepresentationResponse {
  savedViews: SavedViewWithDataRepresentation[];
  _links: HalLinks<["self", "prev"?, "next"?]>;
}

export interface GetImageParams extends CommonRequestParams {
  size: ImageSize;
  savedViewId: string;
}

export interface UpdateImageParams extends CommonRequestParams {
  image: string;
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
  iTwinId?: string;
  iModelId?: string;
  displayName: string;
  shared?: boolean;
}

export interface UpdateGroupParams extends CommonRequestParams {
  groupId: string;
  displayName?: string;
  shared?: boolean;
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
  extensionName: string;
  data: string;
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
  displayName?: string;
}

export interface CreateTagParams extends CommonRequestParams {
  iTwinId?: string;
  iModelId?: string;
  displayName: string;
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
  getSavedViewMinimal(args: SingleSavedViewParams): Promise<SavedViewMinimalResponse>;
  getSavedViewRepresentation(args: SingleSavedViewParams): Promise<SavedViewRepresentationResponse>;
  getAllSavedViewsRepresentation(args: GetSavedViewsParams): Promise<SavedViewListRepresentationResponse>;
  getAllSavedViewsMinimal(args: GetSavedViewsParams): Promise<SavedViewListMinimalResponse>;
  createSavedView(args: CreateSavedViewParams): Promise<SavedViewMinimalResponse>;
  updateSavedView(args: UpdateSavedViewParams): Promise<SavedViewMinimalResponse>;
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
