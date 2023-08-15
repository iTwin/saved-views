// Copyright (c) Bentley Systems, Incorporated. All rights reserved.

import { ExtensionListResponse, ExtensionResponse } from "@bentley/itwin-saved-views-utilities";
import { HttpActions } from "../models/httpActionsAndStatus";
import { callITwinApi } from "../utils/apiUtils";
import { commonClientArgs } from "../models/clientModels/commonClientInterfaces";
import { ExtensionsClient, createExtensionArgs, singleExtensionArgs, commonExtensionArgs } from "../models/clientModels/extensionClientInterfaces";

export class SavedViewsExtensionsClient implements ExtensionsClient {
  private readonly baseURL;
  private readonly getAccessToken: () => Promise<string>;

  constructor(args: commonClientArgs) {
    this.baseURL = args.baseURL;
    this.getAccessToken = args.getAccessToken;
  }

  async createExtension(args: createExtensionArgs): Promise<ExtensionResponse> {
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

  async getExtension(args: singleExtensionArgs): Promise<ExtensionResponse> {
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

  async getAllExtensions(args: commonExtensionArgs): Promise<ExtensionListResponse> {
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

  async deleteExtension(args: singleExtensionArgs): Promise<void> {
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
