// Copyright (c) Bentley Systems, Incorporated. All rights reserved.

import { ImageSize } from "../imageSize";
import { commonRequestArgs } from "./commonClientInterfaces";
import { CombinedId, ImageResponse, ImageUpdate } from "@bentley/itwin-saved-views-utilities";


export interface commonImageArgs extends commonRequestArgs {
  /** savedViewId id to query after */
  savedViewId: string;
}

export interface getImageArgs extends commonImageArgs {
  /** size size of the image */
  size: ImageSize;
}

export interface updateImageArgs extends commonImageArgs {
  /** payload to update image with */
  imagePayload: ImageUpdate;
}


export interface ImageClient {
  /**
   * gets a image
   * @throws on non 2xx response
 */
  getImage(args: getImageArgs): Promise<ImageResponse>;

  /**
   * updates a image
   * @throws on non 2xx response
 */
  updateImage(args: updateImageArgs): Promise<ImageResponse>;
}
