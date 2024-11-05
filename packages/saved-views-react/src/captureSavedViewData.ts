/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Id64Array } from "@itwin/core-bentley";
import { QueryRowFormat, type SpatialViewDefinitionProps } from "@itwin/core-common";
import type {
  DrawingViewState, IModelConnection, SheetViewState, SpatialViewState, Viewport,
} from "@itwin/core-frontend";
import type { AngleProps, XYProps, XYZProps, YawPitchRollProps } from "@itwin/core-geometry";
import type { ViewITwinDrawing, ViewYawPitchRoll } from "@itwin/saved-views-client";

import type { ITwin3dViewData, ITwinDrawingdata, ITwinSheetData, SavedViewData, ViewData } from "./SavedView.js";
import { ExtensionHandler, extensionHandlers } from "./translation/SavedViewsExtensionHandlers.js";
import { extractClipVectorsFromLegacy } from "./translation/clipVectorsLegacyExtractor.js";
import {
  extractDisplayStyle2dFromLegacy, extractDisplayStyle3dFromLegacy,
} from "./translation/displayStyleExtractor.js";

interface CaptureSavedViewDataArgs {
  /** Viewport to capture. */
  viewport: Viewport;

  /**
   * Whether to skip capturing data for `"EmphasizeElements"` extension.
   * @default false
   */
  omitEmphasis?: boolean | undefined;

  /**
   * Whether to skip capturing data for `"PerModelCategoryVisibility"` extension.
   * @default false
   */
  omitPerModelCategoryVisibility?: boolean | undefined;
}

/**
 * Captures current {@link Viewport} state into serializable format. The returned data can later be used to restore
 * viewport's view.
 *
 * @example
 * import { captureSavedViewData, captureSavedViewThumbnail } from "@itwin/saved-views-react";
 *
 * async function saveViewport(viewport) {
 *   const { viewData, extensions = [] } = await captureSavedViewData({ viewport });
 *   const myExtensions = captureMyCustomState(viewport);
 *   const thumbnail = captureSavedViewThumbnail(viewport);
 *   return { thumbnail, viewData, extensions: extensions.concat(myExtensions) };
 * }
 */
export async function captureSavedViewData(args: CaptureSavedViewDataArgs): Promise<SavedViewData> {
  const extensions: ExtensionHandler[] = [];
  if (!args.omitEmphasis) {
    extensions.push(extensionHandlers.emphasizeElements);
  }

  if (!args.omitPerModelCategoryVisibility) {
    extensions.push(extensionHandlers.perModelCategoryVisibility);
  }

  return {
    viewData: await createSavedViewVariant(args.viewport),
    extensions: extensions
      .map((extension) => ({
        extensionName: extension.extensionName,
        data: extension.capture(args.viewport),
      }))
      .filter(({ data }) => data !== undefined) as Array<{ extensionName: string; data: string; }>,
  };
}

async function createSavedViewVariant(viewport: Viewport): Promise<ViewData> {
  const hiddenCategoriesPromise = getMissingCategories(
    viewport.iModel,
    new Set(viewport.view.categorySelector.toJSON().categories),
  );

  if (viewport.view.isSpatialView()) {
    const [hiddenCategories, hiddenModels] = await Promise.all([
      hiddenCategoriesPromise,
      getMissingModels(viewport.iModel, new Set(viewport.view.modelSelector.toJSON().models)),
    ]);
    return createSpatialSavedViewObject(viewport, hiddenCategories, hiddenModels);
  }

  if (viewport.view.isDrawingView()) {
    return createDrawingSavedViewObject(viewport, await hiddenCategoriesPromise);
  }

  return createSheetSavedViewObject(viewport, await hiddenCategoriesPromise);
}

function createSpatialSavedViewObject(
  vp: Viewport,
  hiddenCategories: Id64Array | undefined,
  hiddenModels: Id64Array | undefined,
): ITwin3dViewData {
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
    type: "iTwin3d",
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

function createDrawingSavedViewObject(vp: Viewport, hiddenCategories: Id64Array | undefined): ITwinDrawingdata {
  const viewState = vp.view as DrawingViewState;
  const viewDefinitionProps = viewState.toJSON();

  return {
    type: "iTwinDrawing",
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
  };
}

function createSheetSavedViewObject(vp: Viewport, hiddenCategories: Id64Array | undefined): ITwinSheetData {
  const viewState = vp.view as SheetViewState;
  const viewDefinitionProps = viewState.toJSON();

  return {
    type: "iTwinSheet",
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
  if (iModel.isBlank) {
    return [];
  }

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
  if (iModel.isBlank) {
    return [];
  }

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
