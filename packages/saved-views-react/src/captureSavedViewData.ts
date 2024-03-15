/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Id64Array } from "@itwin/core-bentley";
import { QueryRowFormat, type SpatialViewDefinitionProps } from "@itwin/core-common";
import {
  type DrawingViewState, type IModelConnection, type SheetViewState, type SpatialViewState, type Viewport,
} from "@itwin/core-frontend";
import { type AngleProps, type XYProps, type XYZProps, type YawPitchRollProps } from "@itwin/core-geometry";
import {
  isViewDataITwin3d, type ViewData, type ViewDataITwin3d, type ViewDataITwinDrawing, type ViewDataITwinSheet,
  type ViewITwinDrawing, type ViewYawPitchRoll,
} from "@itwin/saved-views-client";

import { extractClipVectorsFromLegacy } from "./api/utilities/translation/clipVectorsLegacyExtractor.js";
import {
  extractDisplayStyle2dFromLegacy, extractDisplayStyle3dFromLegacy,
} from "./api/utilities/translation/displayStyleExtractor.js";

interface SavedViewFlags {
  supportHiddenModelsAndCategories: boolean;
  want2dViews: boolean;
}

export async function captureSavedViewData(vp: Viewport, flags: SavedViewFlags): Promise<ViewData> {
  const hiddenCategoriesPromise = flags.supportHiddenModelsAndCategories ? getHiddenCategories(vp) : undefined;

  let savedViewData: ViewData;
  if (vp.view.isSpatialView()) {
    const [hiddenCategories, hiddenModels] = await Promise.all([
      hiddenCategoriesPromise,
      flags.supportHiddenModelsAndCategories ? getHiddenModels(vp) : undefined,
    ]);
    savedViewData = createSpatialSavedViewObject(vp, hiddenCategories, hiddenModels);
  } else if (vp.view.isDrawingView()) {
    savedViewData = createDrawingSavedViewObject(vp, await hiddenCategoriesPromise);
  } else {
    savedViewData = createSheetSavedViewObject(vp, await hiddenCategoriesPromise);
  }

  if (!isViewDataITwin3d(savedViewData) && !flags.want2dViews) {
    throw new Error("No support for 2D views yet");
  }

  return savedViewData;
}

function createSpatialSavedViewObject(
  vp: Viewport,
  hiddenCategories: Id64Array | undefined,
  hiddenModels: Id64Array | undefined,
): ViewDataITwin3d {
  const viewState = vp.view as SpatialViewState;

  const displayStyleProps = viewState.displayStyle.toJSON();

  // Clear the timePoint if no schedule script is available on the viewState
  if (
    viewState.is3d() && displayStyleProps.jsonProperties?.styles?.timePoint && !viewState.displayStyle.scheduleScript
  ) {
    displayStyleProps.jsonProperties.styles.timePoint = undefined;
  }

  // Omit the schedule script - may cause excessively large JSON.
  if (displayStyleProps.jsonProperties?.styles?.scheduleScript) {
    displayStyleProps.jsonProperties.styles.scheduleScript = undefined;
  }

  const viewDefinitionProps = viewState.toJSON() as SpatialViewDefinitionProps;

  return {
    itwin3dView: {
      origin: toArrayVector3d(viewDefinitionProps.origin),
      extents: toArrayVector3d(viewDefinitionProps.extents),
      angles: viewDefinitionProps.angles && toYawPitchRoll(viewDefinitionProps.angles),
      camera: viewDefinitionProps.cameraOn ? {
        lens: toDegrees(viewDefinitionProps.camera.lens) ?? 0,
        focusDist: viewDefinitionProps.camera.focusDist,
        eye: toArrayVector3d(viewDefinitionProps.camera.eye),
      } : undefined,
      categories: {
        enabled: viewState.categorySelector.toJSON().categories,
        disabled: hiddenCategories,
      },
      models: {
        enabled: viewState.modelSelector.toJSON().models,
        disabled: hiddenModels,
      },
      displayStyle: extractDisplayStyle3dFromLegacy(displayStyleProps),
      clipVectors: extractClipVectorsFromLegacy(viewDefinitionProps),
    },
  };
}

function toArrayVector3d(xyzProps: XYZProps): [number, number, number] {
  if (Array.isArray(xyzProps)) {
    return [xyzProps[0] ?? 0, xyzProps[1] ?? 0, xyzProps[2] ?? 0];
  }

  return [xyzProps.x ?? 0, xyzProps.y ?? 0, xyzProps.z ?? 0];
}

