// Copyright (c) Bentley Systems, Incorporated. All rights reserved.

import { CombinedId, TagCreate, TagListResponse, TagResponse, TagUpdate } from "@bentley/itwin-saved-views-utilities";
import { DeploymentRegions } from "./models/deploymentRegions";
import { sendRequest } from "./utils/apiUtils";
import { HttpActions } from "./models/httpActionsAndStatus";
import { TagsClient } from "./models/clientInterfaces";

export class TagsClient implements TagsClient {
  private readonly region: DeploymentRegions;
  private readonly serviceDomain = "api.bentley.com/savedviews/tags";
  private readonly loggingCategory = "ExtensionsClient";

  constructor() {
    this.region = "dev"; // pull from env
  }

  async createTag(token: string, tagPayload: TagCreate) {

    try {
      const resp = await sendRequest(this.serviceDomain, this.region, HttpActions.PUT, token, tagPayload);
      return resp.body as TagResponse;
    } catch (error) {
      console.error(`${this.loggingCategory} error: ${JSON.stringify(error)}`);
      return undefined;
    }
  }

  async getTag(token: string, tagId: CombinedId) {
    const domain = `${this.serviceDomain}/${tagId.combinedIdString}`;

    try {
      const resp = await sendRequest(domain, this.region, HttpActions.GET, token);
      return resp.body as TagResponse;
    } catch (error) {
      console.error(`${this.loggingCategory} error: ${JSON.stringify(error)}`);
      return undefined;
    }
  }

  async getAllTags(token: string, iTwinId: string, iModelId?: string) {
    const iModelDomainParam = iModelId ? `&iModelId=${iModelId}` : "";
    const domain = `${this.serviceDomain}?iTwinId=${iTwinId}${iModelDomainParam}`;

    try {
      const resp = await sendRequest(domain, this.region, HttpActions.GET, token);
      return resp.body as TagListResponse;
    } catch (error) {
      console.error(`${this.loggingCategory} error: ${JSON.stringify(error)}`);
      return undefined;
    }
  }

  async deleteTag(token: string, tagId: CombinedId) {
    const domain = `${this.serviceDomain}/${tagId.combinedIdString}`;

    try {
      await sendRequest(domain, this.region, HttpActions.DELETE, token);
    } catch (error) {
      console.error(`${this.loggingCategory} error: ${JSON.stringify(error)}`);
    }
  }

  async updateTag(token: string, tagId: CombinedId, tagPayload: TagUpdate) {
    const domain = `${this.serviceDomain}/${tagId.combinedIdString}`;

    try {
      const resp = await sendRequest(domain, this.region, HttpActions.PATCH, token, tagPayload);
      return resp.body as TagResponse;
    } catch (error) {
      console.error(`${this.loggingCategory} error: ${JSON.stringify(error)}`);
      return undefined;
    }
  }


}
