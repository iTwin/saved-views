// Copyright (c) Bentley Systems, Incorporated. All rights reserved.

import { SavedViewListResponse, SavedViewResponse } from "@bentley/itwin-saved-views-utilities";
import { HttpActions } from "../models/httpActionsAndStatus";
import { SaveViewsClient as ISavedViewsClient, createSavedViewArgs, getAllSavedViewArgs, singleSavedViewArgs, updateSavedViewArgs } from "../models/clientModels/savedViewClientInterfaces";
import { callITwinApi } from "../utils/apiUtils";
import { preferOptions } from "../models/prefer";
import { commonClientArgs } from "../models/clientModels/commonClientInterfaces";

export class SaveViewsClient implements ISavedViewsClient {

  private readonly baseURL;
  private readonly getAccessToken: () => Promise<string>;

  constructor(args: commonClientArgs) {
    this.baseURL = args.baseURL;
    this.getAccessToken = args.getAccessToken;
  }

  async getSavedView(args: singleSavedViewArgs): Promise<SavedViewResponse> {
    const url = `${this.baseURL}/${args.savedViewsId.combinedIdString}`;
    const resp = await callITwinApi({
      url: url,
      method: HttpActions.GET,
      getAccessToken: this.getAccessToken,
      signal: args.signal,
      headers: {
        Accept: "application/vnd.bentley.itwin-platform.v1+json",
        prefer: args.prefer ? args.prefer : preferOptions.MINIMAL,
        ...args.headers,
      },
    });
    return resp as unknown as SavedViewResponse;
  }

  async getAllSavedViews(args: getAllSavedViewArgs): Promise<SavedViewListResponse> {
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
        prefer: args.prefer ? args.prefer : preferOptions.MINIMAL,
        ...args.headers,
      },
    });
    return resp as unknown as SavedViewListResponse;
  }

  async createSavedView(args: createSavedViewArgs): Promise<SavedViewResponse> {
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

  async updateSavedView(args: updateSavedViewArgs): Promise<SavedViewResponse> {
    const url = `${this.baseURL}/${args.savedViewsId.combinedIdString}`;
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

  async deleteSavedView(args: singleSavedViewArgs): Promise<void> {
    const url = `${this.baseURL}/${args.savedViewsId.combinedIdString}`;
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
