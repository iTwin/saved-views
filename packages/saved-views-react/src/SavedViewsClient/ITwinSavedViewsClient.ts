/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import {
  ITwinSavedViewsClient as Client, type Group, type SavedViewRepresentation, type Tag,
} from "@itwin/saved-views-client";

import type { SavedView, SavedViewGroup, SavedViewTag } from "../SavedView.js";
import type {
  CreateGroupParams, CreateSavedViewParams, CreateTagParams, DeleteGroupParams, DeleteSavedViewParams, DeleteTagParams,
  GetAllGroupsParams, GetAllSavedViewsParams, GetAllTagsParams, GetSavedViewParams, GetThumbnailUrlParams,
  SavedViewsClient, UpdateGroupParams, UpdateSavedViewParams, UpdateTagParams, UploadThumbnailParams,
} from "./SavedViewsClient.js";

interface ITwinSavedViewsClientParams {
  /**
   * Authorization token that grants access to iTwin Saved Views API. The token should be valid for `savedviews:read`
   * and `savedviews:modify` OIDC scopes.
  */
 getAccessToken: () => Promise<string>;

 /** @default "https://api.bentley.com/savedviews"  */
 baseUrl?: string | undefined;
}

export class ITwinSavedViewsClient implements SavedViewsClient {
  #client: Client;

  constructor(args: ITwinSavedViewsClientParams) {
    this.#client = new Client(args);
  }

  async *getAllSavedViews(args: GetAllSavedViewsParams): AsyncIterableIterator<SavedView[]> {
    const iterable = this.#client.getAllSavedViewsRepresentation({
      iTwinId: args.iTwinId,
      iModelId: args.iModelId,
      signal: args.signal,
    });
    for await (const page of iterable) {
      yield page.savedViews.map(savedViewResponseToSavedView);
    }
  }

  async getAllGroups(args: GetAllGroupsParams): Promise<SavedViewGroup[]> {
    const response = await this.#client.getAllGroups({
      iTwinId: args.iTwinId,
      iModelId: args.iModelId,
      signal: args.signal,
    });
    return response.groups.map(groupResponseToSavedViewGroup);
  }

  async getAllTags(args: GetAllTagsParams): Promise<SavedViewTag[]> {
    const response = await this.#client.getAllTags({
      iTwinId: args.iTwinId,
      iModelId: args.iModelId,
      signal: args.signal,
    });
    return response.tags.map(tagResponseToSavedViewTag);
  }

  async getThumbnailUrl(args: GetThumbnailUrlParams): Promise<string | undefined> {
    const response = await this.#client.getImage({
      savedViewId: args.savedViewId,
      size: "thumbnail",
      signal: args.signal,
    });
    return response.href;
  }

  async uploadThumbnail(args: UploadThumbnailParams): Promise<void> {
    await this.#client.updateImage({
      savedViewId: args.savedViewId,
      image: args.image,
      signal: args.signal,
    });
  }

  async getSavedView(args: GetSavedViewParams): Promise<SavedView> {
    const response = await this.#client.getSavedViewRepresentation({
      savedViewId: args.savedViewId,
      signal: args.signal,
    });
    return savedViewResponseToSavedView(response.savedView);
  }
  async createSavedView(args: CreateSavedViewParams): Promise<SavedView> {
    const { savedView } = await this.#client.createSavedView({
      iTwinId: args.iTwinId,
      iModelId: args.iModelId,
      displayName: args.savedView.displayName,
      tagIds: args.savedView.tagIds,
      groupId: args.savedView.groupId,
      shared: args.savedView.shared,
      savedViewData: args.savedView.viewData,
      extensions: args.savedView.extensions,
      signal: args.signal,
    });
    return savedViewResponseToSavedView(savedView);
  }

  async updateSavedView(args: UpdateSavedViewParams): Promise<SavedView> {
    const { savedView } = await this.#client.updateSavedView({
      savedViewId: args.savedView.id,
      displayName: args.savedView.displayName,
      tagIds: args.savedView.tagIds,
      groupId: args.savedView.groupId,
      shared: args.savedView.shared,
      savedViewData: args.savedView.viewData,
      signal: args.signal,
    });

    await Promise.all((args.savedView.extensions ?? []).map(
      ({ extensionName, data }) => this.#client.createExtension({
        savedViewId: args.savedView.id,
        extensionName,
        data,
      }),
    ));

    return savedViewResponseToSavedView(savedView);
  }

  async deleteSavedView(args: DeleteSavedViewParams): Promise<void> {
    await this.#client.deleteSavedView({ savedViewId: args.savedViewId, signal: args.signal });
  }

  async createGroup(args: CreateGroupParams): Promise<SavedViewGroup> {
    const { group } = await this.#client.createGroup({
      iTwinId: args.iTwinId,
      iModelId: args.iModelId,
      displayName: args.group.displayName,
      signal: args.signal,
    });
    return groupResponseToSavedViewGroup(group);
  }

  async updateGroup(args: UpdateGroupParams): Promise<SavedViewGroup> {
    const { group } = await this.#client.updateGroup({
      groupId: args.group.id,
      displayName: args.group.displayName,
      shared: args.group.shared,
      signal: args.signal,
    });
    return groupResponseToSavedViewGroup(group);
  }

  async deleteGroup(args: DeleteGroupParams): Promise<void> {
    const savedViewPages = this.#client.getAllSavedViewsMinimal({ groupId: args.groupId, signal: args.signal });
    for await (const savedViews of savedViewPages) {
      await Promise.all(
        savedViews.savedViews.map(({ id }) => this.#client.deleteSavedView({ savedViewId: id, signal: args.signal })),
      );
    }

    await this.#client.deleteGroup({ groupId: args.groupId, signal: args.signal });
  }

  async createTag(args: CreateTagParams): Promise<SavedViewTag> {
    const { tag } = await this.#client.createTag({
      iTwinId: args.iTwinId,
      iModelId: args.iModelId,
      displayName: args.displayName,
      signal: args.signal,
    });
    return tagResponseToSavedViewTag(tag);
  }

  async updateTag(args: UpdateTagParams): Promise<SavedViewTag> {
    const { tag } = await this.#client.updateTag({
      tagId: args.tag.id,
      displayName: args.tag.displayName,
      signal: args.signal,
    });
    return tagResponseToSavedViewTag(tag);
  }

  async deleteTag(args: DeleteTagParams): Promise<void> {
    await this.#client.deleteTag({ tagId: args.tagId, signal: args.signal });
  }
}

function savedViewResponseToSavedView(response: SavedViewRepresentation): SavedView {
  return {
    id: response.id,
    displayName: response.displayName,
    viewData: response.savedViewData,
    tagIds: response.tags?.map((tag) => tag.id),
    groupId: response._links.group?.href.split("/").at(-1),
    creatorId: response._links.creator?.href.split("/").at(-1),
    shared: response.shared,
    thumbnail: undefined,
    extensions: response.extensions,
    creationTime: response.creationTime,
    lastModified: response.lastModified,
  };
}

function groupResponseToSavedViewGroup(response: Group): SavedViewGroup {
  return {
    id: response.id,
    displayName: response.displayName,
    creatorId: response._links.creator?.href.split("/").at(-1),
    shared: response.shared,
  };
}

function tagResponseToSavedViewTag(response: Tag): SavedViewTag {
  return {
    id: response.id,
    displayName: response.displayName,
  };
}
