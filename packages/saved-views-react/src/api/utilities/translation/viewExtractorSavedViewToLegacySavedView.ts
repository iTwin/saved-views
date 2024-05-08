/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import type { CameraProps } from "@itwin/core-common";
import { SheetViewState, type DrawingViewState, type SpatialViewState } from "@itwin/core-frontend";
import type {
  SavedViewRepresentation, SavedViewTag, ViewDataITwin3d, ViewDataITwinDrawing, ViewDataITwinSheet, ViewITwin2d,
  ViewITwin3d,
} from "@itwin/saved-views-client";

import type { LegacySavedView3d, LegacySavedView2d, LegacyTag } from "../SavedViewTypes.js";
import { extractClipVectors } from "./clipVectorsExtractor.js";
import { extractDisplayStyle, extractDisplayStyle3d } from "./displayStyleExtractor.js";

export function savedViewITwin3dToLegacy3dSavedView(
  savedViewRsp: SavedViewRepresentation,
  seedSpatialViewState: SpatialViewState,
): LegacySavedView3d {
  const modelSelector = seedSpatialViewState.modelSelector;
  const itwin3dView = (savedViewRsp.savedViewData as ViewDataITwin3d).itwin3dView;
  const legacyView: LegacySavedView3d = {
    id: savedViewRsp.id,
    is2d: false,
    groupId: savedViewRsp._links.group ? extractIdFromHref(savedViewRsp._links.group.href) : undefined,
    tags: extractTags(savedViewRsp._links.creator?.href ?? "", savedViewRsp.tags),
    name: savedViewRsp.displayName,
    userId: extractIdFromHref(savedViewRsp._links.creator?.href ?? "") ?? "",
    shared: savedViewRsp.shared,
    thumbnailId: savedViewRsp.id ?? "",
    viewDefinitionProps: {
      origin: itwin3dView.origin,
      extents: itwin3dView.extents,
      angles: itwin3dView.angles ?? {},
      camera: itwin3dView.camera as CameraProps,
      jsonProperties: {
        viewDetails: extractClipVectors(itwin3dView) ?? {},
      },
      classFullName: seedSpatialViewState.classFullName,
      code: seedSpatialViewState.code,
      model: seedSpatialViewState.model,
      categorySelectorId: seedSpatialViewState.categorySelector.id,
      displayStyleId: seedSpatialViewState.displayStyle.id,
      cameraOn: itwin3dView.camera !== undefined,
      modelSelectorId: seedSpatialViewState.modelSelector.id,
    },
    modelSelectorProps: {
      classFullName: modelSelector.classFullName,
      code: {
        spec: modelSelector.code.spec,
        scope: modelSelector.code.scope,
        value: modelSelector.code.value,
      },
      model: modelSelector.model,
      models: itwin3dView.models?.enabled ?? [],
    },
    categorySelectorProps: {
      classFullName: seedSpatialViewState.categorySelector.classFullName,
      categories: itwin3dView.categories?.enabled ?? [],
      code: {
        scope: seedSpatialViewState.categorySelector.code.scope,
        spec: seedSpatialViewState.categorySelector.code.spec,
        value: seedSpatialViewState.categorySelector.code.value,
      },
      model: seedSpatialViewState.categorySelector.model,
    },
    displayStyleProps: {
      id: seedSpatialViewState.displayStyle.id,
      classFullName: seedSpatialViewState.displayStyle.classFullName,
      code: seedSpatialViewState.displayStyle.code,
      model: seedSpatialViewState.displayStyle.model,
      jsonProperties: {
        styles: extractDisplayStyle3d((savedViewRsp.savedViewData as ViewDataITwin3d).itwin3dView),
      },
    },
  };
  appendHiddenCategoriesToLegacyView(itwin3dView, legacyView);
  appendHiddenModelsTo3dLegacySavedView(itwin3dView, legacyView);
  return legacyView;
}

function appendHiddenModelsTo3dLegacySavedView(view: ViewITwin3d, legacyView: LegacySavedView3d): void {
  if (view.models?.disabled) {
    legacyView.hiddenModels = view.models?.disabled;
  }
}

