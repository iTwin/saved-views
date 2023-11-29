/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Extension, ExtensionListItem, ExtensionMin, ExtensionSavedViewCreate } from "../models/Extension.js";
import { Group } from "../models/Group.js";
import { HalLinks } from "../models/Links.js";
import { Tag } from "../models/Tag.js";
import { SavedViewWithDataMinimal, SavedViewWithDataRepresentation, View } from "../models/savedViews/View.js";

export interface SavedViewsClient {
  getSavedViewMinimal(args: SingleSavedViewParams): Promise<SavedViewMinimalResponse>;
  getSavedViewRepresentation(args: SingleSavedViewParams): Promise<SavedViewRepresentationResponse>;
  getAllSavedViewsMinimal(args: GetSavedViewsParams): Promise<SavedViewListMinimalResponse>;
  getAllSavedViewsRepresentation(args: GetSavedViewsParams): Promise<SavedViewListRepresentationResponse>;
  createSavedView(args: CreateSavedViewParams): Promise<SavedViewMinimalResponse>;
  updateSavedView(args: UpdateSavedViewParams): Promise<SavedViewMinimalResponse>;
  deleteSavedView(args: SingleSavedViewParams): Promise<void>;

  getImage(args: GetImageParams): Promise<ImageResponse>;
  updateImage(args: UpdateImageParams): Promise<void>;

  getGroup(args: SingleGroupParams): Promise<GroupResponse>;
  getAllGroups(args: GetGroupsParams): Promise<GroupListResponse>;
  createGroup(args: CreateGroupParams): Promise<GroupResponse>;
  updateGroup(args: UpdateGroupParams): Promise<GroupResponse>;
  deleteGroup(args: SingleGroupParams): Promise<void>;

  getExtension(args: SingleExtensionParams): Promise<ExtensionResponse>;
  getAllExtensions(args: GetExtensionsParams): Promise<ExtensionListResponse>;
  createExtension(args: CreateExtensionParams): Promise<ExtensionResponse>;
  deleteExtension(args: SingleExtensionParams): Promise<void>;

  getTag(args: SingleTagParams): Promise<TagResponse>;
  getAllTags(args: GetTagsParams): Promise<TagListResponse>;
  createTag(args: CreateTagParams): Promise<TagResponse>;
  deleteTag(args: SingleTagParams): Promise<void>;
  updateTag(args: UpdateTagParams): Promise<TagResponse>;
}

export interface SingleSavedViewParams extends CommonRequestParams {
  savedViewId: string;
}

export interface GetSavedViewsParams extends CommonRequestParams {
  iTwinId?: string;
  iModelId?: string;
  groupId?: string;
  top?: string;
  skip?: string;
}

export interface CreateSavedViewParams extends CommonRequestParams {
  iTwinId: string;
  iModelId?: string;
  savedViewData: View;
  groupId?: string;
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
}

export interface SavedViewMinimalResponse {
  savedView: SavedViewWithDataMinimal;
}

export interface SavedViewRepresentationResponse {
  savedView: SavedViewWithDataRepresentation;
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

export interface ImageResponse {
  href: string;
}

/** Image Size enum for request. */
export type ImageSize = "full" | "thumbnail";

export interface SingleGroupParams extends CommonRequestParams {
  groupId: string;
}

export interface GetGroupsParams extends CommonRequestParams {
  iTwinId: string;
  iModelId?: string;
}

export interface CreateGroupParams extends CommonRequestParams {
  iTwinId: string;
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

export interface SingleExtensionParams extends CommonRequestParams {
  savedViewId: string;
  extensionName: string;
}

export interface GetExtensionsParams extends CommonRequestParams {
  savedViewId: string;
}

export interface CreateExtensionParams extends CommonRequestParams {
  savedViewId: string;
  extensionName: string;
  data: string;
}
export interface ExtensionResponse {
  extension: Extension;
}

export interface ExtensionListResponse {
  extensions: ExtensionListItem[];
}

export interface SingleTagParams extends CommonRequestParams {
  tagId: string;
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

export interface TagResponse {
  tag: Tag;
}

export interface TagListResponse {
  tags: Tag[];
  _links: HalLinks<["self"]>;
}

export interface CommonRequestParams {
  signal?: AbortSignal;
}
