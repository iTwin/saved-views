/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { CommonMetadata } from "./CommonMetadata.dto";
import { DeprecatedProperty } from "./DeprecatedProperty.dto";
import { HalLinks } from "./Links.dto";

/** Tag model which used in saved view. */
export interface SavedViewTag {
  id: string;
  displayName: string;
}

/** Tag Input model for create/update */
export interface TagUpdate {
  /** Tag Name. */
  displayName?: string;
}

/** Tag response model following APIM structure. */
export interface TagResponse {
  tag: Tag;
}

/** Tag list response model for restful get all tags operations. */
export interface TagListResponse {
  tags: Tag[];
  _links: HalLinks<["self"]>;
}

/** Tag Input model for create/update */
export interface TagCreate extends DeprecatedProperty {
  iTwinId?: string;
  iModelId?: string;
  /** Tag Name. */
  displayName: string;
}

/** Tag Metadata Input model for get */
export interface Tag extends CommonMetadata {
  _links: HalLinks<["savedView", "iTwin" ?, "project" ?, "iModel" ?, "creator" ?]>;
}
