// Copyright (c) Bentley Systems, Incorporated. All rights reserved.

import { ImageResponse } from "../../../models/images/ImageResponse.dto";
import { ImageUpdate } from "../../../models/images/ImageUpdate.dto";
import { ImageSize } from "../ImageSize";
import { CommonRequestArgs } from "./CommonClientInterfaces";

export interface CommonImageArgs extends CommonRequestArgs {
  /** savedViewId id to query after */
  savedViewId: string;
}

export interface GetImageArgs extends CommonImageArgs {
  /** size size of the image */
  size: ImageSize;
}

export interface UpdateImageArgs extends CommonImageArgs {
  /** payload to update image with */
  imagePayload: ImageUpdate;
}


export interface ImageClient {
  /**
   * gets a image
   * @throws on non 2xx response
 */
  getImage(args: GetImageArgs): Promise<ImageResponse>;

  /**
   * updates a image
   * @throws on non 2xx response
 */
  updateImage(args: UpdateImageArgs): Promise<ImageResponse>;
}
