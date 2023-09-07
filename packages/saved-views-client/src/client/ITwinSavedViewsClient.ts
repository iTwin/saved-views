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
      headers: {
        Accept: "application/vnd.bentley.itwin-platform.v1+json",
        ...queyParams.headers,
      },
      body: queyParams.body,
      getAccessToken: this.getAccessToken,
      signal: queyParams.signal,
    }) as ReturnType;
  }

  async getSavedViewMinimal(args: SingleSavedViewParams): Promise<SavedViewMinimalResponse> {
    return this.queryITwinApi({
      url: `${this.baseUrl}/${args.savedViewId}`,
      method: "GET",
      headers: {
        prefer: PreferOptions.Minimal,
      },
      signal: args.signal,
    });
  }

  async getSavedViewRepresentation(args: SingleSavedViewParams): Promise<SavedViewRepresentationResponse> {
    return this.queryITwinApi({
      url: `${this.baseUrl}/${args.savedViewId}`,
      method: "GET",
      headers: {
        prefer: PreferOptions.Representation,
      },
      signal: args.signal,
    });
  }

  async getAllSavedViewsMinimal(args: GetSavedViewsParams): Promise<SavedViewListMinimalResponse> {
    const iModelId = args.iModelId ? `&iModelId=${args.iModelId}` : "";
    const groupId = args.groupId ? `&groupId=${args.groupId}` : "";
    const top = args.top ? `&$top=${args.top}` : "";
    const skip = args.skip ? `&$skip=${args.skip}` : "";
    const url = `${this.baseUrl}/?ITwinId=${args.iTwinId}${iModelId}${groupId}${top}${skip}`;
    return this.queryITwinApi({
      url: url,
      method: "GET",
      headers: {
        prefer: PreferOptions.Minimal,
      },
      signal: args.signal,
    });
  }

  async getAllSavedViewsRepresentation(args: GetSavedViewsParams): Promise<SavedViewListRepresentationResponse> {
    const iModelId = args.iModelId ? `&iModelId=${args.iModelId}` : "";
    const groupId = args.groupId ? `&groupId=${args.groupId}` : "";
    const top = args.top ? `&$top=${args.top}` : "";
    const skip = args.skip ? `&$skip=${args.skip}` : "";
    const url = `${this.baseUrl}/?iTwinId=${args.iTwinId}${iModelId}${groupId}${top}${skip}`;
    return this.queryITwinApi({
      url: url,
      method: "GET",
      headers: {
        prefer: PreferOptions.Representation,
      },
      signal: args.signal,
    });
  }

  async createSavedView(args: CreateSavedViewParams): Promise<SavedViewMinimalResponse> {
    const { signal, ...body } = args;
    return this.queryITwinApi({
      url: `${this.baseUrl}/`,
      method: "POST",
      body: body,
      signal: signal,
    });
  }

  async updateSavedView(args: UpdateSavedViewParams): Promise<SavedViewMinimalResponse> {
    const { savedViewId, signal, ...body } = args;
    return this.queryITwinApi({
      url: `${this.baseUrl}/${savedViewId}`,
      method: "PATCH",
      body: body,
      signal,
    });
  }

  async deleteSavedView(args: SingleSavedViewParams): Promise<void> {
    return this.queryITwinApi({
      url: `${this.baseUrl}/${args.savedViewId}`,
      method: "DELETE",
      signal: args.signal,
    });
  }

  async getImage(args: GetImageParams): Promise<ImageResponse> {
    return this.queryITwinApi({
      url: `${this.baseUrl}/${args.savedViewId}/image?size=${args.size}`,
      method: "GET",
      signal: args.signal,
    });
  }

  async updateImage(args: UpdateImageParams): Promise<void> {
    const { savedViewId, signal, ...body } = args;
    return this.queryITwinApi({
      url: `${this.baseUrl}/${savedViewId}/image`,
      method: "PUT",
      body: body,
      signal: signal,
    });
  }

  async getGroup(args: SingleGroupParams): Promise<GroupResponse> {
    return this.queryITwinApi({
      url: `${this.baseUrl}/groups/${args.groupId}`,
      method: "GET",
      signal: args.signal,
    });
  }

  async getAllGroups(args: GetGroupsParams): Promise<GroupListResponse> {
    const iModelId = args.iModelId ? `&iModelId=${args.iModelId}` : "";
    const url = `${this.baseUrl}/groups/?iTwinId=${args.iTwinId}${iModelId}`;
    return this.queryITwinApi({
      url: url,
      method: "GET",
      signal: args.signal,
    });
  }

  async createGroup(args: CreateGroupParams): Promise<GroupResponse> {
    const { signal, ...body } = args;
    return this.queryITwinApi({
      method: "POST",
      body: body,
      signal,
      url: `${this.baseUrl}/groups/`,
    });
  }

  async updateGroup(args: UpdateGroupParams): Promise<GroupResponse> {
    const { groupId, signal, ...body } = args;
    return this.queryITwinApi({
      url: `${this.baseUrl}/groups/${groupId}`,
      method: "PATCH",
      body: body,
      signal: signal,
    });
  }

  async deleteGroup(args: SingleGroupParams): Promise<void> {
    return this.queryITwinApi({
      url: `${this.baseUrl}/groups/${args.groupId}`,
      method: "DELETE",
      signal: args.signal,
    });
  }

  async getExtension(args: SingleExtensionParams): Promise<ExtensionResponse> {
    return this.queryITwinApi({
      url: `${this.baseUrl}/${args.savedViewId}/extensions/${args.extensionName}`,
      method: "GET",
      signal: args.signal,
    });
  }

  async getAllExtensions(args: GetExtensionsParams): Promise<ExtensionListResponse> {
    return this.queryITwinApi({
      url: `${this.baseUrl}/${args.savedViewId}/extensions/`,
      method: "GET",
      signal: args.signal,
    });
  }

  async createExtension(
    args: CreateExtensionParams,
  ): Promise<ExtensionResponse> {
    const { savedViewId, signal, ...body } = args;
    return this.queryITwinApi({
      url: `${this.baseUrl}/${savedViewId}/extensions/`,
      method: "PUT",
      body: body,
      signal,
    });
  }

  async deleteExtension(args: SingleExtensionParams): Promise<void> {
    return this.queryITwinApi({
      url: `${this.baseUrl}/${args.savedViewId}/extensions/${args.extensionName}`,
      method: "DELETE",
      signal: args.signal,
    });
  }

  async getTag(args: SingleTagParams): Promise<TagResponse> {
    return this.queryITwinApi({
      url: `${this.baseUrl}/tags/${args.tagId}`,
      method: "GET",
      signal: args.signal,
    });
  }

  async getAllTags(args: GetTagsParams): Promise<TagListResponse> {
    const iModelId = args.iModelId ? `&iModelId=${args.iModelId}` : "";
    const url = `${this.baseUrl}/tags/?iTwinId=${args.iTwinId}${iModelId}`;
    return this.queryITwinApi({
      url: url,
      method: "GET",
      signal: args.signal,
    });
  }

  async createTag(args: CreateTagParams): Promise<TagResponse> {
    const { signal, ...body } = args;
    return this.queryITwinApi({
      url: `${this.baseUrl}/tags`,
      method: "POST",
      body: body,
      signal,
    });
  }

  async updateTag(args: UpdateTagParams): Promise<TagResponse> {
    const { tagId, signal, ...body } = args;
    return this.queryITwinApi({
      url: `${this.baseUrl}/tags/${tagId}`,
      method: "PATCH",
      body: body,
      signal,
    });
  }

  async deleteTag(args: SingleTagParams): Promise<void> {
    return this.queryITwinApi({
      url: `${this.baseUrl}/tags/${args.tagId}`,
      method: "DELETE",
      signal: args.signal,
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
  url: string;
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: object | undefined;
  headers?: {
    prefer?: PreferOptions;
  };
  signal?: AbortSignal | undefined;
}
