/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Tag } from "./Tag.dto";

/**
 * Tag response model following APIM structure.
 */
export interface TagResponse {
  tag: Tag;
}
