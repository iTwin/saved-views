// Copyright (c) Bentley Systems, Incorporated. All rights reserved.

import { TagResponse } from "../../models/tags/TagResponse.dto";
import { TagsClient as ITagsClient, CreateTagArgs, GetAllTagArgs, SingleTagArgs, UpdateTagArgs } from "../models/clientModels/TagClientInterfaces";
import { CommonClientArgs } from "../models/clientModels/CommonClientInterfaces";
import { callITwinApi } from "../utils/apiUtils";
import { HttpActions } from "../models/HttpActionsAndStatus";
import { TagListResponse } from "../../models/tags/TagListResponse.dto";

export class TagsClient implements ITagsClient {

  private readonly baseURL;
  private readonly getAccessToken: () => Promise<string>;

  constructor(args: CommonClientArgs) {
    this.baseURL = `${args.baseURL}/tags`;
    this.getAccessToken = args.getAccessToken;
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

  async getAllTags(args: GetAllTagArgs): Promise<TagListResponse> {
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

}
