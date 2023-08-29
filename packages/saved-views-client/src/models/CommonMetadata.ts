/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

/** Shared property, common to saved view and group. */
export interface SharableMetadata extends CommonMetadata {
  shared: boolean;
}

/** Common properties between saved view, tag, group. */
export interface CommonMetadata {
  id: string;
  displayName: string;
}
