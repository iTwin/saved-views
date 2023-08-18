// Copyright (c) Bentley Systems, Incorporated. All rights reserved.
import { Extension } from "../extensions/Extension.dto";
import { ExtensionMin } from "../extensions/ExtensionMin.dto";
import { SharableMetadata } from "../SharableMetadata.dto";
import { SavedViewTag } from "../tags/SavedViewTag.dto";
import { SavedViewLinks } from "./SavedViewLinks.dto";

/**
 * Saved view metadata model for restful get saved view operations following Apim standards.
 */
export interface SavedView extends SharableMetadata {
  tags?: SavedViewTag[];
  extensions?: Extension[] | ExtensionMin[];
  category?: string;
  _links: SavedViewLinks;
}