function toYawPitchRoll(angles: YawPitchRollProps): ViewYawPitchRoll {
  return {
    yaw: angles.yaw !== undefined ? toDegrees(angles.yaw) : undefined,
    pitch: angles.pitch !== undefined ? toDegrees(angles.pitch) : undefined,
    roll: angles.roll !== undefined ? toDegrees(angles.roll) : undefined,
  };
}

function createDrawingSavedViewObject(vp: Viewport, hiddenCategories: Id64Array | undefined): ViewDataITwinDrawing {
  const viewState = vp.view as DrawingViewState;
  const viewDefinitionProps = viewState.toJSON();

  return {
    itwinDrawingView: {
      modelExtents: {} as ViewITwinDrawing["modelExtents"],
      baseModelId: viewDefinitionProps.baseModelId,
      origin: toArrayVector2d(viewDefinitionProps.origin),
      delta: toArrayVector2d(viewDefinitionProps.delta),
      angle: toDegrees(viewDefinitionProps.angle) ?? 0,
      displayStyle: extractDisplayStyle2dFromLegacy(viewState.displayStyle.toJSON()),
      categories: {
        enabled: viewState.categorySelector.toJSON().categories,
        disabled: hiddenCategories,
      },
    },
  };
}

function createSheetSavedViewObject(vp: Viewport, hiddenCategories: Id64Array | undefined): ViewDataITwinSheet {
  const viewState = vp.view as SheetViewState;
  const viewDefinitionProps = viewState.toJSON();

  return {
    itwinSheetView: {
      baseModelId: viewDefinitionProps.baseModelId,
      origin: toArrayVector2d(viewDefinitionProps.origin),
      delta: toArrayVector2d(viewDefinitionProps.delta),
      angle: toDegrees(viewDefinitionProps.angle) ?? 0,
      displayStyle: extractDisplayStyle2dFromLegacy(viewState.displayStyle.toJSON()),
      categories: {
        enabled: viewState.categorySelector.toJSON().categories,
        disabled: hiddenCategories,
      },
      width: viewState.sheetSize.x,
      height: viewState.sheetSize.y,
      sheetAttachments: viewState.attachmentIds,
    },
  };
}

function toArrayVector2d(xyzProps: XYProps): [number, number] {
  if (Array.isArray(xyzProps)) {
    return [xyzProps[0] ?? 0, xyzProps[1] ?? 0];
  }

  return [xyzProps.x ?? 0, xyzProps.y ?? 0];
}


function toDegrees(angle: AngleProps): number | undefined {
  if (typeof angle === "number") {
    return angle;
  }

  if ("degrees" in angle) {
    return angle.degrees;
  }

  if ("radians" in angle) {
    return angle.radians * (180 / Math.PI);
  }

  return undefined;
}

async function getHiddenModels(vp: Viewport): Promise<Id64Array> {
  const allModels = await getAllModels(vp.iModel);
  const visibleModels = new Set((vp.view as SpatialViewState).modelSelector.toJSON().models);
  return allModels.map(({ id }) => id).filter((model) => !visibleModels.has(model));
}

async function getAllModels(iModel: IModelConnection): Promise<Array<{ id: string; }>> {
  // Note: IsNotSpatiallyLocated was introduced in a later version of the BisCore ECSchema. If the iModel has an earlier
  // version, the statement will throw because the property does not exist. If the iModel was created from an earlier
  // version and later upgraded to a newer version, the property may be NULL for models created prior to the upgrade.
  try {
    return await executeQuery(
      iModel,
      "SELECT ECInstanceId FROM Bis.GeometricModel3D WHERE IsPrivate = false AND IsTemplate = false AND (IsNotSpatiallyLocated IS NULL OR IsNotSpatiallyLocated = false)",
    );
  } catch {
    return executeQuery(
      iModel,
      "SELECT ECInstanceId FROM Bis.GeometricModel3D WHERE IsPrivate = false AND IsTemplate = false",
    );
  }
}

async function getHiddenCategories(vp: Viewport): Promise<Id64Array> {
  const visibleCategories = new Set(vp.view.categorySelector.toJSON().categories);
  const allCategories = await getAllCategories(vp.iModel);
  return allCategories.map(({ id }) => id).filter((category) => !visibleCategories.has(category));
}

async function getAllCategories(iModel: IModelConnection): Promise<Array<{ id: string; }>> {
  return executeQuery(
    iModel,
    "SELECT DISTINCT Category.Id AS id FROM BisCore.GeometricElement3d WHERE Category.Id IN (SELECT ECInstanceId FROM BisCore.SpatialCategory)",
  );
}

async function executeQuery(iModel: IModelConnection, query: string): Promise<Array<{ id: string; }>> {
  return iModel.createQueryReader(query, undefined, { rowFormat: QueryRowFormat.UseJsPropertyNames }).toArray();
}
