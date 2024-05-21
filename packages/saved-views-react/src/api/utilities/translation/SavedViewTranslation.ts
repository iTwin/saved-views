/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { EmphasizeElements, type Viewport } from "@itwin/core-frontend";

import type { SavedView } from "../../../SavedView.js";
import { SavedViewsExtensionHandlers } from "./SavedViewsExtensionHandlers.js";

/** Apply extension data (overrides) onto the supplied viewport. Only works with legacy-formatted extension data. */
export async function applyExtensionsToViewport(viewport: Viewport, savedView: SavedView): Promise<void> {
  // Clear the current if there's any (this should always happen, even if there are no extensions)
  if (EmphasizeElements.get(viewport)) {
    EmphasizeElements.clear(viewport);
    viewport.isFadeOutActive = false;
  }

  const defaultHandlers = [
    SavedViewsExtensionHandlers.EmphasizeElements,
    SavedViewsExtensionHandlers.PerModelCategoryVisibility,
    SavedViewsExtensionHandlers.VisibilityOverride,
  ];

  for (const extHandler of defaultHandlers) {
    const extData = savedView.extensions?.get(extHandler.extensionName);
    if (extData) {
      await extHandler.onViewApply(extData, viewport);
    }
  }
}
