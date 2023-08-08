import { CombinedId, GroupResponse, GroupListResponse, GroupCreate, GroupUpdate } from "@bentley/itwin-saved-views-utilities";
import { commonRequestArgs } from "./commonClientInterfaces";

export interface singleGroupArgs extends commonRequestArgs {
  /** groupId id to query after */
  groupId: CombinedId;
}

export interface getAllGroupArgs extends commonRequestArgs {
  /** id that group belongs to */
  iTwinId: string;
  /** optional id that group belongs to*/
  iModelId?: string;
}

export interface createGroup extends commonRequestArgs {
  /** group to create*/
  groupPayload:GroupCreate;
}

export interface updateGroupArgs extends singleGroupArgs {
  /** group to be updated to*/
  groupPayload: GroupUpdate;
}

export interface GroupClient {
  /**
   * gets a group
   * @throws on non 2xx response
 */
  getGroup(args: singleGroupArgs): Promise<GroupResponse>;

  /**
   * gets all groups
   * @throws on non 2xx response
 */
  getAllGroups(args: getAllGroupArgs): Promise<GroupListResponse>;

  /**
   * Creates a group
   * @throws on non 2xx response
 */
  createGroup(args:createGroup): Promise<GroupResponse>;

  /**
   * updates a group
   * @throws on non 2xx response
 */
  updateGroup(args:updateGroupArgs): Promise<GroupResponse>;

  /**
   * deletes a group
   * @throws on non 2xx response
 */
  deleteGroup(args: singleGroupArgs): Promise<void>;
}
