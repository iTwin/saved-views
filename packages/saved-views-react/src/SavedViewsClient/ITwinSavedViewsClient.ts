/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import {
  ITwinSavedViewsClient as Client, isViewDataITwin3d, isViewDataITwinDrawing, type Group, type SavedViewMinimal,
  type SavedViewRepresentation, type Tag, type ViewData,
} from "@itwin/saved-views-client";

import type { SavedView, SavedViewData, SavedViewGroup, SavedViewTag } from "../SavedView.js";
import type {
  CreateGroupArgs, CreateSavedViewArgs, CreateTagArgs, DeleteGroupArgs, DeleteSavedViewArgs, DeleteTagArgs,
  GetGroupsArgs, GetSavedViewByIdArgs, GetSavedViewDataByIdArgs, GetSavedViewsArgs, GetTagsArgs, GetThumbnailUrlArgs,
  SavedViewsClient, UpdateGroupArgs, UpdateSavedViewArgs, UpdateTagArgs, UploadThumbnailArgs,
} from "./SavedViewsClient.js";

interface ITwinSavedViewsClientParams {
  /** Authorization token that grants access to iTwin Platform API. */
  getAccessToken: () => Promise<string>;

  /** @default "https://api.bentley.com/savedviews" */
  baseUrl?: string | undefined;
}

export class ITwinSavedViewsClient implements SavedViewsClient {
  #client: Client;

  constructor(args: ITwinSavedViewsClientParams) {
    this.#client = new Client(args);
  }

  async *getSavedViews(args: GetSavedViewsArgs): AsyncIterableIterator<SavedView[]> {
    const iterable = this.#client.getAllSavedViewsMinimal({
      iTwinId: args.iTwinId,
      iModelId: args.iModelId,
      groupId: args.groupId,
      signal: args.signal,
    });
    for await (const page of iterable) {
      yield page.savedViews.map(savedViewResponseToSavedView);
    }
  }

  async getGroups(args: GetGroupsArgs): Promise<SavedViewGroup[]> {
    const response = await this.#client.getAllGroups({
      iTwinId: args.iTwinId,
      iModelId: args.iModelId,
      signal: args.signal,
    });
    return response.groups.map(groupResponseToSavedViewGroup);
  }

  async getTags(args: GetTagsArgs): Promise<SavedViewTag[]> {
    const response = await this.#client.getAllTags({
      iTwinId: args.iTwinId,
      iModelId: args.iModelId,
      signal: args.signal,
    });
    return response.tags.map(tagResponseToSavedViewTag);
  }

  async getThumbnailUrl(args: GetThumbnailUrlArgs): Promise<string | undefined> {
    const response = await this.#client.getImage({
      savedViewId: args.savedViewId,
      size: "thumbnail",
      signal: args.signal,
    });
    return response.href;
  }

  async uploadThumbnail(args: UploadThumbnailArgs): Promise<void> {
    await this.#client.updateImage({
      savedViewId: args.savedViewId,
      image: args.image,
      signal: args.signal,
    });
  }

  async getSavedViewById(args: GetSavedViewByIdArgs): Promise<SavedView> {
    const response = await this.#client.getSavedViewMinimal({
      savedViewId: args.savedViewId,
      signal: args.signal,
    });
    return savedViewResponseToSavedView(response.savedView);
  }

  async getSavedViewDataById(args: GetSavedViewDataByIdArgs): Promise<SavedViewData> {
    const response = await this.#client.getSavedViewRepresentation({
      savedViewId: args.savedViewId, signal: args.signal,
    });

    return {
      viewData: getViewData(response.savedView),
      extensions: response.savedView.extensions,
    };
  }

  async createSavedView(args: CreateSavedViewArgs): Promise<SavedView> {
    const savedViewData = toApiSavedViewData(args.savedViewData.viewData);
    const { savedView } = await this.#client.createSavedView({
      iTwinId: args.iTwinId,
      iModelId: args.iModelId,
      displayName: args.displayName,
      groupId: args.groupId,
      tagIds: args.tagIds,
      shared: args.shared,
      savedViewData,
      extensions: args.savedViewData.extensions,
      signal: args.signal,
    });
    return savedViewResponseToSavedView(savedView);
  }

  async updateSavedView(args: UpdateSavedViewArgs): Promise<SavedView> {
    const savedViewData = args.savedViewData && toApiSavedViewData(args.savedViewData.viewData);
    const { savedView } = await this.#client.updateSavedView({
      savedViewId: args.savedViewId,
      displayName: args.displayName,
      tagIds: args.tagIds,
      groupId: args.groupId,
      shared: args.shared,
      savedViewData,
      signal: args.signal,
    });

    await Promise.all((args.savedViewData?.extensions ?? []).map(({ extensionName, data }) => {
      this.#client.createExtension({
        savedViewId: args.savedViewId,
        extensionName,
        data,
      });
    }));

    return savedViewResponseToSavedView(savedView);
  }

  async deleteSavedView(args: DeleteSavedViewArgs): Promise<void> {
    await this.#client.deleteSavedView({ savedViewId: args.savedViewId, signal: args.signal });
  }

  async createGroup(args: CreateGroupArgs): Promise<SavedViewGroup> {
    const { group } = await this.#client.createGroup({
      iTwinId: args.iTwinId,
      iModelId: args.iModelId,
      displayName: args.displayName,
      signal: args.signal,
    });
    return groupResponseToSavedViewGroup(group);
  }

  async updateGroup(args: UpdateGroupArgs): Promise<SavedViewGroup> {
    const { group } = await this.#client.updateGroup({
      groupId: args.groupId,
      displayName: args.displayName,
      shared: args.shared,
      signal: args.signal,
    });
    return groupResponseToSavedViewGroup(group);
  }

  async deleteGroup(args: DeleteGroupArgs): Promise<void> {
    await this.#client.deleteGroup({ groupId: args.groupId, signal: args.signal });
  }

  async createTag(args: CreateTagArgs): Promise<SavedViewTag> {
    const { tag } = await this.#client.createTag({
      iTwinId: args.iTwinId,
      iModelId: args.iModelId,
      displayName: args.displayName,
      signal: args.signal,
    });
    return tagResponseToSavedViewTag(tag);
  }

  async updateTag(args: UpdateTagArgs): Promise<SavedViewTag> {
    const { tag } = await this.#client.updateTag({
      tagId: args.tagId,
      displayName: args.displayName,
      signal: args.signal,
    });
    return tagResponseToSavedViewTag(tag);
  }

  async deleteTag(args: DeleteTagArgs): Promise<void> {
    await this.#client.deleteTag({ tagId: args.tagId, signal: args.signal });
  }
}

