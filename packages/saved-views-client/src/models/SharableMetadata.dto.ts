/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { CommonMetadata } from "./CommonMetadata.dto";

/** Shared property, common to saved view and group. */
export interface SharableMetadata extends CommonMetadata {
  shared: boolean;
}
