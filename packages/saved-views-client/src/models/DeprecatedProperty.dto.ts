/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

/**
 * DTO with deprecated properties, such as projectId.
 */
export interface DeprecatedProperty {
  /**
   *@deprecated Please start using iTwinId instead.
   */
  deprecated?: true;
  projectId?: string;
}
