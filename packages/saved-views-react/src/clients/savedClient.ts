// Copyright (c) Bentley Systems, Incorporated. All rights reserved.

import { CombinedId, SavedViewCreate, SavedViewListResponse, SavedViewResponse, SavedViewUpdate } from "@bentley/itwin-saved-views-utilities";
import { DeploymentRegions } from "./models/deploymentRegions";
import { sendRequest } from "./utils/apiUtils";
import { HttpActions } from "./models/httpActionsAndStatus";
import { preferOptions } from './models/prefer';
import { SaveViewsClient } from "./models/clientInterfaces";

export class SaveViewsClient implements SaveViewsClient {
  private readonly region: DeploymentRegions;
  private readonly serviceDomain = "api.bentley.com/savedviews";
  private readonly loggingCategory = "SaveViewsClient";

  constructor() {
    this.region = "dev"; // pull from env
  }

  async getSavedView(token: string, savedViewId: CombinedId, prefer?: preferOptions) {
    const domain = `${this.serviceDomain}/${savedViewId.combinedIdString}`;

    try {
      const resp = await sendRequest(domain, this.region, HttpActions.GET, token, undefined, prefer);
      return resp.body as SavedViewResponse;
    } catch (error) {
      console.error(`${this.loggingCategory} error: ${JSON.stringify(error)}`);
      return undefined;
    }
  }


  async getAllSavedViews(token: string, iTwinId: string, iModelId?: string, groupId?: string, top?: string, skip?: string, prefer?: preferOptions) {
    const iModelDomainParam = iModelId ? `&iModelId=${iModelId}` : "";
    const groupIdDomainParam = groupId ? `&groupId=${groupId}` : "";
    const topDomainParam = top ? `&$top=${top}` : "";
    const skipDomainParam = skip ? `&$skip=${skip}` : "";
    const domain = `${this.serviceDomain}/?iTwinId=${iTwinId}${iModelDomainParam}${groupIdDomainParam}${topDomainParam}${skipDomainParam}`;

    try {
      const resp = await sendRequest(domain, this.region, HttpActions.GET, token, undefined, prefer);
      return resp.body as SavedViewListResponse;
    } catch (error) {
      console.error(`${this.loggingCategory} error: ${JSON.stringify(error)}`);
      return undefined;
    }
  }

  async createSavedView(token: string, savedViewPayload: SavedViewCreate) {
    const domain = `${this.serviceDomain}/`;

    try {
      const resp = await sendRequest(domain, this.region, HttpActions.POST, token, savedViewPayload);
      return resp.body as SavedViewResponse;
    } catch (error) {
      console.error(`${this.loggingCategory} error: ${JSON.stringify(error)}`);
      return undefined;
    }
  }

  async updateSavedView(token: string, savedViewId: CombinedId, savedViewPayload: SavedViewUpdate) {
    const domain = `${this.serviceDomain}/${savedViewId.combinedIdString}`;

    try {
      const resp = await sendRequest(domain, this.region, HttpActions.PATCH, token, savedViewPayload);
      return resp.body as SavedViewResponse;
    } catch (error) {
      console.error(`${this.loggingCategory} error: ${JSON.stringify(error)}`);
      return undefined;
    }
  }

  async deleteSavedView(token: string, savedViewId: CombinedId) {
    const domain = `${this.serviceDomain}/${savedViewId.combinedIdString}`;

    try {
      await sendRequest(domain, this.region, HttpActions.GET, token);
    } catch (error) {
      console.error(`${this.loggingCategory} error: ${JSON.stringify(error)}`);
    }
  }

}
