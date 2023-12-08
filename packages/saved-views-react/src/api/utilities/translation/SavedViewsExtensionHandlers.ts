// Copyright (c) Bentley Systems, Incorporated. All rights reserved.
// import { ModelCategoryOverrideProvider } from "@bentley/itwin-tools";
// import { request } from "@bentley/wsg-client";
import { type EmphasizeElementsProps } from "@itwin/core-common";
import {
  type Viewport,
  EmphasizeElements,
  PerModelCategoryVisibility,
} from "@itwin/core-frontend";

// import { createRequestOptions } from "../ApiUtils";
// import { isSavedView3d } from "../clients/ISavedViewsClient";
// import { HttpActions } from "../HttpActions";
// import { HttpStatus } from "../HttpStatus";
import {
  extractEmphasizeElements,
  extractPerModelCategoryVisibility,
  extractVisibilityOverride,
} from "./extensionExtractor";
// import { SavedViewBase, SavedViewBaseUpdate } from "../SavedViewTypes.js";
import { ModelCategoryOverrideProvider } from "../../../ui/viewlist/ModelCategoryOverrideProvider.js";
// import { type SavedViewBase, type SavedViewBaseUpdate } from "./SavedViewTypes";

export interface ExtensionHandler {
  extensionName: string;
  onViewApply: (extensionData: string, vp: Viewport) => Promise<void>;
  // onViewSave: (savedView: SavedViewBase) => Promise<void>;
  // onViewUpdate: (
  //   newSavedView: SavedViewBaseUpdate,
  //   oldSavedView: SavedViewBase
  // ) => Promise<void>;
}

/**
 * Collection of default extension handlers
 */
export class SavedViewsExtensionHandlers {
  // public static addExtensions = async (
  //   savedViewId: string,
  //   extensionName: string,
  //   data: string
  // ) => {
  //   const extUrl = `https://${
  //     process.env.IMJS_URL_PREFIX ?? ""
  //   }api.bentley.com/savedviews/${savedViewId}/extensions`;
  //   const extOptions = await createRequestOptions(HttpActions.PUT, {
  //     extensionName,
  //     data,
  //   });
  //   try {
  //     const resp = await request(extUrl, extOptions);
  //     if (resp.status === HttpStatus.SUCCESS_CREATED) {
  //       return;
  //     }
  //     throw new Error(`Could create extension ${extensionName}`);
  //   } catch (error) {
  //     throw new Error(`Could create extension ${extensionName}`);
  //   }
  // };

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
    // onViewSave: async (savedView: SavedViewBase) => {
    //   if (savedView.emphasizeElementsProps !== undefined) {
    //     await SavedViewsExtensionHandlers.addExtensions(
    //       savedView.id,
    //       "EmphasizeElements",
    //       JSON.stringify({
    //         emphasizeElementsProps: savedView.emphasizeElementsProps,
    //       })
    //     );
    //   }
    // },
    // onViewUpdate: async (
    //   newSavedView: SavedViewBaseUpdate,
    //   oldSavedView: SavedViewBase
    // ) => {
    //   const data = JSON.stringify({
    //     emphasizeElementsProps: newSavedView.emphasizeElementsProps ?? {},
    //   });
    //   if (data !== oldSavedView.extensions?.get("EmphasizeElements")) {
    //     await SavedViewsExtensionHandlers.addExtensions(
    //       newSavedView.id,
    //       "EmphasizeElements",
    //       data
    //     );
    //   }
    // },
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
    // onViewSave: async (savedView: SavedViewBase) => {
    //   if (
    //     isSavedView3d(savedView) &&
    //     (savedView as any).perModelCategoryVisibility !== undefined
    //   ) {
    //     await SavedViewsExtensionHandlers.addExtensions(
    //       savedView.id,
    //       "PerModelCategoryVisibility",
    //       JSON.stringify({
    //         perModelCategoryVisibilityProps:
    //           savedView.perModelCategoryVisibility,
    //       })
    //     );
    //   }
    // },
    // onViewUpdate: async (
    //   newSavedView: SavedViewBaseUpdate,
    //   oldSavedView: SavedViewBase
    // ) => {
    //   if (isSavedView3d(newSavedView)) {
    //     const data = JSON.stringify({
    //       perModelCategoryVisibilityProps:
    //         newSavedView.perModelCategoryVisibility ?? [],
    //     });
    //     if (
    //       data !== oldSavedView.extensions?.get("PerModelCategoryVisibility")
    //     ) {
    //       await SavedViewsExtensionHandlers.addExtensions(
    //         newSavedView.id,
    //         "PerModelCategoryVisibility",
    //         data
    //       );
    //     }
    //   }
    // },
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
    // onViewSave: async (savedView: SavedViewBase) => {
    //   if (savedView.visibilityOverrideProps !== undefined) {
    //     await SavedViewsExtensionHandlers.addExtensions(
    //       savedView.id,
    //       "VisibilityOverride",
    //       JSON.stringify({
    //         visibilityOverrideProps: savedView.visibilityOverrideProps,
    //       })
    //     );
    //   }
    // },
    // onViewUpdate: async (
    //   newSavedView: SavedViewBaseUpdate,
    //   oldSavedView: SavedViewBase
    // ) => {
    //   const data = JSON.stringify({
    //     visibilityOverrideProps: newSavedView.visibilityOverrideProps ?? {},
    //   });
    //   if (data !== oldSavedView.extensions?.get("VisibilityOverride")) {
    //     await SavedViewsExtensionHandlers.addExtensions(
    //       newSavedView.id,
    //       "VisibilityOverride",
    //       data
    //     );
    //   }
    // },
  };
}
