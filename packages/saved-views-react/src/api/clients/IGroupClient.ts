/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { type IModelConnection } from "@itwin/core-frontend";

import { type Group, type GroupUpdate } from "../utilities/SavedViewTypes";

export interface IGroupClient {
  createGroup(
    iModelConnection: IModelConnection,
    group: Group,
    applicationIds?: string[]
  ): Promise<Group>;
  updateGroup(
    iModelConnection: IModelConnection,
    updatedGroup: GroupUpdate,
    oldGroup: Group,
    applicationIds?: string[]
  ): Promise<Group>;
  deleteGroup(
    iModelConnection: IModelConnection,
    group: Group,
    applicationIds?: string[]
  ): Promise<void>;
  shareGroup(
    iModelConnection: IModelConnection,
    group: Group,
    shared: boolean,
    applicationIds?: string[]
  ): Promise<Group>;
  getGroups(
    iModelConnection: IModelConnection,
    applicationIds?: string[]
  ): Promise<Group[]>;
  getGroup(
    id: string,
    projectId?: string,
    iModelId?: string | undefined
  ): Promise<Group>;
}
