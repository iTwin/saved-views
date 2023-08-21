/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Extension } from "./Extension.dto";

/**
 * Extension response model following APIM structure.
 */
export interface ExtensionResponse {
  extension: Extension;
}
