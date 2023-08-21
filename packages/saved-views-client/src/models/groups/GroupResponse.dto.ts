/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Group } from "./Group.dto";

/**
 * Group response model for restful get Group operations following APIM standards.
 */
export interface GroupResponse {
  group: Group;
}
