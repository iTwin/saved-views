// Copyright (c) Bentley Systems, Incorporated. All rights reserved.

import { GroupListResponse, GroupResponse } from "@bentley/itwin-saved-views-utilities";
import { GroupClient as IGroupClient, createGroup, getAllGroupArgs, singleGroupArgs, updateGroupArgs } from "../models/clientModels/GroupClientInterfaces";
import { commonClientArgs } from "../models/clientModels/CommonClientInterfaces";
import { HttpActions } from "../models/httpActionsAndStatus";
import { callITwinApi } from "../utils/apiUtils";

export class GroupClient implements IGroupClient {
  private readonly baseURL;
  private readonly getAccessToken: () => Promise<string>;

  constructor(args: commonClientArgs) {
    this.baseURL = `${args.baseURL}/groups`;
    this.getAccessToken = args.getAccessToken;
  }

  async getGroup(args: singleGroupArgs): Promise<GroupResponse> {
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

  async getAllGroups(args: getAllGroupArgs): Promise<GroupListResponse> {
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

  async createGroup(args: createGroup): Promise<GroupResponse> {
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

  async updateGroup(args: updateGroupArgs): Promise<GroupResponse> {
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

  async deleteGroup(args: singleGroupArgs): Promise<void> {
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
}