/**
 * Transform a ViewDataITwinDrawing into a legacy SavedView if possible
 * @param savedViewRsp
 * @param iModelViewData
 * @returns SavedView2d
 */
export function savedViewItwinDrawingToLegacyDrawingView(
  savedViewRsp: SavedViewRepresentation,
  seedDrawingViewState: DrawingViewState,
): LegacySavedView2d {
  const iTwinDrawingView = (savedViewRsp.savedViewData as ViewDataITwinDrawing).itwinDrawingView;
  seedDrawingViewState.displayStyle;
  const legacyView: LegacySavedView2d = {
    id: savedViewRsp.id,
    is2d: true,
    groupId: savedViewRsp._links.group ? extractIdFromHref(savedViewRsp._links.group.href) : undefined,
    tags: extractTags(savedViewRsp._links.creator?.href ?? "", savedViewRsp.tags),
    name: savedViewRsp.displayName,
    userId: extractIdFromHref(savedViewRsp._links.creator?.href ?? "") ?? "",
    shared: savedViewRsp.shared,
    thumbnailId: savedViewRsp.id ?? "",
    categorySelectorProps: {
      classFullName: seedDrawingViewState.categorySelector.classFullName,
      categories: iTwinDrawingView.categories?.enabled ?? [],
      code: {
        scope: seedDrawingViewState.categorySelector.code.scope,
        spec: seedDrawingViewState.categorySelector.code.spec,
        value: seedDrawingViewState.categorySelector.code.value,
      },
      model: seedDrawingViewState.categorySelector.model,
      federationGuid:
        seedDrawingViewState.categorySelector.federationGuid ?? "",
      id: seedDrawingViewState.categorySelector.id,
    },
    viewDefinitionProps: {
      classFullName: seedDrawingViewState.classFullName,
      id: seedDrawingViewState.id,
      jsonProperties: {
        viewDetails: {
          gridOrient: seedDrawingViewState.getGridOrientation(),
        },
      },
      code: {
        scope: seedDrawingViewState.code.scope,
        spec: seedDrawingViewState.code.spec,
        value: seedDrawingViewState.code.value,
      },
      model: seedDrawingViewState.model,
      federationGuid: seedDrawingViewState.federationGuid ?? "",
      categorySelectorId: seedDrawingViewState.categorySelector.id,
      displayStyleId: seedDrawingViewState.displayStyle.id,
      isPrivate: seedDrawingViewState.isPrivate ?? false,
      description: seedDrawingViewState.description ?? "",
      origin: iTwinDrawingView.origin,
      delta: iTwinDrawingView.delta,
      angle: iTwinDrawingView.angle,
      baseModelId: iTwinDrawingView.baseModelId,
    },
    displayStyleProps: {
      classFullName: seedDrawingViewState.displayStyle.classFullName,
      id: seedDrawingViewState.displayStyle.id,
      jsonProperties: {
        styles: extractDisplayStyle(iTwinDrawingView, seedDrawingViewState),
      },
      code: {
        spec: seedDrawingViewState.displayStyle.code.spec,
        scope: seedDrawingViewState.displayStyle.code.scope,
        value: seedDrawingViewState.displayStyle.code.value,
      },
      model: seedDrawingViewState.displayStyle.model,
      federationGuid: seedDrawingViewState.displayStyle.federationGuid ?? "",
    },
  };
  appendHiddenCategoriesToLegacyView(iTwinDrawingView, legacyView);
  return legacyView;
}

/**
 * Transform a ViewDataITwinSheet into a legacy SavedView if possible
 * @param savedViewRsp
 * @param seedSheetViewState
 * @returns SavedView2d
 */
