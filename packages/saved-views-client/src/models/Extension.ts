/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { HalLinks } from "./Links.js";

export interface Extension extends ExtensionBase {
  markdownUrl: string;
  schemaUrl: string;
  data: string;
  _links: HalLinks<["savedView", "iTwin"?, "project"?, "prev"?, "iModel"?, "self"?]>;
}

export interface ExtensionBase {
  extensionName: string;
}

export type ExtensionsResponse = HalLinks<["href"]>;

export interface ExtensionSavedViewCreate extends ExtensionBase {
  markdownUrl?: string;
  schemaUrl?: string;
  data: string;
}

export interface ExtensionMin extends HalLinks<["href"]>, ExtensionBase { }

export interface ExtensionListItem extends HalLinks<["href"]> {
  extensionName: string;
}
