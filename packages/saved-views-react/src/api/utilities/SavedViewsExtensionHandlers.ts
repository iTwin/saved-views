// Copyright (c) Bentley Systems, Incorporated. All rights reserved.
import { type Viewport } from "@itwin/core-frontend";

import { type SavedViewBase, type SavedViewBaseUpdate } from "./SavedViewTypes";

export interface ExtensionHandler {
  extensionName: string;
  onViewApply: (extensionData: string, vp: Viewport) => Promise<void>;
  onViewSave: (savedView: SavedViewBase) => Promise<void>;
  onViewUpdate: (newSavedView: SavedViewBaseUpdate, oldSavedView: SavedViewBase) => Promise<void>;
}