export function savedViewItwinSheetToLegacySheetSavedView(
  savedViewRsp: SavedViewRepresentation,
  seedSheetViewState: SheetViewState,
): LegacySavedView2d {
  const itwinSheetView = (savedViewRsp.savedViewData as ViewDataITwinSheet).itwinSheetView;
  const legacyView: LegacySavedView2d = {
    id: savedViewRsp.id,
    is2d: true,
    groupId: savedViewRsp._links.group ? extractIdFromHref(savedViewRsp._links.group.href) : undefined,
    tags: extractTags(savedViewRsp._links.creator?.href ?? "", savedViewRsp.tags),
    name: savedViewRsp.displayName,
    userId: extractIdFromHref(savedViewRsp._links.creator?.href ?? "") ?? "",
    shared: savedViewRsp.shared,
    thumbnailId: savedViewRsp.id ?? "",
    categorySelectorProps: {
      classFullName: seedSheetViewState.categorySelector.classFullName,
      categories: itwinSheetView.categories?.enabled ?? [],
      code: {
        scope: seedSheetViewState.categorySelector.code.scope,
        spec: seedSheetViewState.categorySelector.code.spec,
        value: seedSheetViewState.categorySelector.code.value,
      },
      model: seedSheetViewState.categorySelector.model,
      federationGuid: seedSheetViewState.categorySelector.federationGuid,
      id: seedSheetViewState.categorySelector.id,
    },
    viewDefinitionProps: {
      classFullName: seedSheetViewState.classFullName,
      id: seedSheetViewState.id,
      jsonProperties: {
        viewDetails: {
          gridOrient: seedSheetViewState.getGridOrientation() ?? undefined,
        },
      },
      code: {
        scope: seedSheetViewState.code.scope,
        spec: seedSheetViewState.code.spec,
        value: seedSheetViewState.code.value,
      },
      model: seedSheetViewState.model,
      federationGuid: seedSheetViewState.federationGuid ?? "",
      categorySelectorId: seedSheetViewState.categorySelector.id,
      displayStyleId: seedSheetViewState.displayStyle.id,
      isPrivate: seedSheetViewState.isPrivate ?? false,
      description: seedSheetViewState.description ?? "",
      origin: itwinSheetView.origin,
      delta: itwinSheetView.delta,
      angle: itwinSheetView.angle,
      baseModelId: itwinSheetView.baseModelId,
    },
    displayStyleProps: {
      classFullName: seedSheetViewState.displayStyle.classFullName,
      id: seedSheetViewState.displayStyle.id,
      jsonProperties: {
        styles: extractDisplayStyle(itwinSheetView, seedSheetViewState),
      },
      code: {
        spec: seedSheetViewState.displayStyle.code.spec,
        scope: seedSheetViewState.displayStyle.code.scope,
        value: seedSheetViewState.displayStyle.code.value,
      },
      model: seedSheetViewState.displayStyle.model,
      federationGuid: seedSheetViewState.displayStyle.federationGuid ?? "",
    },
    sheetProps: {
      width: itwinSheetView.width ?? -1,
      height: itwinSheetView.height ?? -1,
      model: seedSheetViewState.displayStyle.model,
      classFullName: SheetViewState.classFullName,
      code: {
        spec: seedSheetViewState.displayStyle.code.spec,
        scope: seedSheetViewState.displayStyle.code.scope,
        value: "",
      },
    },
    sheetAttachments: itwinSheetView.sheetAttachments ?? [],
  };
  appendHiddenCategoriesToLegacyView(itwinSheetView, legacyView);
  return legacyView;
}

/**
 * Extract all the tags.
 * @param creator href for the creator
 * @param tags the list of tags in the saved view
 */
function extractTags(creator: string, tags?: SavedViewTag[]): LegacyTag[] | undefined {
  const createdByUserId = extractIdFromHref(creator) ?? "";
  return tags?.map((tag) => ({ name: tag.displayName, createdByUserId }));
}

function extractIdFromHref(href: string): string | undefined {
  return href.split("/").pop();
}

function appendHiddenCategoriesToLegacyView(
  iTwinView: ViewITwin2d | ViewITwin3d,
  legacyView: LegacySavedView3d | LegacySavedView2d,
): void {
  if (iTwinView.categories?.disabled) {
    legacyView.hiddenCategories = iTwinView.categories.disabled;
  }
}
