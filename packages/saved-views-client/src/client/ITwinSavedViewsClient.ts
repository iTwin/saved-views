/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { SavedViewResponse, SavedViewListResponse, TagListResponse, TagResponse, ImageResponse, GroupListResponse, GroupResponse, ExtensionListResponse, ExtensionResponse } from "..";
import { PreferOptions } from "../models/Prefer";
import { CommonRequestParams } from "../models/client/CommonClientInterfaces";
import { SingleSavedViewParams, GetSavedViewsParams, CreateSavedViewParams, UpdateSavedViewParams, CreateTagParams, SingleTagParams, UpdateTagParams, GetImageParams, UpdateImageParams, CreateGroupParams, SingleGroupParams, UpdateGroupParams, CreateExtensionParams, SingleExtensionParams, GetExtensionsParams, SaveViewsClient, GetTagsParams, GetGroupsParams } from "../models/client/SavedViewClientInterfaces";
import { CallITwinApiParams, callITwinApi } from "./ApiUtils";
import * as _ from "lodash";

export interface CommonClientArgs {
  /** url that conforms to pattern https://{...}api.bentley.com/savedviews */
  baseUrl: string;
  /** function for getting auth token */
  getAccessToken: () => Promise<string>;
}
interface QueryParams<RequestParams extends CommonRequestParams, BodyType extends object> {
  requestParams: RequestParams;
  createUrl: () => string;
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: BodyType;
}
/**
 * This is client is used to access all services(image groups extensions ...) associated with savedViews.
 *
 * Usage Example
 * const savedViewsClient = new ITwinSavedViewsClient(...)
 * savedViewsClient.getSavedView(...)
 * savedViewsClient.getTag(..)
 * saveViewsClient.getExtension(...)
 * saveViewsClient.getImage(...)
 * saveViewsClient.getGroup(...)
*/
export class ITwinSavedViewsClient implements SaveViewsClient {
  private readonly baseUrl;
  private readonly getAccessToken: () => Promise<string>;

  constructor(args: CommonClientArgs) {
    this.baseUrl = args.baseUrl;
    this.getAccessToken = args.getAccessToken;
  }

  private async queryITwinApi<ReturnType, RequestParams extends CommonRequestParams, BodyType extends object>
    (queyParams: QueryParams<RequestParams, BodyType>) {
    
    const params: CallITwinApiParams<BodyType> = {
      url: queyParams.createUrl(),
      method: queyParams.method,
      getAccessToken: this.getAccessToken,
      signal: queyParams.requestParams.signal,
      headers: {
        Accept: "application/vnd.bentley.itwin-platform.v1+json",
        ...queyParams.requestParams.headers,
      },
      body: queyParams.body,
    };
    if (!params.body) {
      delete params.body;
    }
    const resp = await callITwinApi(params);
    return resp as unknown as ReturnType;
  }

  private addHeadersToHeaders<RequestParams extends CommonRequestParams>(args: RequestParams, headers: object[]) {
    const argsCopy = _.cloneDeep(args); // Maintain Initial Integrity of Args Object Using Copy On Write Pattern
    const headersToAdd = headers.reduce((result, currentObject) => {
      return { ...result, ...currentObject };
    }, {});
    argsCopy.headers = { ...argsCopy.headers, ...headersToAdd };
    return argsCopy;
  }

  async getSavedView(args: SingleSavedViewParams): Promise<SavedViewResponse> {
    const argsCopy = this.addHeadersToHeaders(args, [{ prefer: args.prefer ? args.prefer : PreferOptions.MINIMAL }]);
    return this.queryITwinApi({
      requestParams: argsCopy,
      createUrl: () => `${this.baseUrl}/${argsCopy.savedViewId}`,
      method: "GET",
    });
  }

  async getAllSavedViews(args: GetSavedViewsParams): Promise<SavedViewListResponse> {
    const argsCopy = this.addHeadersToHeaders(args, [{ prefer: args.prefer ? args.prefer : PreferOptions.MINIMAL }]);
    const createUrl = () => {
      const iModelId = argsCopy.iModelId ? `&iModelId=${argsCopy.iModelId}` : "";
      const groupId = args.groupId ? `&groupId=${args.groupId}` : "";
      const top = args.top ? `&$top=${args.top}` : "";
      const skip = args.skip ? `&$skip=${args.skip}` : "";
      return `${this.baseUrl}/?iTwinId=${args.iTwinId}${iModelId}${groupId}${top}${skip}`;
    };
    return this.queryITwinApi({
      requestParams: argsCopy,
      createUrl: createUrl,
      method: "GET",
    });
  }

  async createSavedView(args: CreateSavedViewParams): Promise<SavedViewResponse> {
    return this.queryITwinApi({
      requestParams: args,
      createUrl: () => `${this.baseUrl}/`,
      method: "POST",
      body: args.savedViewPayload,
    });
  }

