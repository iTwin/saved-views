// Copyright (c) Bentley Systems, Incorporated. All rights reserved.

import { GroupResponse, GroupListResponse, GroupCreate, GroupUpdate } from "@itwin/itwin-saved-views-types";
import { CommonRequestArgs } from "./CommonClientInterfaces";

export interface SingleGroupArgs extends CommonRequestArgs {
  /** groupId id to query after */
  groupId: string;
}

export interface GetAllGroupArgs extends CommonRequestArgs {
  /** id that group belongs to */
  iTwinId: string;
  /** optional id that group belongs to*/
  iModelId?: string;
}

export interface CreateGroup extends CommonRequestArgs {
  /** group to create*/
  groupPayload: GroupCreate;
}

export interface UpdateGroupArgs extends SingleGroupArgs {
  /** group to be updated to*/
  groupPayload: GroupUpdate;
}

export interface GroupClient {
  /**
   * gets a group
   * @throws on non 2xx response
 */
  getGroup(args: SingleGroupArgs): Promise<GroupResponse>;

  /**
   * gets all groups
   * @throws on non 2xx response
 */
  getAllGroups(args: GetAllGroupArgs): Promise<GroupListResponse>;

  /**
   * Creates a group
   * @throws on non 2xx response
 */
  createGroup(args: CreateGroup): Promise<GroupResponse>;

  /**
   * updates a group
   * @throws on non 2xx response
 */
  updateGroup(args: UpdateGroupArgs): Promise<GroupResponse>;

  /**
   * deletes a group
   * @throws on non 2xx response
 */
  deleteGroup(args: SingleGroupArgs): Promise<void>;
}
