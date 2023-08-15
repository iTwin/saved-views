// Copyright (c) Bentley Systems, Incorporated. All rights reserved.

import { ImageResponse } from "@bentley/itwin-saved-views-utilities";
import { callITwinApi } from "../utils/apiUtils";
import { HttpActions } from "../models/httpActionsAndStatus";
import { commonClientArgs } from "../models/clientModels/commonClientInterfaces";
import { ImageClient as iImageClient, getImageArgs, updateImageArgs } from "../models/clientModels/imageClientInterfaces";

export class ImageClient implements iImageClient {
  private readonly baseURL;
  private readonly getAccessToken: () => Promise<string>;

  constructor(args: commonClientArgs) {
    this.baseURL = args.baseURL;
    this.getAccessToken = args.getAccessToken;
  }

  async getImage(args: getImageArgs): Promise<ImageResponse> {
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

  async updateImage(args: updateImageArgs): Promise<ImageResponse> {
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
      body: args.imagePayload
    });
    return resp as unknown as ImageResponse;
  }

}
