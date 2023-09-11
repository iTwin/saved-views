/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { type IModelConnection } from "@itwin/core-frontend";

import { type Group, type GroupUpdate } from "../utilities/SavedViewTypes";

export interface IGroupClient {
  createGroup(iModelConnection: IModelConnection, group: Group): Promise<Group>;
  updateGroup(iModelConnection: IModelConnection, updatedGroup: GroupUpdate, oldGroup: Group): Promise<Group>;
  deleteGroup(iModelConnection: IModelConnection, group: Group): Promise<void>;
  shareGroup(iModelConnection: IModelConnection, group: Group, shared: boolean): Promise<Group>;
  getGroups(iModelConnection: IModelConnection): Promise<Group[]>;
  getGroup(id: string, projectId?: string, iModelId?: string | undefined): Promise<Group>;
}
