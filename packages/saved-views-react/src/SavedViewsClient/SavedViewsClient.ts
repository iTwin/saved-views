/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import type { SavedView, SavedViewGroup, SavedViewTag, WriteableSavedViewProperties } from "../SavedView.js";
import type { PartialExcept } from "../utils.js";

export interface SavedViewsClient {
  getAllSavedViews: (args: GetAllSavedViewsParams) => AsyncIterableIterator<SavedView[]>;
  getAllGroups: (args: GetAllGroupsParams) => Promise<SavedViewGroup[]>;
  getAllTags: (args: GetAllTagsParams) => Promise<SavedViewTag[]>;
  getThumbnailUrl: (args: GetThumbnailUrlParams) => Promise<string | undefined>;
  uploadThumbnail: (args: UploadThumbnailParams) => Promise<void>;
  getSavedView: (args: GetSavedViewParams) => Promise<SavedView>;
  createSavedView: (args: CreateSavedViewParams) => Promise<SavedView>;
  updateSavedView: (args: UpdateSavedViewParams) => Promise<SavedView>;
  deleteSavedView: (args: DeleteSavedViewParams) => Promise<void>;
  createGroup: (args: CreateGroupParams) => Promise<SavedViewGroup>;
  updateGroup: (args: UpdateGroupParams) => Promise<SavedViewGroup>;
  deleteGroup: (args: DeleteGroupParams) => Promise<void>;
  createTag: (args: CreateTagParams) => Promise<SavedViewTag>;
  updateTag: (args: UpdateTagParams) => Promise<SavedViewTag>;
  deleteTag: (args: DeleteTagParams) => Promise<void>;
}

export interface GetAllSavedViewsParams extends CommonParams {
  iTwinId: string;
  iModelId?: string | undefined;
}

export interface GetAllGroupsParams extends CommonParams {
  iTwinId: string;
  iModelId?: string | undefined;
}

export interface GetAllTagsParams extends CommonParams {
  iTwinId: string;
  iModelId?: string | undefined;
}

export interface GetThumbnailUrlParams extends CommonParams {
  savedViewId: string;
}

export interface UploadThumbnailParams extends CommonParams {
  savedViewId: string;
  /**
   * Image data encoded as base64 data URL.
   *
   * @example
   * "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII="
   */
  image: string;
}

export interface GetSavedViewParams extends CommonParams {
  savedViewId: string;
}

export interface CreateSavedViewParams extends CommonParams {
  iTwinId: string;
  iModelId?: string | undefined;
  savedView: PartialExcept<WriteableSavedViewProperties, "displayName" | "viewData">;
}

export interface UpdateSavedViewParams extends CommonParams {
  savedView: Partial<WriteableSavedViewProperties> & { id: string; };
}

export interface DeleteSavedViewParams extends CommonParams {
  savedViewId: string;
}

export interface CreateGroupParams extends CommonParams {
  iTwinId: string;
  iModelId?: string | undefined;
  group: Pick<SavedViewGroup, "displayName" | "shared">;
}

export interface UpdateGroupParams extends CommonParams {
  group: Pick<SavedViewGroup, "id"> & Partial<SavedViewGroup>;
}

export interface DeleteGroupParams extends CommonParams {
  groupId: string;
}

export interface CreateTagParams extends CommonParams {
  iTwinId: string;
  iModelId?: string;
  displayName: string;
}

export interface UpdateTagParams extends CommonParams {
  tag: Pick<SavedViewTag, "id"> & Partial<SavedViewTag>;
}

export interface DeleteTagParams extends CommonParams {
  tagId: string;
}

interface CommonParams {
  signal?: AbortSignal | undefined;
}
