/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { ExtensionLinks } from "./ExtensionLinks.dto";

/**
 * Extension metadata model for restful get extension operations following Apim standards.
 */
export interface Extension extends ExtensionBase {
  markdownUrl: string;
  schemaUrl: string;
  data: string;
  _links: ExtensionLinks;
}

export interface ExtensionBase {
  extensionName: string;
}
