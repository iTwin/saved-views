// Copyright (c) Bentley Systems, Incorporated. All rights reserved.

import { SavedViewResponse } from "../../models/savedViews/SavedViewResponse.dto";
import { HttpActions } from "../models/HttpActionsAndStatus";
import { SaveViewsClient as ISavedViewsClient, CreateSavedViewArgs, GetAllSavedViewArgs, SingleSavedViewArgs, UpdateSavedViewArgs } from "../models/clientModels/SavedViewClientInterfaces";
import { callITwinApi } from "../utils/apiUtils";
import { PreferOptions } from "../models/Prefer";
import { CommonClientArgs } from "../models/clientModels/CommonClientInterfaces";
import { SavedViewListResponse } from "../../models/savedViews/SavedViewListResponse.dto";

export class SaveViewsClient implements ISavedViewsClient {

  private readonly baseURL;
  private readonly getAccessToken: () => Promise<string>;

  constructor(args: CommonClientArgs) {
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
}
