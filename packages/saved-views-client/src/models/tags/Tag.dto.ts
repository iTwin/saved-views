// Copyright (c) Bentley Systems, Incorporated. All rights reserved.
import { CommonMetadata } from "../CommonMetadata.dto";
import { TagLinks } from "./TagLinks.dto";

/**
 * Tag Metadata Input model for get
 */
export interface Tag extends CommonMetadata {
  _links: TagLinks;
}
