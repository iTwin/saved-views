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
  type ViewData, type ViewDataITwin3d, type ViewDataITwinDrawing, type ViewDataITwinSheet, type ViewITwinDrawing,
  type ViewYawPitchRoll,
} from "@itwin/saved-views-client";

import { extractClipVectorsFromLegacy } from "./translation/clipVectorsLegacyExtractor.js";
import {
  extractDisplayStyle2dFromLegacy, extractDisplayStyle3dFromLegacy,
} from "./translation/displayStyleExtractor.js";

interface CaptureSavedViewDataArgs {
  /** Viewport to capture. */
  viewport: Viewport;
}

export async function captureSavedViewData(args: CaptureSavedViewDataArgs): Promise<ViewData> {
  const hiddenCategoriesPromise = getMissingCategories(
    args.viewport.iModel,
    new Set(args.viewport.view.categorySelector.toJSON().categories),
  );

  if (args.viewport.view.isSpatialView()) {
    const [hiddenCategories, hiddenModels] = await Promise.all([
      hiddenCategoriesPromise,
      getMissingModels(args.viewport.iModel, new Set(args.viewport.view.modelSelector.toJSON().models)),
    ]);
    return createSpatialSavedViewObject(args.viewport, hiddenCategories, hiddenModels);
  }

  if (args.viewport.view.isDrawingView()) {
    return createDrawingSavedViewObject(args.viewport, await hiddenCategoriesPromise);
  }

  return createSheetSavedViewObject(args.viewport, await hiddenCategoriesPromise);
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

export async function getMissingModels(iModel: IModelConnection, knownModels: Set<string>): Promise<string[]> {
  const allModels = await getAllModels(iModel);
  return allModels.map(({ id }) => id).filter((model) => !knownModels.has(model));
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

export async function getMissingCategories(iModel: IModelConnection, knownCategories: Set<string>): Promise<Id64Array> {
  const allCategories = await getAllCategories(iModel);
  return allCategories.map(({ id }) => id).filter((category) => !knownCategories.has(category));
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
