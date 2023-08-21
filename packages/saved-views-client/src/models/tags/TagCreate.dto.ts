/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { DeprecatedProperty } from "../DeprecatedProperty.dto";

/**
 * Tag Input model for create/update
 */
export interface TagCreate extends DeprecatedProperty {
  iTwinId?: string;
  iModelId?: string;
  /**
   * Tag Name.
   */
  displayName: string;
}
