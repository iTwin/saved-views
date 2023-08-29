/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { HalLinks } from "./Links.dto.js";

/** Extension metadata model for restful get extension operations following Apim standards. */
export interface Extension extends ExtensionBase {
  markdownUrl: string;
  schemaUrl: string;
  data: string;
  _links: HalLinks<["savedView", "iTwin"?, "project"?, "prev"?, "iModel"?, "self"?]>;
}

export interface ExtensionBase {
  extensionName: string;
}

/** Extensions metadata model for restful get Extensions operation. */
export type ExtensionsResponse = HalLinks<["href"]>;

/** Extension data for savedViewCreate */
export interface ExtensionSavedViewCreate extends ExtensionBase {
  markdownUrl?: string;
  schemaUrl?: string;
  data: string;
}

/** Extension metadata model for restful get extension operations following Apim standards. */
export interface ExtensionMin extends HalLinks<["href"]>, ExtensionBase { }

/** Saved view metadata model for restful get saved view operations following Apim standards. */
export interface ExtensionListItem extends HalLinks<["href"]> {
  extensionName: string;
}
