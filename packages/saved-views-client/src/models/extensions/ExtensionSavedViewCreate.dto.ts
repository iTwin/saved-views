/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { ExtensionBase } from "./Extension.dto";

/**
 * Extension data for savedViewCreate
 */
export interface ExtensionSavedViewCreate extends ExtensionBase {
  markdownUrl?: string;
  schemaUrl?: string;
  data: string;
}
