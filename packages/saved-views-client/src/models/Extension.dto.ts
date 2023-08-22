/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Link } from "./Links.dto";

/**
 * Extension metadata model for restful get extension operations following Apim standards.
 */
export interface Extension extends ExtensionBase {
  markdownUrl: string;
  schemaUrl: string;
  data: string;
  _links: ExtensionLinks;
}

export interface ExtensionBase {
  extensionName: string;
}

/**
 * Extensions Input Model for create/update
 */
export interface ExtensionsUpdate {
  extensionName: string;
  data: string;
}

/**
 * Extensions metadata model for restful get Extensions operation.
 */
export type ExtensionsResponse = Link;

/**
 * Extension data for savedViewCreate
 */
export interface ExtensionSavedViewCreate extends ExtensionBase {
  markdownUrl?: string;
  schemaUrl?: string;
  data: string;
}

/**
 * Extension response model following APIM structure.
 */
export interface ExtensionResponse {
  extension: Extension;
}

/**
 * Extension metadata model for restful get extension operations following Apim standards.
 */
export interface ExtensionMin extends Link, ExtensionBase { }

/**
 * Extension list response model for restful get all Extensions operations.
 */
export interface ExtensionListResponse {
  extensions: ExtensionListItem[];
}

/**
 * Saved view metadata model for restful get saved view operations following Apim standards.
 */
export interface ExtensionListItem extends Link {
  extensionName: string;
}

/**
 * Extension links object
 */
export interface ExtensionLinks {
  iTwin?: Link;
  project?: Link;
  imodel?: Link;
  savedView: Link;
  self?: Link;
}
