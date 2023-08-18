// Copyright (c) Bentley Systems, Incorporated. All rights reserved.

import { GroupResponse } from "../../models/groups/GroupResponse.dto";
import { GroupClient as IGroupClient, CreateGroup, GetAllGroupArgs, SingleGroupArgs, UpdateGroupArgs } from "../models/clientModels/GroupClientInterfaces";
import { CommonClientArgs } from "../models/clientModels/CommonClientInterfaces";
import { HttpActions } from "../models/HttpActionsAndStatus";
import { callITwinApi } from "../utils/apiUtils";
import { GroupListResponse } from "../../models/groups/GroupListResponse.dto";

export class GroupClient implements IGroupClient {
  private readonly baseURL;
  private readonly getAccessToken: () => Promise<string>;

  constructor(args: CommonClientArgs) {
    this.baseURL = `${args.baseURL}/groups`;
    this.getAccessToken = args.getAccessToken;
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

  async getAllGroups(args: GetAllGroupArgs): Promise<GroupListResponse> {
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
}
