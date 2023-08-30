/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import {
  CommonRequestParams, CreateExtensionParams, CreateGroupParams, CreateSavedViewParams, CreateTagParams,
  ExtensionListResponse, ExtensionResponse, GetExtensionsParams, GetGroupsParams, GetImageParams, GetSavedViewsParams,
  GetTagsParams, GroupListResponse, GroupResponse, ImageResponse, PreferOptions, SavedViewListResponse,
  SavedViewResponse, SavedViewsClient, SingleExtensionParams, SingleGroupParams, SingleSavedViewParams, SingleTagParams,
  TagListResponse, TagResponse, UpdateGroupParams, UpdateImageParams, UpdateSavedViewParams, UpdateTagParams
} from "./SavedViewClient.js";
import { callITwinApi } from "./ApiUtils.js";

export interface ITwinSavedViewsClientParams {
  /** @default "https://api.bentley.com/savedviews"  */
  baseUrl?: string;
  getAccessToken: () => Promise<string>;
}

/**
 * {@linkcode SavedViewsClient} implementation that calls iTwin APIs.
 */
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
      signal: queyParams.requestParams.signal,
      headers: {
        Accept: "application/vnd.bentley.itwin-platform.v1+json",
        ...queyParams.requestParams.headers,
      },
      body: queyParams.body,
    }) as ReturnType;
  }

  async getSavedView(args: SingleSavedViewParams): Promise<SavedViewResponse> {
    return this.queryITwinApi({
      requestParams: {
        ...args,
        headers: {
          prefer: args.prefer ?? PreferOptions.MINIMAL,
          ...args.headers,
        },
      },
      url: `${this.baseUrl}/${args.savedViewId}`,
      method: "GET",
    });
  }

  async getAllSavedViews(args: GetSavedViewsParams): Promise<SavedViewListResponse> {
    const iModelId = args.iModelId ? `&iModelId=${args.iModelId}` : "";
    const groupId = args.groupId ? `&groupId=${args.groupId}` : "";
    const top = args.top ? `&$top=${args.top}` : "";
    const skip = args.skip ? `&$skip=${args.skip}` : "";
    const url = `${this.baseUrl}/?iTwinId=${args.iTwinId}${iModelId}${groupId}${top}${skip}`;
    return this.queryITwinApi({
      requestParams: {
        ...args,
        headers: {
          prefer: args.prefer ?? PreferOptions.MINIMAL,
          ...args.headers,
        },
      },
      url: url,
      method: "GET",
    });
  }

  async createSavedView(args: CreateSavedViewParams): Promise<SavedViewResponse> {
    return this.queryITwinApi({
      requestParams: args,
      url: `${this.baseUrl}/`,
      method: "POST",
      body: args.body,
    });
  }

  async updateSavedView(args: UpdateSavedViewParams): Promise<SavedViewResponse> {
    return this.queryITwinApi({
      requestParams: args,
      url: `${this.baseUrl}/${args.savedViewId}`,
      method: "PATCH",
      body: args.body,
    });
  }

  async deleteSavedView(args: SingleSavedViewParams): Promise<void> {
    return this.queryITwinApi({
      requestParams: args,
      url: `${this.baseUrl}/${args.savedViewId}`,
      method: "DELETE",
    });
  }

  async createTag(args: CreateTagParams): Promise<TagResponse> {
    return this.queryITwinApi({
      requestParams: args,
      url: `${this.baseUrl}/tags`,
      method: "POST",
      body: args.body,
    });
  }

  async getTag(args: SingleTagParams): Promise<TagResponse> {
    return this.queryITwinApi({
      requestParams: args,
      url: `${this.baseUrl}/tags/${args.tagId}`,
      method: "GET",
    });
  }

  async getAllTags(args: GetTagsParams): Promise<TagListResponse> {
    const iModelId = args.iModelId ? `&iModelId=${args.iModelId}` : "";
    const url = `${this.baseUrl}/tags/?iTwinId=${args.iTwinId}${iModelId}`;
    return this.queryITwinApi({
      requestParams: args,
      url: url,
      method: "GET",
    });
  }

  async deleteTag(args: SingleTagParams): Promise<void> {
    return this.queryITwinApi({
      requestParams: args,
      url: `${this.baseUrl}/tags/${args.tagId}`,
      method: "DELETE",
    });
  }

  async updateTag(args: UpdateTagParams): Promise<TagResponse> {
    return this.queryITwinApi({
      requestParams: args,
      url: `${this.baseUrl}/tags/${args.tagId}`,
      method: "PATCH",
      body: args.body,
    });
  }

  async getImage(args: GetImageParams): Promise<ImageResponse> {
    return this.queryITwinApi({
      requestParams: args,
      url: `${this.baseUrl}/${args.savedViewId}/image?size=${args.size}`,
      method: "GET",
    });
  }

  async updateImage(args: UpdateImageParams): Promise<ImageResponse> {
    return this.queryITwinApi({
      requestParams: args,
      url: `${this.baseUrl}/${args.savedViewId}/image`,
      method: "PUT",
      body: args.body,
    });
  }

  async getGroup(args: SingleGroupParams): Promise<GroupResponse> {
    return this.queryITwinApi({
      requestParams: args,
      url: `${this.baseUrl}/groups/${args.groupId}`,
      method: "GET",
    });
  }

  async getAllGroups(args: GetGroupsParams): Promise<GroupListResponse> {
    const iModelId = args.iModelId ? `&iModelId=${args.iModelId}` : "";
    const url = `${this.baseUrl}/groups/?iTwinId=${args.iTwinId}${iModelId}`;
    return this.queryITwinApi({
      requestParams: args,
      url: url,
      method: "GET",
    });
  }

  async createGroup(args: CreateGroupParams): Promise<GroupResponse> {
    return this.queryITwinApi({
      requestParams: args,
      url: `${this.baseUrl}/groups/`,
      method: "POST",
      body: args.body,
    });
  }

  async updateGroup(args: UpdateGroupParams): Promise<GroupResponse> {
    return this.queryITwinApi({
      requestParams: args,
      url: `${this.baseUrl}/groups/${args.groupId}`,
      method: "PATCH",
      body: args.body,
    });
  }

  async deleteGroup(args: SingleGroupParams): Promise<void> {
    return this.queryITwinApi({
      requestParams: args,
      url: `${this.baseUrl}/groups/${args.groupId}`,
      method: "DELETE",
    });
  }

  async createExtension(args: CreateExtensionParams): Promise<ExtensionResponse> {
    return this.queryITwinApi({
      requestParams: args,
      url: `${this.baseUrl}/${args.savedViewId}/extensions/`,
      method: "PUT",
      body: args.body,
    });
  }

  async getExtension(args: SingleExtensionParams): Promise<ExtensionResponse> {
    return this.queryITwinApi({
      requestParams: args,
      url: `${this.baseUrl}/${args.savedViewId}/extensions/${args.extensionName}`,
      method: "GET",
    });
  }

  async getAllExtensions(args: GetExtensionsParams): Promise<ExtensionListResponse> {
    return this.queryITwinApi({
      requestParams: args,
      url: `${this.baseUrl}/${args.savedViewId}/extensions/`,
      method: "GET",
    });
  }

  async deleteExtension(args: SingleExtensionParams): Promise<void> {
    return this.queryITwinApi({
      requestParams: args,
      url: `${this.baseUrl}/${args.savedViewId}/extensions/${args.extensionName}`,
      method: "DELETE",
    });
  }
}

interface QueryParams {
  requestParams: CommonRequestParams;
  url: string;
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: object | undefined;
}
