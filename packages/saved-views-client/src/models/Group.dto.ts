/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { DeprecatedProperty } from "./DeprecatedProperty.dto";
import { HalLinks } from "./Links.dto";
import { SharableMetadata } from "./SharableMetadata.dto";

/** Group model for restful get Group operations following APIM standards. */
export interface Group extends SharableMetadata {
  _links: HalLinks<["savedView", "iTwin"?, "project"?, "iModel"?, "creator"?]>;
}

/** Group Input model for update */
export interface GroupUpdate {
  displayName?: string;
  shared?: boolean;
}

/** Group response model for restful get Group operations following APIM standards. */
export interface GroupResponse {
  group: Group;
}

/** Group list response model for restful get all Groups operations. */
export interface GroupListResponse {
  groups: Group[];
  _links: HalLinks<["self"]>;
}

/** Group Input model for create */
export interface GroupCreate extends DeprecatedProperty {
  iTwinId?: string;
  iModelId?: string;
  displayName: string;
  shared?: boolean;
}
