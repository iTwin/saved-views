/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { EmphasizeElements, PerModelCategoryVisibility, type Viewport } from "@itwin/core-frontend";

import { extractEmphasizeElements, extractPerModelCategoryVisibility } from "./extensionExtractor.js";

export interface ExtensionHandler {
  extensionName: string;
  apply: (extensionData: string, viewport: Viewport) => void;
  reset: (viewport: Viewport) => void;
}

export const extensionHandlers = {
  emphasizeElements: {
    extensionName: "EmphasizeElements",
    apply: (extensionData, viewport) => {
      if (extensionData) {
        const props = extractEmphasizeElements(extensionData);
        if (props !== undefined) {
          EmphasizeElements.getOrCreate(viewport).fromJSON(props, viewport);
        }
      }
    },
    reset: (viewport) => {
      if (EmphasizeElements.get(viewport)) {
        EmphasizeElements.clear(viewport);
        viewport.isFadeOutActive = false;
      }
    },
  } satisfies ExtensionHandler,
  perModelCategoryVisibility: {
    extensionName: "PerModelCategoryVisibility",
    apply: (extensionData, viewport) => {
      const props = extractPerModelCategoryVisibility(extensionData) ?? [];
      for (const override of props) {
        viewport.perModelCategoryVisibility.setOverride(
          override.modelId,
          override.categoryId,
          override.visible
            ? PerModelCategoryVisibility.Override.Show
            : PerModelCategoryVisibility.Override.Hide,
        );
      }
    },
    reset: (viewport) => {
      viewport.perModelCategoryVisibility.clearOverrides();
    },
  } satisfies ExtensionHandler,
};
