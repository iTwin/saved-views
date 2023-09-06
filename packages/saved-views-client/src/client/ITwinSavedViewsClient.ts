/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { callITwinApi } from "./ApiUtils.js";
import {
  CreateExtensionParams, CreateGroupParams, CreateSavedViewParams, CreateTagParams, ExtensionListResponse,
  ExtensionResponse, GetExtensionsParams, GetGroupsParams, GetImageParams, GetSavedViewsParams, GetTagsParams,
  GroupListResponse, GroupResponse, ImageResponse, SavedViewListMinimalResponse, SavedViewListRepresentationResponse,
  SavedViewMinimalResponse, SavedViewRepresentationResponse, SavedViewsClient, SingleExtensionParams, SingleGroupParams,
  SingleSavedViewParams, SingleTagParams, TagListResponse, TagResponse, UpdateGroupParams, UpdateImageParams,
  UpdateSavedViewParams, UpdateTagParams,
} from "./SavedViewClient.js";

/** {@linkcode SavedViewsClient} implementation that calls iTwin APIs. */
export class ITwinSavedViewsClient implements SavedViewsClient {
  private readonly baseUrl;
  private readonly getAccessToken: () => Promise<string>;

  constructor(args: ITwinSavedViewsClientParams) {
    this.baseUrl = args.baseUrl ?? "https://api.bentley.com/savedviews";
    this.getAccessToken = args.getAccessToken;
  }

  private async queryITwinApi<ReturnType>(queyParams: QueryParams): Promise<ReturnType> {
    return callITwinApi({
      url: queyParams.url,
      method: queyParams.method,
      getAccessToken: this.getAccessToken,
      signal: queyParams.signal,
      headers: {
        Accept: "application/vnd.bentley.itwin-platform.v1+json",
        ...queyParams.headers,
      },
      body: queyParams.body,
    }) as ReturnType;
  }

  async getSavedViewRepresentation(args: SingleSavedViewParams): Promise<SavedViewRepresentationResponse> {
    return this.queryITwinApi({
      signal: args.signal,
      headers: {
        prefer: PreferOptions.Representation,
      },
      url: `${this.baseUrl}/${args.savedViewId}`,
      method: "GET",
    });
  }

  async getSavedViewMinimal(args: SingleSavedViewParams): Promise<SavedViewMinimalResponse> {
    return this.queryITwinApi({
      signal: args.signal,
      headers: {
        prefer: PreferOptions.Minimal,
      },
      url: `${this.baseUrl}/${args.savedViewId}`,
      method: "GET",
    });
  }

  async getAllSavedViewsRepresentation(args: GetSavedViewsParams ): Promise<SavedViewListRepresentationResponse> {
    const iModelId = args.iModelId ? `&iModelId=${args.iModelId}` : "";
    const groupId = args.groupId ? `&groupId=${args.groupId}` : "";
    const top = args.top ? `&$top=${args.top}` : "";
    const skip = args.skip ? `&$skip=${args.skip}` : "";
    const url = `${this.baseUrl}/?iTwinId=${args.iTwinId}${iModelId}${groupId}${top}${skip}`;
    return this.queryITwinApi({
      signal: args.signal,
      headers: {
        prefer: PreferOptions.Representation,
      },
      url: url,
      method: "GET",
    });
  }

  async getAllSavedViewsMinimal(args: GetSavedViewsParams): Promise<SavedViewListMinimalResponse> {
    const iModelId = args.iModelId ? `&iModelId=${args.iModelId}` : "";
    const groupId = args.groupId ? `&groupId=${args.groupId}` : "";
    const top = args.top ? `&$top=${args.top}` : "";
    const skip = args.skip ? `&$skip=${args.skip}` : "";
    const url = `${this.baseUrl}/?ITwinId=${args.iTwinId}${iModelId}${groupId}${top}${skip}`;
    return this.queryITwinApi({
      signal: args.signal,
      headers: {
        prefer: PreferOptions.Minimal,
      },
      url: url,
      method: "GET",
    });
  }

  async createSavedView(args: CreateSavedViewParams): Promise<SavedViewMinimalResponse> {
    const { signal, ...body } = args;
    return this.queryITwinApi({
      signal: signal,
      url: `${this.baseUrl}/`,
      method: "POST",
      body: body,
    });
  }

  async updateSavedView(args: UpdateSavedViewParams): Promise<SavedViewMinimalResponse> {
    const { savedViewId, signal, ...body } = args;
    return this.queryITwinApi({
      signal,
      url: `${this.baseUrl}/${savedViewId}`,
      method: "PATCH",
      body: body,
    });
  }

  async deleteSavedView(args: SingleSavedViewParams): Promise<void> {
    return this.queryITwinApi({
      signal: args.signal,
      url: `${this.baseUrl}/${args.savedViewId}`,
      method: "DELETE",
    });
  }

  async createTag(args: CreateTagParams): Promise<TagResponse> {
    const { signal, ...body } = args;
    return this.queryITwinApi({
      signal,
      url: `${this.baseUrl}/tags`,
      method: "POST",
      body: body,
    });
  }

