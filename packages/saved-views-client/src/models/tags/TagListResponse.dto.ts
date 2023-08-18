// Copyright (c) Bentley Systems, Incorporated. All rights reserved.
import { Tag } from "./Tag.dto";
import { TagListLinks } from "./TagLinks.dto";

/**
 * Tag list response model for restful get all tags operations.
 */
export interface TagListResponse {
  tags: Tag[];
  _links: TagListLinks;
}
