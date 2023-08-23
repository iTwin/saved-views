/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Extension, ExtensionMin } from "../Extension.dto";
import { SharableMetadata } from "../SharableMetadata.dto";
import { SavedViewTag } from "../Tag.dto";
import { SavedViewLinks } from "./SavedViewLinks.dto";

/** Saved view metadata model for restful get saved view operations following Apim standards. */
export interface SavedView extends SharableMetadata {
  tags?: SavedViewTag[];
  extensions?: Extension[] | ExtensionMin[];
  category?: string;
  _links: SavedViewLinks;
}
