/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { ExtensionMin } from "../Extension.dto";
import { View } from "./View.dto";

/** Saved View for both 3D and 2D. */
export interface SavedViewUpdate {
  savedViewData?: View;
  groupId?: string;
  displayName?: string;
  shared?: boolean;
  tagIds?: string[];
  extensions?: ExtensionMin[];
  category?: string;
}
