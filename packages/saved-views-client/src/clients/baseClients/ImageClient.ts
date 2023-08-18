// Copyright (c) Bentley Systems, Incorporated. All rights reserved.

import { ImageResponse } from "../../models/images/ImageResponse.dto";
import { callITwinApi } from "../utils/apiUtils";
import { HttpActions } from "../models/HttpActionsAndStatus";
import { CommonClientArgs } from "../models/clientModels/CommonClientInterfaces";
import { ImageClient as iImageClient, GetImageArgs, UpdateImageArgs } from "../models/clientModels/ImageClientInterfaces";

export class ImageClient implements iImageClient {
  private readonly baseURL;
  private readonly getAccessToken: () => Promise<string>;

  constructor(args: CommonClientArgs) {
    this.baseURL = args.baseURL;
    this.getAccessToken = args.getAccessToken;
  }

  async getImage(args: GetImageArgs): Promise<ImageResponse> {
    const url = `${this.baseURL}/${args.savedViewId}/image?size=${args.size}`;

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
    return resp as unknown as ImageResponse;
  }

  async updateImage(args: UpdateImageArgs): Promise<ImageResponse> {
    const url = `${this.baseURL}/${args.savedViewId}/image`;

    const resp = await callITwinApi({
      url: url,
      method: HttpActions.PUT,
      getAccessToken: this.getAccessToken,
      signal: args.signal,
      headers: {
        Accept: "application/vnd.bentley.itwin-platform.v1+json",
        ...args.headers,
      },
      body: args.imagePayload,
    });
    return resp as unknown as ImageResponse;
  }

}
