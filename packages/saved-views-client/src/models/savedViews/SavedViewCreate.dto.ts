/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import { DeprecatedProperty } from "../DeprecatedProperty.dto";
import { ExtensionSavedViewCreate } from "../extensions/ExtensionSavedViewCreate.dto";
import { View } from "./View.dto";

/**
 * Saved View Create for both 3D and 2D.
 */
export interface SavedViewCreate extends DeprecatedProperty {
  iTwinId?: string;
  iModelId?: string;
  id?: string;
  savedViewData: View;
  groupId?: string;
  category?: string;
  displayName: string;
  shared?: boolean;
  tagIds?: string[];
  extensions?: ExtensionSavedViewCreate[];
}
