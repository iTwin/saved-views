// Copyright (c) Bentley Systems, Incorporated. All rights reserved.

import { CombinedId, ImageResponse, ImageUpdate } from "@bentley/itwin-saved-views-utilities";
import { DeploymentRegions } from "./models/deploymentRegions";
import { sendRequest } from "./utils/apiUtils";
import { HttpActions } from "./models/httpActionsAndStatus";
import { ImageSize } from "./models/imageSize";

export class ImageClient implements ImageClient {
  private readonly region: DeploymentRegions;
  private readonly serviceDomain = "api.bentley.com/savedviews";
  private readonly loggingCategory = "ImageClient";

  constructor() {
    this.region = "dev"; // pull from env
  }

  async getImage(token: string, saveViewId: CombinedId, size: ImageSize) {
    const domain = `${this.serviceDomain}/${saveViewId.combinedIdString}/image?size=${size}`;

    try {
      const resp = await sendRequest(domain, this.region, HttpActions.GET, token);
      return resp.body as ImageResponse;
    } catch (error) {
      console.error(`${this.loggingCategory} error: ${JSON.stringify(error)}`);
      return undefined;
    }
  }

  async updateImage(token: string, saveViewId: CombinedId, imagePayload: ImageUpdate) {
    const domain = `${this.serviceDomain}/${saveViewId.combinedIdString}/image`;

    try {
      const resp = await sendRequest(domain, this.region, HttpActions.PUT, token, imagePayload);
      return resp.body as ImageResponse;
    } catch (error) {
      console.error(`${this.loggingCategory} error: ${JSON.stringify(error)}`);
      return undefined;
    }
  }
}
