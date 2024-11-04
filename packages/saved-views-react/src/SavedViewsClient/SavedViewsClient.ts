/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import type { SavedViewData, SavedViewGroup, SavedView, SavedViewTag } from "../SavedView.js";

export interface SavedViewsClient {
  getSavedViews: (args: GetSavedViewsArgs) => AsyncIterableIterator<SavedView[]>;
  getGroups: (args: GetGroupsArgs) => Promise<SavedViewGroup[]>;
  getTags: (args: GetTagsArgs) => Promise<SavedViewTag[]>;
  getThumbnailUrl: (args: GetThumbnailUrlArgs) => Promise<string | undefined>;
  uploadThumbnail: (args: UploadThumbnailArgs) => Promise<void>;
  getSavedViewById: (args: GetSavedViewByIdArgs) => Promise<SavedView>;
  getSavedViewDataById: (args: GetSavedViewDataByIdArgs) => Promise<SavedViewData>;
  createSavedView: (args: CreateSavedViewArgs) => Promise<SavedView>;
  updateSavedView: (args: UpdateSavedViewArgs) => Promise<SavedView>;
  deleteSavedView: (args: DeleteSavedViewArgs) => Promise<void>;
  createGroup: (args: CreateGroupArgs) => Promise<SavedViewGroup>;
  updateGroup: (args: UpdateGroupArgs) => Promise<SavedViewGroup>;
  deleteGroup: (args: DeleteGroupArgs) => Promise<void>;
  createTag: (args: CreateTagArgs) => Promise<SavedViewTag>;
  updateTag: (args: UpdateTagArgs) => Promise<SavedViewTag>;
  deleteTag: (args: DeleteTagArgs) => Promise<void>;
}

export interface GetSavedViewsArgs extends CommonParams {
  iTwinId: string;
  iModelId?: string | undefined;
  groupId?: string | undefined;
}

export interface GetGroupsArgs extends CommonParams {
  iTwinId: string;
  iModelId?: string | undefined;
}

export interface GetTagsArgs extends CommonParams {
  iTwinId: string;
  iModelId?: string | undefined;
}

export interface GetThumbnailUrlArgs extends CommonParams {
  savedViewId: string;
}

export interface UploadThumbnailArgs extends CommonParams {
  savedViewId: string;
  /**
   * Image data encoded as base64 data URL.
   *
   * @example
   * "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII="
   */
  image: string;
}

export interface GetSavedViewByIdArgs extends CommonParams {
  savedViewId: string;
}

export interface GetSavedViewDataByIdArgs extends CommonParams {
  savedViewId: string;
}

export interface CreateSavedViewArgs extends CommonParams {
  iTwinId: string;
  iModelId?: string | undefined;
  displayName: string;
  groupId?: string | undefined;
  tagIds?: string[] | undefined;
  shared?: boolean | undefined;
  savedViewData: SavedViewData;
}

export interface UpdateSavedViewArgs extends CommonParams {
  savedViewId: string;
  displayName?: string | undefined;
  groupId?: string | undefined;
  tagIds?: string[] | undefined;
  shared?: boolean | undefined;
  savedViewData?: SavedViewData | undefined;
}

export interface DeleteSavedViewArgs extends CommonParams {
  savedViewId: string;
}

export interface CreateGroupArgs extends CommonParams {
  iTwinId: string;
  iModelId?: string | undefined;
  displayName: string;
  shared?: boolean | undefined;
}

export interface UpdateGroupArgs extends CommonParams {
  groupId: string;
  displayName?: string | undefined;
  shared?: boolean | undefined;
}

export interface DeleteGroupArgs extends CommonParams {
  groupId: string;
}

export interface CreateTagArgs extends CommonParams {
  iTwinId: string;
  iModelId?: string;
  displayName: string;
}

export interface UpdateTagArgs extends CommonParams {
  tagId: string;
  displayName?: string | undefined;
}

export interface DeleteTagArgs extends CommonParams {
  tagId: string;
}

interface CommonParams {
  signal?: AbortSignal | undefined;
}
