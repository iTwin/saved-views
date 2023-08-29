/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { SharableMetadata } from "./CommonMetadata.js";
import { HalLinks } from "./Links.js";

/** Group model for restful get Group operations following APIM standards. */
export interface Group extends SharableMetadata {
  _links: HalLinks<["savedView", "iTwin"?, "project"?, "iModel"?, "creator"?]>;
}
