/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import type { DisplayStyleSettingsProps } from "../models/savedViews/DisplayStyles.js";
import {
  isViewDataITwin3d, isViewDataITwinDrawing, isViewDataITwinSheet, type ViewData,
} from "../models/savedViews/View.js";
import { callITwinApi } from "./ApiUtils.js";
import type {
  CreateExtensionParams, CreateGroupParams, CreateSavedViewParams, CreateTagParams, ExtensionListResponse,
  ExtensionResponse, GetExtensionsParams, GetGroupsParams, GetImageParams, GetSavedViewsParams, GetTagsParams,
  GroupListResponse, GroupResponse, ImageResponse, SavedViewListMinimalResponse, SavedViewListRepresentationResponse,
  SavedViewMinimalResponse, SavedViewRepresentationResponse, SavedViewsClient, SingleExtensionParams, SingleGroupParams,
  SingleSavedViewParams, SingleTagParams, TagListResponse, TagResponse, UpdateGroupParams, UpdateImageParams,
  UpdateSavedViewParams, UpdateTagParams,
} from "./SavedViewsClient.js";

export interface ITwinSavedViewsClientParams {
  /** @default "https://api.bentley.com/savedviews"  */
  baseUrl?: string;

  /**
   * Authorization token that grants access to iTwin Saved Views API. The token should be valid for `savedviews:read`
   * and `savedviews:modify` OIDC scopes.
   */
  getAccessToken: () => Promise<string>;
}

/** {@linkcode SavedViewsClient} implementation that calls iTwin APIs. */
export class ITwinSavedViewsClient implements SavedViewsClient {
  private readonly baseUrl;
  private readonly getAccessToken: () => Promise<string>;

  constructor(args: ITwinSavedViewsClientParams) {
    this.baseUrl = args.baseUrl ?? "https://api.bentley.com/savedviews";
    this.getAccessToken = args.getAccessToken;
  }

  private async queryITwinApi<ReturnType>(args: QueryParams): Promise<ReturnType> {
    return callITwinApi({
      url: args.url,
      method: args.method,
      headers: {
        "Content-Type": "application/json",
        ...args.headers,
      },
      body: args.body,
      getAccessToken: this.getAccessToken,
      signal: args.signal,
    }) as ReturnType;
  }

  async getSavedViewMinimal(args: SingleSavedViewParams): Promise<SavedViewMinimalResponse> {
    const response = await this.queryITwinApi({
      url: `${this.baseUrl}/${args.savedViewId}`,
      method: "GET",
      headers: {
        Prefer: PreferOptions.Minimal,
      },
      signal: args.signal,
    }) as SavedViewMinimalResponse;

    replaceAllUrlFields(response.savedView.savedViewData, fromITwinApi);
    return response;
  }

  async getSavedViewRepresentation(args: SingleSavedViewParams): Promise<SavedViewRepresentationResponse> {
    const response = await this.queryITwinApi({
      url: `${this.baseUrl}/${args.savedViewId}`,
      method: "GET",
      headers: {
        Prefer: PreferOptions.Representation,
      },
      signal: args.signal,
    }) as SavedViewRepresentationResponse;

    replaceAllUrlFields(response.savedView.savedViewData, fromITwinApi);
    return response;
  }

  async getAllSavedViewsMinimal(args: GetSavedViewsParams): Promise<SavedViewListMinimalResponse> {
    const iModelId = args.iModelId ? `&iModelId=${args.iModelId}` : "";
    const groupId = args.groupId ? `&groupId=${args.groupId}` : "";
    const top = args.top ? `&$top=${args.top}` : "";
    const skip = args.skip ? `&$skip=${args.skip}` : "";
    return this.queryITwinApi({
      url: `${this.baseUrl}/?iTwinId=${args.iTwinId}${iModelId}${groupId}${top}${skip}`,
      method: "GET",
      headers: {
        Prefer: PreferOptions.Minimal,
      },
      signal: args.signal,
    });
  }

  async getAllSavedViewsRepresentation(args: GetSavedViewsParams): Promise<SavedViewListRepresentationResponse> {
    const iTwinId = args.iTwinId && `iTwinId=${args.iTwinId}`;
    const iModelId = args.iModelId && `iModelId=${args.iModelId}`;
    const groupId = args.groupId && `groupId=${args.groupId}`;
    const top = args.top && `$top=${args.top}`;
    const skip = args.skip && `$skip=${args.skip}`;
    const query = [iTwinId, iModelId, groupId, top, skip].filter((param) => param).join("&");
    const response = await this.queryITwinApi({
      url: `${this.baseUrl}?${query}`,
      method: "GET",
      headers: {
        Prefer: PreferOptions.Representation,
      },
      signal: args.signal,
    }) as SavedViewListRepresentationResponse;

    for (const savedView of response.savedViews) {
      replaceAllUrlFields(savedView.savedViewData, fromITwinApi);
    }

    return response;
  }

