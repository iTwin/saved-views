/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { CommonClientArgs, isValidBaseUrl } from "../models/client/CommonClientInterfaces";
import { SavedViewResponse, SavedViewListResponse, TagListResponse, TagResponse, ImageResponse, GroupListResponse, GroupResponse, ExtensionListResponse, ExtensionResponse } from "..";
import { PreferOptions } from "../models/Prefer";
import { SingleSavedViewArgs, GetAllSavedViewArgs, CreateSavedViewArgs, UpdateSavedViewArgs, CreateTagArgs, SingleTagArgs, UpdateTagArgs, CommonGetAllArgs, GetImageArgs, UpdateImageArgs, CreateGroup, SingleGroupArgs, UpdateGroupArgs, CreateExtensionArgs, SingleExtensionArgs, RequestBySavedViewIdArgs, SaveViewsClient } from "../models/client/SavedViewClientInterfaces";
import { callITwinApi, HttpActions } from "./utils/ApiUtils";

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
  private readonly baseURL;
  private readonly getAccessToken: () => Promise<string>;

  constructor(args: CommonClientArgs) {
    if (!isValidBaseUrl(args.baseURL)) {
      throw new Error("Base URL does not conform to pattern: https://{...}api.bentley.com/savedviews");
    }
    this.baseURL = args.baseURL;
    this.getAccessToken = args.getAccessToken;
  }

  async getSavedView(args: SingleSavedViewArgs): Promise<SavedViewResponse> {
    const url = `${this.baseURL}/${args.savedViewId}`;

    const resp = await callITwinApi({
      url: url,
      method: HttpActions.GET,
      getAccessToken: this.getAccessToken,
      signal: args.signal,
      headers: {
        Accept: "application/vnd.bentley.itwin-platform.v1+json",
        prefer: args.prefer ? args.prefer : PreferOptions.MINIMAL,
        ...args.headers,
      },
    });
    return resp as unknown as SavedViewResponse;
  }

  async getAllSavedViews(args: GetAllSavedViewArgs): Promise<SavedViewListResponse> {
    const iModelDomainParam = args.iModelId ? `&iModelId=${args.iModelId}` : "";
    const groupIdDomainParam = args.groupId ? `&groupId=${args.groupId}` : "";
    const topDomainParam = args.top ? `&$top=${args.top}` : "";
    const skipDomainParam = args.skip ? `&$skip=${args.skip}` : "";
    const url = `${this.baseURL}/?iTwinId=${args.iTwinId}${iModelDomainParam}${groupIdDomainParam}${topDomainParam}${skipDomainParam}`;

    const resp = await callITwinApi({
      url: url,
      method: HttpActions.GET,
      getAccessToken: this.getAccessToken,
      signal: args.signal,
      headers: {
        Accept: "application/vnd.bentley.itwin-platform.v1+json",
        prefer: args.prefer ? args.prefer : PreferOptions.MINIMAL,
        ...args.headers,
      },
    });
    return resp as unknown as SavedViewListResponse;
  }

  async createSavedView(args: CreateSavedViewArgs): Promise<SavedViewResponse> {
    const url = `${this.baseURL}/`;

    const resp = await callITwinApi({
      url: url,
      method: HttpActions.POST,
      getAccessToken: this.getAccessToken,
      signal: args.signal,
      headers: {
        Accept: "application/vnd.bentley.itwin-platform.v1+json",
        ...args.headers,
      },
      body: args.savedViewPayload,
    });
    return resp as unknown as SavedViewResponse;
  }

  async updateSavedView(args: UpdateSavedViewArgs): Promise<SavedViewResponse> {
    const url = `${this.baseURL}/${args.savedViewId}`;

    const resp = await callITwinApi({
      url: url,
      method: HttpActions.PATCH,
      getAccessToken: this.getAccessToken,
      signal: args.signal,
      headers: {
        Accept: "application/vnd.bentley.itwin-platform.v1+json",
        ...args.headers,
      },
      body: args.savedViewPayload,
    });
    return resp as unknown as SavedViewResponse;
  }

  async deleteSavedView(args: SingleSavedViewArgs): Promise<void> {
    const url = `${this.baseURL}/${args.savedViewId}`;

    await callITwinApi({
      url: url,
      method: HttpActions.DELETE,
      getAccessToken: this.getAccessToken,
      signal: args.signal,
      headers: {
        Accept: "application/vnd.bentley.itwin-platform.v1+json",
        ...args.headers,
      },
    });
  }

  async createTag(args: CreateTagArgs): Promise<TagResponse> {
    const url = this.baseURL;

    const resp = await callITwinApi({
      url: url,
      method: HttpActions.POST,
      getAccessToken: this.getAccessToken,
      signal: args.signal,
      headers: {
        Accept: "application/vnd.bentley.itwin-platform.v1+json",
        ...args.headers,
      },
      body: args.tagPayload,
    });
    return resp as unknown as TagResponse;
  }

  async getTag(args: SingleTagArgs): Promise<TagResponse> {
    const url = `${this.baseURL}/${args.tagId}`;

    const resp = await callITwinApi({
      url: url,
      method: HttpActions.GET,
      getAccessToken: this.getAccessToken,
      signal: args.signal,
      headers: {
        Accept: "application/vnd.bentley.itwin-platform.v1+json",
        ...args.headers,
      },
    });
    return resp as unknown as TagResponse;
  }

  async getAllTags(args: CommonGetAllArgs): Promise<TagListResponse> {
    const iModelDomainParam = args.iModelId ? `&iModelId=${args.iModelId}` : "";
    const url = `${this.baseURL}?iTwinId=${args.iTwinId}${iModelDomainParam}`;

    const resp = await callITwinApi({
      url: url,
      method: HttpActions.GET,
      getAccessToken: this.getAccessToken,
      signal: args.signal,
      headers: {
        Accept: "application/vnd.bentley.itwin-platform.v1+json",
        ...args.headers,
      },
    });
    return resp as unknown as TagListResponse;
  }

  async deleteTag(args: SingleTagArgs): Promise<void> {
    const url = `${this.baseURL}/${args.tagId}`;

    await callITwinApi({
      url: url,
      method: HttpActions.DELETE,
      getAccessToken: this.getAccessToken,
      signal: args.signal,
      headers: {
        Accept: "application/vnd.bentley.itwin-platform.v1+json",
        ...args.headers,
      },
    });

  }

  async updateTag(args: UpdateTagArgs): Promise<TagResponse> {
    const url = `${this.baseURL}/${args.tagId}`;

    const resp = await callITwinApi({
      url: url,
      method: HttpActions.PATCH,
      getAccessToken: this.getAccessToken,
      signal: args.signal,
      headers: {
        Accept: "application/vnd.bentley.itwin-platform.v1+json",
        ...args.headers,
      },
      body: args.tagPayload,
    });
    return resp as unknown as TagResponse;
  }

  async getImage(args: GetImageArgs): Promise<ImageResponse> {
    const url = `${this.baseURL}/${args.savedViewId}/image?size=${args.size}`;

    const resp = await callITwinApi({
      url: url,
      method: HttpActions.GET,
      getAccessToken: this.getAccessToken,
      signal: args.signal,
      headers: {
        Accept: "application/vnd.bentley.itwin-platform.v1+json",
        ...args.headers,
      },
    });
    return resp as unknown as ImageResponse;
  }

  async updateImage(args: UpdateImageArgs): Promise<ImageResponse> {
    const url = `${this.baseURL}/${args.savedViewId}/image`;

    const resp = await callITwinApi({
      url: url,
      method: HttpActions.PUT,
      getAccessToken: this.getAccessToken,
      signal: args.signal,
      headers: {
        Accept: "application/vnd.bentley.itwin-platform.v1+json",
        ...args.headers,
      },
      body: args.imagePayload,
    });
    return resp as unknown as ImageResponse;
  }

  async getGroup(args: SingleGroupArgs): Promise<GroupResponse> {
    const url = `${this.baseURL}/${args.groupId}`;

    const resp = await callITwinApi({
      url: url,
      method: HttpActions.GET,
      getAccessToken: this.getAccessToken,
      signal: args.signal,
      headers: {
        Accept: "application/vnd.bentley.itwin-platform.v1+json",
        ...args.headers,
      },
    });
    return resp as unknown as GroupResponse;
  }

  async getAllGroups(args: CommonGetAllArgs): Promise<GroupListResponse> {
    const iModelDomainParam = args.iModelId ? `&iModelId=${args.iModelId}` : "";
    const url = `${this.baseURL}/?iTwinId=${args.iTwinId}${iModelDomainParam}`;

    const resp = await callITwinApi({
      url: url,
      method: HttpActions.GET,
      getAccessToken: this.getAccessToken,
      signal: args.signal,
      headers: {
        Accept: "application/vnd.bentley.itwin-platform.v1+json",
        ...args.headers,
      },
    });
    return resp as unknown as GroupListResponse;
  }

  async createGroup(args: CreateGroup): Promise<GroupResponse> {
    const resp = await callITwinApi({
      url: this.baseURL,
      method: HttpActions.POST,
      getAccessToken: this.getAccessToken,
      signal: args.signal,
      headers: {
        Accept: "application/vnd.bentley.itwin-platform.v1+json",
        ...args.headers,
      },
      body: args.groupPayload,
    });
    return resp as unknown as GroupResponse;
  }

  async updateGroup(args: UpdateGroupArgs): Promise<GroupResponse> {
    const url = `${this.baseURL}/${args.groupId}`;

    const resp = await callITwinApi({
      url: url,
      method: HttpActions.PATCH,
      getAccessToken: this.getAccessToken,
      signal: args.signal,
      headers: {
        Accept: "application/vnd.bentley.itwin-platform.v1+json",
        ...args.headers,
      },
      body: args.groupPayload,
    });
    return resp as unknown as GroupResponse;
  }

  async deleteGroup(args: SingleGroupArgs): Promise<void> {
    const url = `${this.baseURL}/${args.groupId}`;

    await callITwinApi({
      url: url,
      method: HttpActions.DELETE,
      getAccessToken: this.getAccessToken,
      signal: args.signal,
      headers: {
        Accept: "application/vnd.bentley.itwin-platform.v1+json",
        ...args.headers,
      },
    });
  }

  async createExtension(args: CreateExtensionArgs): Promise<ExtensionResponse> {
    const url = `${this.baseURL}/${args.savedViewId}/extensions/`;

    const resp = await callITwinApi({
      url: url,
      method: HttpActions.PUT,
      getAccessToken: this.getAccessToken,
      signal: args.signal,
      headers: {
        Accept: "application/vnd.bentley.itwin-platform.v1+json",
        ...args.headers,
      },
      body: args.extension,
    });
    return resp as unknown as ExtensionResponse;
  }

  async getExtension(args: SingleExtensionArgs): Promise<ExtensionResponse> {
    const url = `${this.baseURL}/${args.savedViewId}/extensions/${args.extensionName}`;

    const resp = await callITwinApi({
      url: url,
      method: HttpActions.GET,
      getAccessToken: this.getAccessToken,
      signal: args.signal,
      headers: {
        Accept: "application/vnd.bentley.itwin-platform.v1+json",
        ...args.headers,
      },
    });
    return resp as unknown as ExtensionResponse;
  }

  async getAllExtensions(args: RequestBySavedViewIdArgs): Promise<ExtensionListResponse> {
    const url = `${this.baseURL}/${args.savedViewId}/extensions/`;

    const resp = await callITwinApi({
      url: url,
      method: HttpActions.GET,
      getAccessToken: this.getAccessToken,
      signal: args.signal,
      headers: {
        Accept: "application/vnd.bentley.itwin-platform.v1+json",
        ...args.headers,
      },
    });
    return resp as unknown as ExtensionListResponse;
  }

  async deleteExtension(args: SingleExtensionArgs): Promise<void> {
    const url = `${this.baseURL}/${args.savedViewId}/extensions/${args.extensionName}`;

    await callITwinApi({
      url: url,
      method: HttpActions.DELETE,
      getAccessToken: this.getAccessToken,
      signal: args.signal,
      headers: {
        Accept: "application/vnd.bentley.itwin-platform.v1+json",
        ...args.headers,
      },
    });
  }
}
