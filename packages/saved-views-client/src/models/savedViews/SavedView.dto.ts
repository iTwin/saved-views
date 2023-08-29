/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Extension, ExtensionMin } from "../Extension.dto.js";
import { HalLinks } from "../Links.dto.js";
import { SharableMetadata } from "../SharableMetadata.dto.js";
import { SavedViewTag } from "../Tag.dto.js";

/** Saved view metadata model for restful get saved view operations following Apim standards. */
export interface SavedView extends SharableMetadata {
  tags?: SavedViewTag[];
  extensions?: Extension[] | ExtensionMin[];
  category?: string;
  _links: HalLinks<["savedView","image","thumbnail", "iTwin"?, "project"?, "iModel"?, "creator"?,"group"?]>;
}
