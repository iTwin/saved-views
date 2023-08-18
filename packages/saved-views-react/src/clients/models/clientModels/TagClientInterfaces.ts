// Copyright (c) Bentley Systems, Incorporated. All rights reserved.

import { TagCreate, TagListResponse, TagResponse, TagUpdate } from "@itwin/itwin-saved-views-types";
import { CommonRequestArgs } from "./CommonClientInterfaces";

export interface UpdateTagArgs extends singleTagArgs {
  /** payload tag to update tag */
  tagPayload: TagUpdate;
}

export interface createTagArgs extends CommonRequestArgs {
  /** payload tag to create tag */
  tagPayload: TagCreate;
}

export interface singleTagArgs extends CommonRequestArgs {
  /** tag id to query after */
  tagId: string;
}

export interface getAllTagArgs extends CommonRequestArgs {
  /** iTwin id to query after */
  iTwinId: string;
  /** optional iModel id to query after */
  iModelId?: string;
}

export interface TagsClient {
  /** creates tag
   * @throws on non 2xx response
 */
  createTag(args: createTagArgs): Promise<TagResponse>;

  /** gets tag
   * @throws on non 2xx response
 */
  getTag(args: singleTagArgs): Promise<TagResponse>;

  /** gets all Tags
   * @throws on non 2xx response
 */
  getAllTags(args: getAllTagArgs): Promise<TagListResponse>;

  /**deletes Tag
   * @throws on non 2xx response
 */
  deleteTag(args: singleTagArgs): Promise<void>;

  /** updates tag
   * @throws on non 2xx response
 */
  updateTag(args: UpdateTagArgs): Promise<TagResponse>;
}
