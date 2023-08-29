/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { CommonMetadata } from "./CommonMetadata";
import { HalLinks } from "./Links";

/** Tag model which used in saved view. */
export interface SavedViewTag {
  id: string;
  displayName: string;
}

/** Tag Metadata Input model for get */
export interface Tag extends CommonMetadata {
  _links: HalLinks<["savedView", "iTwin"?, "project"?, "iModel"?, "creator"?]>;
}
