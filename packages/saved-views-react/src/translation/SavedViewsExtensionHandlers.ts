/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  EmphasizeElements,
  PerModelCategoryVisibility,
  type Viewport,
} from "@itwin/core-frontend";

import {
  extractEmphasizeElements,
  extractPerModelCategoryVisibility,
} from "./extensionExtractor.js";
import type { PerModelCategoryVisibilityProps } from "./SavedViewTypes.js";

export interface ExtensionHandler {
  extensionName: string;
  apply: (extensionData: string, viewport: Viewport) => void;
  reset: (viewport: Viewport) => void;
  capture: (viewport: Viewport) => string | undefined;
}

export interface DefaultExtensionHandlersApplyOverrides {
  emphasizeElements?: Partial<Pick<ExtensionHandler, "apply" | "reset" >>;
  perModelCategoryVisibility?: Partial<Pick<ExtensionHandler, "apply" | "reset" >>;
}

export interface DefaultExtensionHandlersCaptureOverrides {
  emphasizeElements?: Partial<Pick<ExtensionHandler, "capture">>;
  perModelCategoryVisibility?: Partial<Pick<ExtensionHandler, "capture">>;
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
    capture: (viewport) => {
      const emphasizeElementsProps = EmphasizeElements.get(viewport)?.toJSON(viewport);
      return emphasizeElementsProps ? JSON.stringify({ emphasizeElementsProps }) : undefined;
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
    capture: (viewport) => {
      if (!viewport.view.isSpatialView()) {
        return undefined;
      }

      const props: PerModelCategoryVisibilityProps[] = [];
      for (const { modelId, categoryId, visible } of viewport.perModelCategoryVisibility) {
        props.push({ modelId, categoryId, visible });
      }

      return props.length > 0 ? JSON.stringify({ perModelCategoryVisibilityProps: props }) : undefined;
    },
  } satisfies ExtensionHandler,
};
