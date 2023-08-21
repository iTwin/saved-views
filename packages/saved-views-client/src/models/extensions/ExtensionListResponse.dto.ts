/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { ExtensionListItem } from "./ExtensionListItem.dto";

/**
 * Extension list response model for restful get all Extensions operations.
 */
export interface ExtensionListResponse {
  extensions: ExtensionListItem[];
}
