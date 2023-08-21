/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

/**
 * Link properties.
 */
export interface Link {
  href: string;
}

/**
 * Resource links object
 */
export interface ResourceLinks {
  iTwin?: Link;
  project?: Link;
  imodel?: Link;
  creator: Link;
}