  async getTag(args: SingleTagParams): Promise<TagResponse> {
    return this.queryITwinApi({
      signal: args.signal,
      url: `${this.baseUrl}/tags/${args.tagId}`,
      method: "GET",
    });
  }

  async getAllTags(args: GetTagsParams): Promise<TagListResponse> {
    const iModelId = args.iModelId ? `&iModelId=${args.iModelId}` : "";
    const url = `${this.baseUrl}/tags/?iTwinId=${args.iTwinId}${iModelId}`;
    return this.queryITwinApi({
      signal: args.signal,
      url: url,
      method: "GET",
    });
  }

  async deleteTag(args: SingleTagParams): Promise<void> {
    return this.queryITwinApi({
      signal: args.signal,
      url: `${this.baseUrl}/tags/${args.tagId}`,
      method: "DELETE",
    });
  }

  async updateTag(args: UpdateTagParams): Promise<TagResponse> {
    const { tagId, signal, ...body } = args;
    return this.queryITwinApi({
      signal,
      url: `${this.baseUrl}/tags/${tagId}`,
      method: "PATCH",
      body: body,
    });
  }

  async getImage(args: GetImageParams): Promise<ImageResponse> {
    return this.queryITwinApi({
      signal: args.signal,
      url: `${this.baseUrl}/${args.savedViewId}/image?size=${args.size}`,
      method: "GET",
    });
  }

  async updateImage(args: UpdateImageParams): Promise<void> {
    const { savedViewId, signal, ...body } = args;
    return this.queryITwinApi({
      signal: signal,
      url: `${this.baseUrl}/${savedViewId}/image`,
      method: "PUT",
      body: body,
    });
  }

  async getGroup(args: SingleGroupParams): Promise<GroupResponse> {
    return this.queryITwinApi({
      signal: args.signal,
      url: `${this.baseUrl}/groups/${args.groupId}`,
      method: "GET",
    });
  }

  async getAllGroups(args: GetGroupsParams): Promise<GroupListResponse> {
    const iModelId = args.iModelId ? `&iModelId=${args.iModelId}` : "";
    const url = `${this.baseUrl}/groups/?iTwinId=${args.iTwinId}${iModelId}`;
    return this.queryITwinApi({
      signal: args.signal,
      url: url,
      method: "GET",
    });
  }

  async createGroup(args: CreateGroupParams): Promise<GroupResponse> {
    const { signal, ...body } = args;
    return this.queryITwinApi({
      signal,
      url: `${this.baseUrl}/groups/`,
      method: "POST",
      body: body,
    });
  }

  async updateGroup(args: UpdateGroupParams): Promise<GroupResponse> {
    const { groupId, signal, ...body } = args;
    return this.queryITwinApi({
      signal: signal,
      url: `${this.baseUrl}/groups/${groupId}`,
      method: "PATCH",
      body: body,
    });
  }

  async deleteGroup(args: SingleGroupParams): Promise<void> {
    return this.queryITwinApi({
      signal: args.signal,
      url: `${this.baseUrl}/groups/${args.groupId}`,
      method: "DELETE",
    });
  }

  async createExtension(
    args: CreateExtensionParams,
  ): Promise<ExtensionResponse> {
    const { savedViewId, signal, ...body } = args;
    return this.queryITwinApi({
      signal,
      url: `${this.baseUrl}/${savedViewId}/extensions/`,
      method: "PUT",
      body: body,
    });
  }

  async getExtension(args: SingleExtensionParams): Promise<ExtensionResponse> {
    return this.queryITwinApi({
      signal: args.signal,
      url: `${this.baseUrl}/${args.savedViewId}/extensions/${args.extensionName}`,
      method: "GET",
    });
  }

  async getAllExtensions(args: GetExtensionsParams): Promise<ExtensionListResponse> {
    return this.queryITwinApi({
      signal: args.signal,
      url: `${this.baseUrl}/${args.savedViewId}/extensions/`,
      method: "GET",
    });
  }

  async deleteExtension(args: SingleExtensionParams): Promise<void> {
    return this.queryITwinApi({
      signal: args.signal,
      url: `${this.baseUrl}/${args.savedViewId}/extensions/${args.extensionName}`,
      method: "DELETE",
    });
  }
}

export interface ITwinSavedViewsClientParams {
  /** @default "https://api.bentley.com/savedviews"  */
  baseUrl?: string;
  getAccessToken: () => Promise<string>;
}

/** Prefer enum for request. */
enum PreferOptions {
  /**
   * affects the granularity of the data returned
   *  ONLY for get requests will be ignored for PUT POST DELETE
   *  MINIMAL = "return=minimal", least info
   *  REPRESENTATION = "return=representation" most info
   */
  Minimal = "return=minimal",
  Representation = "return=representation",
}

interface QueryParams {
  signal?: AbortSignal | undefined;
  headers?: {
    prefer?: PreferOptions;
  };
  url: string;
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: object | undefined;
}
