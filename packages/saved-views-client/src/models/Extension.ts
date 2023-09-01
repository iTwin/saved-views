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
  _links: HalLinks<
    ["savedView", "ITwin"?, "project"?, "prev"?, "iModel"?, "self"?]
  >;
}

export interface ExtensionsResponse {
  href: string;
}

export interface ExtensionSavedViewCreate {
  extensionName: string;
  markdownUrl?: string;
  schemaUrl?: string;
  data: string;
}

export interface ExtensionMin  {
  href: string;
  extensionName: string;
}

export interface ExtensionListItem {
  href: string;
  extensionName: string;
}
