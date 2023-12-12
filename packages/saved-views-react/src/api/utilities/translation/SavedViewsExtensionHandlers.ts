/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { type EmphasizeElementsProps } from "@itwin/core-common";
import {
  EmphasizeElements, PerModelCategoryVisibility,
  type Viewport,
} from "@itwin/core-frontend";

import {
  ModelCategoryOverrideProvider,
} from "../../../ui/viewlist/ModelCategoryOverrideProvider.js";
import {
  extractEmphasizeElements, extractPerModelCategoryVisibility, extractVisibilityOverride,
} from "./extensionExtractor";

export interface ExtensionHandler {
  extensionName: string;
  onViewApply: (extensionData: string, vp: Viewport) => Promise<void>;
}

/**
 * Collection of default extension handlers
 */
export class SavedViewsExtensionHandlers {
  public static EmphasizeElements: ExtensionHandler = {
    extensionName: "EmphasizeElements",
    onViewApply: async (extensionData: string, vp: Viewport) => {
      if (extensionData) {
        const props: EmphasizeElementsProps | undefined =
          extractEmphasizeElements(extensionData);
        if (props !== undefined) {
          EmphasizeElements.getOrCreate(vp).fromJSON(props, vp);
        }
      }
    },
  };

  public static PerModelCategoryVisibility: ExtensionHandler = {
    extensionName: "PerModelCategoryVisibility",
    onViewApply: async (extensionData: string, vp: Viewport) => {
      const props = extractPerModelCategoryVisibility(extensionData) ?? [];
      vp.perModelCategoryVisibility.clearOverrides();
      for (const override of props) {
        vp.perModelCategoryVisibility.setOverride(
          override.modelId,
          override.categoryId,
          override.visible
            ? PerModelCategoryVisibility.Override.Show
            : PerModelCategoryVisibility.Override.Hide,
        );
      }
    },
  };

  public static VisibilityOverride: ExtensionHandler = {
    extensionName: "VisibilityOverride",
    onViewApply: async (extensionData: string, vp: Viewport) => {
      if (extensionData) {
        const props = extractVisibilityOverride(extensionData);
        if (props !== undefined) {
          ModelCategoryOverrideProvider.getOrCreate(vp).fromJSON(props);
        }
      }
    },
  };
}