  async updateSavedView(args: UpdateSavedViewParams): Promise<SavedViewResponse> {
    return this.queryITwinApi({
      requestParams: args,
      createUrl: () => `${this.baseUrl}/${args.savedViewId}`,
      method: "PATCH",
      body: args.savedViewPayload,
    });
  }

  async deleteSavedView(args: SingleSavedViewParams): Promise<void> {
    return this.queryITwinApi({
      requestParams: args,
      createUrl: () => `${this.baseUrl}/${args.savedViewId}`,
      method: "DELETE",
    });
  }

  async createTag(args: CreateTagParams): Promise<TagResponse> {
    return this.queryITwinApi({
      requestParams: args,
      createUrl: () => `${this.baseUrl}/tags`,
      method: "POST",
      body: args.tagPayload,
    });
  }

  async getTag(args: SingleTagParams): Promise<TagResponse> {
    return this.queryITwinApi({
      requestParams: args,
      createUrl: () => `${this.baseUrl}/tags/${args.tagId}`,
      method: "GET",
    });
  }

  async getAllTags(args: GetTagsParams): Promise<TagListResponse> {
    return this.queryITwinApi({
      requestParams: args,
      createUrl: () => {
        const iModelId = args.iModelId ? `&iModelId=${args.iModelId}` : "";
        return `${this.baseUrl}/tags/?iTwinId=${args.iTwinId}${iModelId}`;
      },
      method: "GET",
    });
  }

  async deleteTag(args: SingleTagParams): Promise<void> {
    return this.queryITwinApi({
      requestParams: args,
      createUrl: () => `${this.baseUrl}/tags/${args.tagId}`,
      method: "DELETE",
    });
  }

  async updateTag(args: UpdateTagParams): Promise<TagResponse> {
    return this.queryITwinApi({
      requestParams: args,
      createUrl: () => `${this.baseUrl}/tags/${args.tagId}`,
      method: "PATCH",
      body: args.tagPayload,
    });
  }

  async getImage(args: GetImageParams): Promise<ImageResponse> {
    return this.queryITwinApi({
      requestParams: args,
      createUrl: () => `${this.baseUrl}/${args.savedViewId}/image?size=${args.size}`,
      method: "GET",
    });
  }

  async updateImage(args: UpdateImageParams): Promise<ImageResponse> {
    return this.queryITwinApi({
      requestParams: args,
      createUrl: () => `${this.baseUrl}/${args.savedViewId}/image`,
      method: "PUT",
      body: args.imagePayload,
    });
  }

  async getGroup(args: SingleGroupParams): Promise<GroupResponse> {
    return this.queryITwinApi({
      requestParams: args,
      createUrl: () => `${this.baseUrl}/groups/${args.groupId}`,
      method: "GET",
    });
  }

  async getAllGroups(args: GetGroupsParams): Promise<GroupListResponse> {
    return this.queryITwinApi({
      requestParams: args,
      createUrl: () => {
        const iModelId = args.iModelId ? `&iModelId=${args.iModelId}` : "";
        return `${this.baseUrl}/groups/?iTwinId=${args.iTwinId}${iModelId}`;
      },
      method: "GET",
    });
  }

  async createGroup(args: CreateGroupParams): Promise<GroupResponse> {
    return this.queryITwinApi({
      requestParams: args,
      createUrl: () => `${this.baseUrl}/groups/`,
      method: "POST",
      body: args.groupPayload,
    });
  }

  async updateGroup(args: UpdateGroupParams): Promise<GroupResponse> {
    return this.queryITwinApi({
      requestParams: args,
      createUrl: () => `${this.baseUrl}/groups/${args.groupId}`,
      method: "PATCH",
      body: args.groupPayload,
    });
  }

  async deleteGroup(args: SingleGroupParams): Promise<void> {
    return this.queryITwinApi({
      requestParams: args,
      createUrl: () => `${this.baseUrl}/groups/${args.groupId}`,
      method: "DELETE",
    });
  }

  async createExtension(args: CreateExtensionParams): Promise<ExtensionResponse> {
    return this.queryITwinApi({
      requestParams: args,
      createUrl: () => `${this.baseUrl}/${args.savedViewId}/extensions/`,
      method: "PUT",
      body: args.extensionPayload,
    });
  }

  async getExtension(args: SingleExtensionParams): Promise<ExtensionResponse> {
    return this.queryITwinApi({
      requestParams: args,
      createUrl: () => `${this.baseUrl}/${args.savedViewId}/extensions/${args.extensionName}`,
      method: "GET",
    });
  }

  async getAllExtensions(args: GetExtensionsParams): Promise<ExtensionListResponse> {
    return this.queryITwinApi({
      requestParams: args,
      createUrl: () => `${this.baseUrl}/${args.savedViewId}/extensions/`,
      method: "GET",
    });
  }

  async deleteExtension(args: SingleExtensionParams): Promise<void> {
    return this.queryITwinApi({
      requestParams: args,
      createUrl: () => `${this.baseUrl}/${args.savedViewId}/extensions/${args.extensionName}`,
      method: "DELETE",
    });
  }
}
