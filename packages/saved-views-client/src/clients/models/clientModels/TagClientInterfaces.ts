// Copyright (c) Bentley Systems, Incorporated. All rights reserved.

import { TagCreate } from "../../../models/tags/TagCreate.dto";
import { TagListResponse } from "../../../models/tags/TagListResponse.dto";
import { TagResponse } from "../../../models/tags/TagResponse.dto";
import { TagUpdate } from "../../../models/tags/TagUpdate.dto";
import { CommonRequestArgs } from "./CommonClientInterfaces";

export interface UpdateTagArgs extends SingleTagArgs {
  /** payload tag to update tag */
  tagPayload: TagUpdate;
}

export interface CreateTagArgs extends CommonRequestArgs {
  /** payload tag to create tag */
  tagPayload: TagCreate;
}

export interface SingleTagArgs extends CommonRequestArgs {
  /** tag id to query after */
  tagId: string;
}

export interface GetAllTagArgs extends CommonRequestArgs {
  /** iTwin id to query after */
  iTwinId: string;
  /** optional iModel id to query after */
  iModelId?: string;
}

export interface TagsClient {
  /** creates tag
   * @throws on non 2xx response
 */
  createTag(args: CreateTagArgs): Promise<TagResponse>;

  /** gets tag
   * @throws on non 2xx response
 */
  getTag(args: SingleTagArgs): Promise<TagResponse>;

  /** gets all Tags
   * @throws on non 2xx response
 */
  getAllTags(args: GetAllTagArgs): Promise<TagListResponse>;

  /**deletes Tag
   * @throws on non 2xx response
 */
  deleteTag(args: SingleTagArgs): Promise<void>;

  /** updates tag
   * @throws on non 2xx response
 */
  updateTag(args: UpdateTagArgs): Promise<TagResponse>;
}
