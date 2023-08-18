// Copyright (c) Bentley Systems, Incorporated. All rights reserved.

import { HttpActions } from "../models/HttpActionsAndStatus";
import { callITwinApi } from "../utils/apiUtils";
import { CommonClientArgs } from "../models/clientModels/CommonClientInterfaces";
import { ExtensionsClient, CreateExtensionArgs, SingleExtensionArgs, CommonExtensionArgs } from "../models/clientModels/ExtensionClientInterfaces";
import { ExtensionResponse, ExtensionListResponse } from "../..";

export class SavedViewsExtensionsClient implements ExtensionsClient {
  private readonly baseURL;
  private readonly getAccessToken: () => Promise<string>;

  constructor(args: CommonClientArgs) {
    this.baseURL = args.baseURL;
    this.getAccessToken = args.getAccessToken;
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

  async getAllExtensions(args: CommonExtensionArgs): Promise<ExtensionListResponse> {
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
