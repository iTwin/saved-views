/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Group } from "./Group.dto";
import { GroupListLinks } from "./GroupLinks.dto";

/**
 * Group list response model for restful get all Groups operations.
 */
export interface GroupListResponse {
  groups: Group[];
  _links: GroupListLinks;
}
