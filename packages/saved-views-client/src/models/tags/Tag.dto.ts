/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { CommonMetadata } from "../CommonMetadata.dto";
import { TagLinks } from "./TagLinks.dto";

/**
 * Tag Metadata Input model for get
 */
export interface Tag extends CommonMetadata {
  _links: TagLinks;
}
