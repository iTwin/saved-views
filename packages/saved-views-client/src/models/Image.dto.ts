/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { HalLinks } from "./Links.dto";

/** Image metadata model for restful get Image operation. */
export type ImageResponse = HalLinks<["href"]>;

/** Image Input model for create/update */
export interface ImageUpdate {
  /** Base 64 encoded image string. */
  image: string;
}
