/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import {
  ITwinSavedViewsClient as Client, type Group, type SavedViewWithDataMinimal, type SavedViewWithDataRepresentation,
  type Tag,
} from "@itwin/saved-views-client";

import type { SavedView, SavedViewGroup, SavedViewTag } from "../SavedViewsWidget/SavedView.js";
import type {
  CreateGroupParams, CreateSavedViewParams, CreateTagParams, DeleteGroupParams, DeleteSavedViewParams, DeleteTagParams,
  GetSavedViewInfoParams, GetSingularSavedViewParams, GetThumbnailUrlParams, SavedViewInfo, SavedViewsClient,
  UpdateGroupParams, UpdateSavedViewParams, UpdateTagParams,
} from "./SavedViewsClient.js";

interface ITwinSavedViewsClientParams {
  getAccessToken: () => Promise<string>;
  baseUrl?: string | undefined;
}

export class ITwinSavedViewsClient implements SavedViewsClient {
  private client: Client;

  constructor(args: ITwinSavedViewsClientParams) {
    this.client = new Client(args);
  }

  public async getSavedViewInfo(args: GetSavedViewInfoParams): Promise<SavedViewInfo> {
    const [{ savedViews }, { groups }, { tags }] = await Promise.all([
      this.client.getAllSavedViewsMinimal(args),
      this.client.getAllGroups(args),
      this.client.getAllTags(args),
    ]);

    return {
      savedViews: savedViews.map(savedViewResponseToSavedView),
      groups,
      tags,
    };
  }

  public async getSingularSavedView(args: GetSingularSavedViewParams): Promise<SavedViewWithDataRepresentation> {
    const response = await this.client.getSavedViewRepresentation({
      savedViewId: args.savedViewId,
      signal: args.signal,
    });
    return response.savedView;
  }

  public async getThumbnailUrl(args: GetThumbnailUrlParams): Promise<string | undefined> {
    const response = await this.client.getImage({
      savedViewId: args.savedViewId,
      size: "thumbnail",
      signal: args.signal,
    });
    return response.href;
  }

  public async createSavedView(args: CreateSavedViewParams): Promise<SavedView> {
    const { savedView } = await this.client.createSavedView({
      iTwinId: args.iTwinId,
      iModelId: args.iModelId,
      displayName: args.savedView.displayName,
      tagIds: args.savedView.tagIds,
      groupId: args.savedView.groupId,
      shared: args.savedView.shared,
      savedViewData: args.savedViewData,
      signal: args.signal,
    });
    return savedViewResponseToSavedView(savedView);
  }

  public async updateSavedView(args: UpdateSavedViewParams): Promise<SavedView> {
    const { savedView } = await this.client.updateSavedView({
      savedViewId: args.savedView.id,
      displayName: args.savedView.displayName,
      tagIds: args.savedView.tagIds,
      groupId: args.savedView.groupId,
      shared: args.savedView.shared,
      savedViewData: args.savedViewData,
      extensions: args.extensions,
      signal: args.signal,
    });
    return savedViewResponseToSavedView(savedView);
  }

  public async deleteSavedView(args: DeleteSavedViewParams): Promise<void> {
    await this.client.deleteSavedView({ savedViewId: args.savedViewId, signal: args.signal });
  }

  public async createGroup(args: CreateGroupParams): Promise<SavedViewGroup> {
    const { group } = await this.client.createGroup({
      iTwinId: args.iTwinId,
      iModelId: args.iModelId,
      displayName: args.group.displayName,
      signal: args.signal,
    });
    return groupResponseToSavedViewGroup(group);
  }

  public async updateGroup(args: UpdateGroupParams): Promise<SavedViewGroup> {
    const { group } = await this.client.updateGroup({
      groupId: args.group.id,
      displayName: args.group.displayName,
      shared: args.group.shared,
      signal: args.signal,
    });
    return groupResponseToSavedViewGroup(group);
  }

  public async deleteGroup(args: DeleteGroupParams): Promise<void> {
    await this.client.deleteGroup({ groupId: args.groupId, signal: args.signal });
  }

  public async createTag(args: CreateTagParams): Promise<SavedViewTag> {
    const { tag } = await this.client.createTag({
      iTwinId: args.iTwinId,
      iModelId: args.iModelId,
      displayName: args.displayName,
      signal: args.signal,
    });
    return tagResponseToSavedViewTag(tag);
  }

  public async updateTag(args: UpdateTagParams): Promise<SavedViewTag> {
    const { tag } = await this.client.updateTag({
      tagId: args.tag.id,
      displayName: args.tag.displayName,
      signal: args.signal,
    });
    return tagResponseToSavedViewTag(tag);
  }

  public async deleteTag(args: DeleteTagParams): Promise<void> {
    await this.client.deleteTag({ tagId: args.tagId, signal: args.signal });
  }
}

function savedViewResponseToSavedView(response: SavedViewWithDataMinimal): SavedView {
  return {
    id: response.id,
    displayName: response.displayName,
    tagIds: response.tags?.map((tag) => tag.id),
    groupId: response._links.group?.href.split("/").at(-1),
    shared: response.shared,
    thumbnail: undefined,
  };
}

function groupResponseToSavedViewGroup(response: Group): SavedViewGroup {
  return {
    id: response.id,
    displayName: response.displayName,
    shared: response.shared,
  };
}

function tagResponseToSavedViewTag(response: Tag): SavedViewTag {
  return {
    id: response.id,
    displayName: response.displayName,
  };
}
