/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Link, ResourceLinks } from "../Links.dto";

/**
 * Tag links object
 */
export type TagLinks = ResourceLinks;

/**
 * Tag list links object
 */
export interface TagListLinks {
  self: Link;
}
