/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import type { ExtensionMin, ExtensionSavedViewCreate, SavedViewWithDataRepresentation, ViewData } from "@itwin/saved-views-client";

import type { SavedView, SavedViewGroup, SavedViewTag } from "../SavedViewsWidget/SavedView.js";

export interface SavedViewInfo {
  savedViews: SavedView[];
  groups: SavedViewGroup[];
  tags: SavedViewTag[];
}

export interface SavedViewsClient {
  getSavedViewInfo: (args: GetSavedViewInfoParams) => Promise<SavedViewInfo>;
  getSingularSavedView: (args: GetSingularSavedViewParams) => Promise<SavedViewWithDataRepresentation>;
  getThumbnailUrl: (args: GetThumbnailUrlParams) => Promise<string | undefined>;
  createSavedView: (args: CreateSavedViewParams) => Promise<void>;
  updateSavedView: (args: UpdateSavedViewParams) => Promise<void>;
  deleteSavedView: (args: DeleteSavedViewParams) => Promise<void>;
  createGroup: (args: CreateGroupParams) => Promise<SavedViewGroup>;
  updateGroup: (args: UpdateGroupParams) => Promise<void>;
  deleteGroup: (args: DeleteGroupParams) => Promise<void>;
  createTag: (args: CreateTagParams) => Promise<SavedViewTag>;
  updateTag: (args: UpdateTagParams) => Promise<void>;
  deleteTag: (args: DeleteTagParams) => Promise<void>;
}

export interface GetSavedViewInfoParams extends CommonParams {
  iTwinId: string;
  iModelId?: string | undefined;
}

export interface GetSingularSavedViewParams extends CommonParams {
  savedViewId: string;
}

export interface GetThumbnailUrlParams extends CommonParams {
  savedViewId: string;
}

export interface CreateSavedViewParams extends CommonParams {
  iTwinId: string;
  iModelId?: string | undefined;
  savedView: Pick<SavedView, "displayName" | "tagIds" | "groupId" | "shared">;
  savedViewData: ViewData;
  extensions?: ExtensionSavedViewCreate[] | undefined;
}

export interface UpdateSavedViewParams extends CommonParams {
  savedView: Pick<SavedView, "id"> & Partial<SavedView>;
  savedViewData?: ViewData | undefined;
  extensions?: ExtensionMin[] | undefined;
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
