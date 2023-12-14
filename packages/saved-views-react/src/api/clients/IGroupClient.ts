/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { type IModelConnection } from "@itwin/core-frontend";

import { type LegacyGroup, type GroupUpdate } from "../utilities/SavedViewTypes";

export interface IGroupClient {
  createGroup(iModelConnection: IModelConnection, group: LegacyGroup): Promise<LegacyGroup>;
  updateGroup(iModelConnection: IModelConnection, updatedGroup: GroupUpdate, oldGroup: LegacyGroup): Promise<LegacyGroup>;
  deleteGroup(iModelConnection: IModelConnection, group: LegacyGroup): Promise<void>;
  shareGroup(iModelConnection: IModelConnection, group: LegacyGroup, shared: boolean): Promise<LegacyGroup>;
  getGroups(iModelConnection: IModelConnection): Promise<LegacyGroup[]>;
  getGroup(id: string, projectId?: string, iModelId?: string | undefined): Promise<LegacyGroup>;
}