function savedViewResponseToSavedView(response: Omit<SavedViewMinimal, "savedViewData" | "extensions">): SavedView {
  return {
    savedViewId: response.id,
    displayName: response.displayName,
    tagIds: response.tags?.map((tag) => tag.id),
    groupId: response._links.group?.href.split("/").at(-1),
    creatorId: response._links.creator?.href.split("/").at(-1),
    shared: response.shared,
    creationTime: new Date(response.creationTime),
    lastModified: new Date(response.lastModified),
  };
}

function groupResponseToSavedViewGroup(response: Group): SavedViewGroup {
  return {
    groupId: response.id,
    displayName: response.displayName,
    creatorId: response._links.creator?.href.split("/").at(-1),
    shared: response.shared,
  };
}

function tagResponseToSavedViewTag(response: Tag): SavedViewTag {
  return {
    tagId: response.id,
    displayName: response.displayName,
  };
}

function getViewData(savedView: SavedViewRepresentation): SavedViewData["viewData"] {
  if (isViewDataITwin3d(savedView.savedViewData)) {
    return {
      type: "iTwin3d",
      ...savedView.savedViewData.itwin3dView,
    };
  }

  if (isViewDataITwinDrawing(savedView.savedViewData)) {
    return {
      type: "iTwinDrawing",
      ...savedView.savedViewData.itwinDrawingView,
    };
  }

  return {
    type: "iTwinSheet",
    ...savedView.savedViewData.itwinSheetView,
  };
}

function toApiSavedViewData(viewData: SavedViewData["viewData"]): ViewData {
  if (viewData.type === "iTwin3d") {
    const { type, ...rest } = viewData;
    return { itwin3dView: rest };
  }

  if (viewData.type === "iTwinDrawing") {
    const { type, ...rest } = viewData;

    return { itwinDrawingView: rest };
  }

  const { type, ...rest } = viewData;
  return { itwinSheetView: rest };
}
