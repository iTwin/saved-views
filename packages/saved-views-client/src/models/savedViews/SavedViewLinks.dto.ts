/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Link, ResourceLinks } from "../Links.dto";

/**
 * Saved view links object
 */
export interface SavedViewLinks extends ResourceLinks {
  group?: Link;
  image: Link;
  thumbnail: Link;
}

/**
 * Saved view list links object
 */
export interface SavedViewListLinks {
  self: Link;
  prev?: Link;
  next?: Link;
}
