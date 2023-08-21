/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { DeprecatedProperty } from "../DeprecatedProperty.dto";

/**
 * Group Input model for create
 */
export interface GroupCreate extends DeprecatedProperty {
  iTwinId?: string;
  iModelId?: string;
  displayName: string;
  shared?: boolean;
}
