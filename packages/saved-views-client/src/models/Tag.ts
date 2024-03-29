/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { HalLinks } from "./Links.js";

/** Tag model which used in saved view. */
export interface SavedViewTag {
  id: string;
  displayName: string;
}

/** Tag Metadata Input model for get */
export interface Tag {
  id: string;
  displayName: string;
  _links: HalLinks<["iTwin"?, "project"?, "imodel"?, "creator"?]>;
}
