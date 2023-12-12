/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { type Viewport } from "@itwin/core-frontend";

import { type LegacySavedViewBase, type SavedViewBaseUpdate } from "./SavedViewTypes";

export interface ExtensionHandler {
  extensionName: string;
  onViewApply: (extensionData: string, vp: Viewport) => Promise<void>;
  onViewSave: (savedView: LegacySavedViewBase) => Promise<void>;
  onViewUpdate: (newSavedView: SavedViewBaseUpdate, oldSavedView: LegacySavedViewBase) => Promise<void>;
}
