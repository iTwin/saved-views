/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { PreferOptions } from "../models/Prefer";
import { CommonRequestParams } from "../models/client/CommonClientInterfaces";
import {
  SingleSavedViewParams, GetSavedViewsParams, CreateSavedViewParams, UpdateSavedViewParams, CreateTagParams, SingleTagParams,
  UpdateTagParams, GetImageParams, UpdateImageParams, CreateGroupParams, SingleGroupParams, UpdateGroupParams, CreateExtensionParams,
  SingleExtensionParams, GetExtensionsParams, SaveViewsClient, GetTagsParams, GetGroupsParams, ExtensionListResponse, ExtensionResponse,
  GroupListResponse, GroupResponse, ImageResponse, SavedViewListResponse, SavedViewResponse, TagListResponse, TagResponse,
} from "../models/client/SavedViewClientInterfaces";
import { callITwinApi } from "./ApiUtils";

export interface ITwinSavedViewsClientParams {
  /** optional url for targeting services  */
  baseUrl?: string;
  /** function for getting auth token */
  getAccessToken: () => Promise<string>;
}

interface QueryParams {
  requestParams: CommonRequestParams;
  url: string;
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: object | undefined;
}

/**
 * This is client is used to access all services(image groups extensions ...) associated with savedViews.
 *
 * Usage Example
 * const savedViewsClient = new ITwinSavedViewsClient({baseUrl,accessToken})
 * if baseURL undefined defaults to https://api.bentley.com/savedviews
 * savedViewsClient.getSavedView(...)
 * savedViewsClient.getTag(..)
 * saveViewsClient.getExtension(...)
 * saveViewsClient.getImage(...)
 * saveViewsClient.getGroup(...)
*/
export class ITwinSavedViewsClient implements SaveViewsClient {
  private readonly baseUrl;
  private readonly getAccessToken: () => Promise<string>;

  constructor(args: ITwinSavedViewsClientParams) {
    this.baseUrl = args.baseUrl ?? "https://api.bentley.com/savedviews";
    this.getAccessToken = args.getAccessToken;
  }

  private async queryITwinApi<ReturnType>(queyParams: QueryParams) {
    const resp = await callITwinApi({
      url: queyParams.url,
      method: queyParams.method,
      getAccessToken: this.getAccessToken,
      signal: queyParams.requestParams.signal,
      headers: {
        Accept: "application/vnd.bentley.itwin-platform.v1+json",
        ...queyParams.requestParams.headers,
      },
      body: queyParams.body,
    });
    return resp as unknown as ReturnType;
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