  async createSavedView(args: CreateSavedViewParams): Promise<SavedViewMinimalResponse> {
    const { signal, ...body } = args;
    const savedViewData = structuredClone(body.savedViewData);
    replaceAllUrlFields(savedViewData, toITwinApi);

    return this.queryITwinApi({
      url: `${this.baseUrl}/`,
      method: "POST",
      body: {
        ...body,
        savedViewData,
      },
      signal,
    });
  }

  async updateSavedView(args: UpdateSavedViewParams): Promise<SavedViewMinimalResponse> {
    const { savedViewId, signal, ...body } = args;
    return this.queryITwinApi({
      url: `${this.baseUrl}/${savedViewId}`,
      method: "PATCH",
      body,
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
      body,
      signal,
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
    return this.queryITwinApi({
      url: `${this.baseUrl}/groups/?iTwinId=${args.iTwinId}${iModelId}`,
      method: "GET",
      signal: args.signal,
    });
  }

  async createGroup(args: CreateGroupParams): Promise<GroupResponse> {
    const { signal, ...body } = args;
    return this.queryITwinApi({
      method: "POST",
      body,
      signal,
      url: `${this.baseUrl}/groups/`,
    });
  }

  async updateGroup(args: UpdateGroupParams): Promise<GroupResponse> {
    const { groupId, signal, ...body } = args;
    return this.queryITwinApi({
      url: `${this.baseUrl}/groups/${groupId}`,
      method: "PATCH",
      body,
      signal,
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

  async createExtension(args: CreateExtensionParams): Promise<ExtensionResponse> {
    const { savedViewId, signal, ...body } = args;
    return this.queryITwinApi({
      url: `${this.baseUrl}/${savedViewId}/extensions/`,
      method: "PUT",
      body,
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
    return this.queryITwinApi({
      url: `${this.baseUrl}/tags/?iTwinId=${args.iTwinId}${iModelId}`,
      method: "GET",
      signal: args.signal,
    });
  }

  async createTag(args: CreateTagParams): Promise<TagResponse> {
    const { signal, ...body } = args;
    return this.queryITwinApi({
      url: `${this.baseUrl}/tags`,
      method: "POST",
      body,
      signal,
    });
  }

  async updateTag(args: UpdateTagParams): Promise<TagResponse> {
    const { tagId, signal, ...body } = args;
    return this.queryITwinApi({
      url: `${this.baseUrl}/tags/${tagId}`,
      method: "PATCH",
      body,
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

export enum PreferOptions {
  Minimal = "return=minimal",
  Representation = "return=representation",
}

interface QueryParams {
  url: string;
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: object | undefined;
  headers?: {
    Prefer?: PreferOptions;
  };
  signal?: AbortSignal | undefined;
}

function replaceAllUrlFields(savedViewData: ViewData, replace: (url: string) => string): void {
  const displayStyle = getDisplayStyle(savedViewData);
  const mapImagery = displayStyle?.mapImagery;
  if (mapImagery) {
    if (mapImagery.backgroundBase && "url" in mapImagery.backgroundBase) {
      const baseUrl = mapImagery.backgroundBase.url;
      if (baseUrl) {
        mapImagery.backgroundBase.url = replace(baseUrl);
      }
    }

    for (const layer of mapImagery?.overlayLayers ?? []) {
      if ("url" in layer && layer.url) {
        layer.url = replace(layer.url);
      }
    }

    for (const layer of (mapImagery?.backgroundLayers ?? [])) {
      if ("url" in layer && layer.url) {
        layer.url = replace(layer.url);
      }
    }
  }

  for (const model of displayStyle?.contextRealityModels ?? []) {
    if (model.tilesetUrl) {
      model.tilesetUrl = replace(model.tilesetUrl);
    }

    if (model.description) {
      model.description = replace(model.description);
    }
  }
}

function getDisplayStyle(savedViewData: ViewData): DisplayStyleSettingsProps | undefined {
  if (isViewDataITwin3d(savedViewData)) {
    return savedViewData.itwin3dView.displayStyle;
  }

  if (isViewDataITwinDrawing(savedViewData)) {
    return savedViewData.itwinDrawingView.displayStyle;
  }

  if (isViewDataITwinSheet(savedViewData)) {
    return savedViewData.itwinSheetView.displayStyle;
  }

  return undefined;
}

function toITwinApi(url: string): string {
  return url
    .replaceAll("&", "++and++")
    .replaceAll(".", "++dot++");
}

function fromITwinApi(url: string): string {
  return url
    .replaceAll("++and++", "&")
    .replaceAll("++dot++", ".");
}
