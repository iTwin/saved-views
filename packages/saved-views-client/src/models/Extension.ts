/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { HalLinks } from "./Links.js";

export interface Extension {
  extensionName: string;
  markdownUrl: string;
  schemaUrl: string;
  data: string;
  _links: HalLinks<["savedView", "iTwin"?, "project"?, "prev"?, "iModel"?, "self"?]>;
}

export interface ExtensionSavedViewCreate {
  extensionName: string;
  data: string;
  markdownUrl?: string;
  schemaUrl?: string;
}

export interface ExtensionMin  {
  extensionName: string;
  href: string;
}

export interface ExtensionListItem {
  extensionName: string;
  href: string;
}
