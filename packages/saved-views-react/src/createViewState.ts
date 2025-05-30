/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  Camera,
  type CodeProps,
  type SpatialViewDefinitionProps,
  type ViewDefinition2dProps,
  type ViewStateProps,
} from "@itwin/core-common";
import {
  DrawingViewState,
  SheetViewState,
  SpatialViewState,
  type IModelConnection,
  type ViewState,
} from "@itwin/core-frontend";
import type {
  ViewITwin3d,
  ViewITwinDrawing,
  ViewITwinSheet,
} from "@itwin/saved-views-client";

import {
  queryMissingCategories,
  queryMissingModels,
} from "./captureSavedViewData.js";
import type { ViewData } from "./SavedView.js";
import { extractClipVectors } from "./translation/clipVectorsExtractor.js";
import {
  extractDisplayStyle,
  extractDisplayStyle3d,
} from "./translation/displayStyleExtractor.js";
import { Id64Array } from "@itwin/core-bentley";

/**
 * Settings for how to handle the visibility of elements (models or categories) in iModel.
 *   * `enabled` – Enabled is the set of enabled elements (models or categories) that are stored in the saved view. Default is ignore.
 *   * `disabled` – Disabled is the set of disabled elements (models or categories) that are stored in the saved view. Default is ignore.
 *   * `other` – Other is the set of elements (models or categories) that are not stored in the saved view. Default is ignore.
 *
 * @default '{ enabled: "ignore", disabled: "ignore", other: "ignore" }'
 */
export interface ElementSettings {
  enabled?: ShowStrategy | undefined;
  disabled?: ShowStrategy | undefined;
  other?: ShowStrategy | undefined;
}

/**
 * Controls how models or categories are going to be altered.
 *   * `"show"` – Show the elements in this list
 *   * `"hide"` – Hide (ie do not show) the elements in this list
 *   * `"ignore"` – Preserve current elements that are shown in viewport
 */
type ShowStrategy = "show" | "hide" | "ignore";

export interface ViewStateCreateSettings {
  /**
   * Normally {@link createViewState} function invokes and awaits {@linkcode ViewState.load}
   * method before returning. You may skip this step if you intend to perform it later.
   * @default false
   *
   * @example
   * const viewState = await createViewState(iModel, savedViewData.viewData, { skipViewStateLoad: true });
   * viewState.categorySelector.addCategories("<additional_category_id>");
   * await viewState.load();
   */
  skipViewStateLoad?: boolean | undefined;

  /**
   * How to handle the visibility of models that exist in iModel,
   * including those not captured in Saved View data.
   * @default '{ enabled: "ignore", disabled: "ignore", other: "ignore" }'
   */
  models?: ElementSettings | undefined;

  /**
   * How to handle the visibility of categories that exist in iModel,
   * including those not captured in Saved View data.
   * @default '{ enabled: "ignore", disabled: "ignore", other: "ignore" }'
   */
  categories?: ElementSettings | undefined;
}

/**
 * Creates {@link ViewStateProps} object out of Saved View data. It provides a lower-level
 * access to view data for advanced use.
 *
 * @example
 * const viewStateProps = await createViewStateProps(iModel, savedViewData.viewData);
 * const viewState = createViewStateFromProps(viewStateProps);
 * await applySavedView(iModel, viewport, savedViewData, { viewState });
 *
 * // The three lines above are equivalent to
 * const viewState = await createViewState(iModel, savedViewData.viewData);
 * await applySavedView(iModel, viewport, savedViewData, { viewState });
 */
export async function createViewStateProps(
  iModel: IModelConnection,
  viewData: ViewData,
): Promise<ViewStateProps> {
  const viewStateProps = await createViewStatePropsVariant(iModel, viewData);
  return viewStateProps;
}

async function applyViewStateOptions(
  viewState: ViewState,
  iModel: IModelConnection,
  viewData: ViewData,
  settings: ViewStateCreateSettings = {},
) {
  await applyModelSettings(iModel, viewState, viewData, settings.models);
  await applyCategorySettings(iModel, viewState, viewData, settings.categories);

  if (!settings.skipViewStateLoad) {
    await viewState.load();
  }
}

/**
 * Creates {@link ViewState} object out of Saved View data. It provides a lower-level
 * access to view data for advanced use.
 *
 * @example
 * const viewStateProps = await createViewStateProps(iModel, savedViewData.viewData);
 * const viewState = createViewStateFromProps(viewStateProps);
 * await applySavedView(iModel, viewport, savedViewData, { viewState });
 *
 * // The three lines above are equivalent to
 * const viewState = await createViewState(iModel, savedViewData.viewData);
 * await applySavedView(iModel, viewport, savedViewData, { viewState });
 */
export async function createViewStateFromProps(
  props: ViewStateProps,
  iModel: IModelConnection,
  viewData: ViewData,
  settings: ViewStateCreateSettings = {},
): Promise<ViewState> {
  let viewState: ViewState;
  if (viewData.type === "iTwinDrawing") {
    viewState = DrawingViewState.createFromProps(props, iModel);
  } else if (viewData.type === "iTwinSheet") {
    viewState = SheetViewState.createFromProps(props, iModel);
  } else {
    viewState = SpatialViewState.createFromProps(props, iModel);
  }
  await applyViewStateOptions(viewState, iModel, viewData, settings);
  return viewState;
}

/**
 * Creates {@link ViewState} object out of ViewStateProps. It provides a lower-level
 * access to view data for advanced use.
 *
 * @example
 * const viewState = await createViewState(iModel, savedViewData.viewData);
 * await applySavedView(iModel, viewport, savedViewData, { viewState });
 *
 * // The two lines above are equivalent to
 * await applySavedView(iModel, viewport, savedViewData);
 */
export async function createViewState(
  iModel: IModelConnection,
  viewData: ViewData,
  settings: ViewStateCreateSettings = {},
): Promise<ViewState> {
  const viewState = await createViewStateVariant(iModel, viewData);
  await applyViewStateOptions(viewState, iModel, viewData, settings);
  return viewState;
}

async function createViewStatePropsVariant(
  iModel: IModelConnection,
  viewData: ViewData,
): Promise<ViewStateProps> {
  if (viewData.type === "iTwinDrawing") {
    return createDrawingViewStateProps(iModel, viewData);
  }

  if (viewData.type === "iTwinSheet") {
    return createSheetViewStateProps(iModel, viewData);
  }

  return createSpatialViewStateProps(iModel, viewData);
}

async function createViewStateVariant(
  iModel: IModelConnection,
  viewData: ViewData,
): Promise<ViewState> {
  if (viewData.type === "iTwinDrawing") {
    return createDrawingViewState(iModel, viewData);
  }

  if (viewData.type === "iTwinSheet") {
    return createSheetViewState(iModel, viewData);
  }

  return createSpatialViewState(iModel, viewData);
}

interface SpatialViewStateProps extends ViewStateProps {
  viewDefinitionProps: SpatialViewDefinitionProps;
}

async function createSpatialViewStateProps(
  iModel: IModelConnection,
  viewData: ViewITwin3d,
): Promise<SpatialViewStateProps> {
  const seedViewState = (await fetchIModelViewData(
    iModel,
    SpatialViewState.classFullName,
  )) as SpatialViewState;
  const props: SpatialViewStateProps = {
    viewDefinitionProps: {
      origin: viewData.origin,
      extents: viewData.extents,
      angles: viewData.angles,
      camera: viewData.camera ?? new Camera(),
      jsonProperties: {
        viewDetails: extractClipVectors(viewData),
      },
      classFullName: seedViewState.classFullName,
      code: seedViewState.code,
      model: seedViewState.model,
      categorySelectorId: seedViewState.categorySelector.id,
      displayStyleId: seedViewState.displayStyle.id,
      cameraOn: viewData.camera !== undefined,
      modelSelectorId: seedViewState.modelSelector.id,
    },
    categorySelectorProps: {
      classFullName: seedViewState.categorySelector.classFullName,
      categories: viewData.categories?.enabled ?? [],
      code: cloneCode(seedViewState.categorySelector.code),
      model: seedViewState.categorySelector.model,
    },
    modelSelectorProps: {
      classFullName: seedViewState.modelSelector.classFullName,
      code: cloneCode(seedViewState.modelSelector.code),
      model: seedViewState.modelSelector.model,
      models: viewData.models?.enabled ?? [],
    },
    displayStyleProps: {
      id: seedViewState.displayStyle.id,
      classFullName: seedViewState.displayStyle.classFullName,
      code: seedViewState.displayStyle.code,
      model: seedViewState.displayStyle.model,
      jsonProperties: {
        styles: extractDisplayStyle3d(viewData),
      },
    },
  };
  return props;
}

async function createSpatialViewState(
  iModel: IModelConnection,
  viewData: ViewITwin3d,
): Promise<SpatialViewState> {
  const props = await createSpatialViewStateProps(iModel, viewData);
  return SpatialViewState.createFromProps(props, iModel);
}

interface DrawingViewStateProps extends ViewStateProps {
  viewDefinitionProps: ViewDefinition2dProps;
}

async function createDrawingViewStateProps(
  iModel: IModelConnection,
  viewData: ViewITwinDrawing,
): Promise<DrawingViewStateProps> {
  const seedViewState = (await fetchIModelViewData(
    iModel,
    DrawingViewState.classFullName,
  )) as DrawingViewState;
  const props: DrawingViewStateProps = {
    viewDefinitionProps: {
      classFullName: seedViewState.classFullName,
      id: seedViewState.id,
      jsonProperties: {
        viewDetails: {
          gridOrient: seedViewState.getGridOrientation(),
        },
      },
      code: cloneCode(seedViewState.code),
      model: seedViewState.model,
      federationGuid: seedViewState.federationGuid,
      categorySelectorId: seedViewState.categorySelector.id,
      displayStyleId: seedViewState.displayStyle.id,
      isPrivate: seedViewState.isPrivate,
      description: seedViewState.description,
      origin: viewData.origin,
      delta: viewData.delta,
      angle: viewData.angle,
      baseModelId: viewData.baseModelId,
    },
    categorySelectorProps: {
      classFullName: seedViewState.categorySelector.classFullName,
      categories: viewData.categories?.enabled ?? [],
      code: cloneCode(seedViewState.categorySelector.code),
      model: seedViewState.categorySelector.model,
      federationGuid: seedViewState.categorySelector.federationGuid,
      id: seedViewState.categorySelector.id,
    },
    displayStyleProps: {
      classFullName: seedViewState.displayStyle.classFullName,
      id: seedViewState.displayStyle.id,
      jsonProperties: {
        styles: extractDisplayStyle(viewData, seedViewState),
      },
      code: cloneCode(seedViewState.displayStyle.code),
      model: seedViewState.displayStyle.model,
      federationGuid: seedViewState.displayStyle.federationGuid,
    },
  };
  return props;
}

async function createDrawingViewState(
  iModel: IModelConnection,
  viewData: ViewITwinDrawing,
): Promise<DrawingViewState> {
  const props = await createDrawingViewStateProps(iModel, viewData);
  return DrawingViewState.createFromProps(props, iModel);
}

interface SheetViewStateProps extends ViewStateProps {
  viewDefinitionProps: ViewDefinition2dProps;
}

async function createSheetViewStateProps(
  iModel: IModelConnection,
  viewData: ViewITwinSheet,
): Promise<SheetViewStateProps> {
  const seedViewState = (await fetchIModelViewData(
    iModel,
    SheetViewState.classFullName,
  )) as SheetViewState;
  const props: SheetViewStateProps = {
    viewDefinitionProps: {
      classFullName: seedViewState.classFullName,
      id: seedViewState.id,
      jsonProperties: {
        viewDetails: {
          gridOrient: seedViewState.getGridOrientation(),
        },
      },
      code: cloneCode(seedViewState.code),
      model: seedViewState.model,
      federationGuid: seedViewState.federationGuid,
      categorySelectorId: seedViewState.categorySelector.id,
      displayStyleId: seedViewState.displayStyle.id,
      isPrivate: seedViewState.isPrivate,
      description: seedViewState.description,
      origin: viewData.origin,
      delta: viewData.delta,
      angle: viewData.angle,
      baseModelId: viewData.baseModelId,
    },
    categorySelectorProps: {
      classFullName: seedViewState.categorySelector.classFullName,
      categories: viewData.categories?.enabled ?? [],
      code: cloneCode(seedViewState.categorySelector.code),
      model: seedViewState.categorySelector.model,
      federationGuid: seedViewState.categorySelector.federationGuid,
      id: seedViewState.categorySelector.id,
    },
    displayStyleProps: {
      classFullName: seedViewState.displayStyle.classFullName,
      id: seedViewState.displayStyle.id,
      jsonProperties: {
        styles: extractDisplayStyle(viewData, seedViewState),
      },
      code: cloneCode(seedViewState.displayStyle.code),
      model: seedViewState.displayStyle.model,
      federationGuid: seedViewState.displayStyle.federationGuid,
    },
    sheetProps: {
      width: viewData.width,
      height: viewData.height,
      model: seedViewState.displayStyle.model,
      classFullName: SheetViewState.classFullName,
      code: {
        spec: seedViewState.displayStyle.code.spec,
        scope: seedViewState.displayStyle.code.scope,
        value: "",
      },
    },
    sheetAttachments: viewData.sheetAttachments,
  };
  return props;
}

async function createSheetViewState(
  iModel: IModelConnection,
  viewData: ViewITwinSheet,
): Promise<SheetViewState> {
  const props = await createSheetViewStateProps(iModel, viewData);
  return SheetViewState.createFromProps(props, iModel);
}

async function fetchIModelViewData(
  iModel: IModelConnection,
  viewClassName: string,
): Promise<ViewState> {
  if (iModel.isBlankConnection()) {
    return createEmptyViewState(iModel, viewClassName);
  }

  const viewId = await getDefaultViewIdFromClassName(iModel, viewClassName);
  if (viewId === "") {
    return createEmptyViewState(iModel, viewClassName);
  }

  return iModel.views.load(viewId);
}

function createEmptyViewState(
  iModel: IModelConnection,
  viewClassName: string,
): ViewState {
  const blankViewState = SpatialViewState.createBlank(
    iModel,
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
  );

  if (viewClassName === SpatialViewState.classFullName) {
    return blankViewState;
  }

  const blankViewStateProps: ViewStateProps = {
    viewDefinitionProps: blankViewState.toJSON(),
    categorySelectorProps: blankViewState.categorySelector.toJSON(),
    displayStyleProps: blankViewState.displayStyle.toJSON(),
  };

  switch (viewClassName) {
    case DrawingViewState.classFullName:
      return DrawingViewState.createFromProps(blankViewStateProps, iModel);
    case SheetViewState.classFullName:
      return SheetViewState.createFromProps(blankViewStateProps, iModel);
    default:
      return blankViewState;
  }
}

async function getDefaultViewIdFromClassName(
  iModel: IModelConnection,
  viewClassName: string,
): Promise<string> {
  // Check validity of default view
  const viewId = await iModel.views.queryDefaultViewId();
  const viewProps = await iModel.elements.queryProps({
    from: viewClassName,
    where: "ECInstanceId=" + viewId,
  });
  if (viewProps.length > 0) {
    return viewId;
  }

  // Return the first view we can find
  const viewList = await iModel.views.getViewList({
    from: viewClassName,
    wantPrivate: false,
  });
  if (viewList.length === 0) {
    return "";
  }

  return viewList[0].id;
}

function cloneCode({ spec, scope, value }: CodeProps): CodeProps {
  return { spec, scope, value };
}

async function applyModelSettings(
  iModel: IModelConnection,
  viewState: ViewState,
  viewData: ViewData,
  settings?: ElementSettings,
): Promise<void> {
  if (viewData.type === "iTwin3d") {
    if (!viewState.isSpatialView()) {
      return;
    }

    const addModels: Id64Array = [];
    const dropModels: Id64Array = [];
    if (settings?.enabled === "show") {
      addModels.push(...(viewData.models?.enabled ?? []));
    } else if (settings?.enabled === "hide") {
      dropModels.push(...(viewData.models?.enabled ?? []));
    }
    if (settings?.disabled === "show") {
      addModels.push(...(viewData.models?.disabled ?? []));
    } else if (settings?.disabled === "hide") {
      dropModels.push(...(viewData.models?.disabled ?? []));
    }
    if (settings?.other !== "ignore") {
      const otherModels = await queryMissingModels(
        iModel,
        new Set([
          ...(viewData.models?.disabled ?? []),
          ...(viewData.models?.enabled ?? []),
        ]),
      );
      if (settings?.other === "show") {
        addModels.push(...otherModels);
      } else if (settings?.other === "hide") {
        dropModels.push(...otherModels);
      }
    }

    if (addModels.length === 0 && dropModels.length === 0) {
      return;
    }

    // Update model selector
    const modelSelector = viewState.modelSelector.clone();
    modelSelector.addModels(addModels);
    modelSelector.dropModels(dropModels);
    viewState.modelSelector = modelSelector;
    return;
  }
}

async function applyCategorySettings(
  iModel: IModelConnection,
  viewState: ViewState,
  viewData: ViewData,
  settings?: ElementSettings,
): Promise<void> {
  const addCategories: Id64Array = [];
  const dropCategories: Id64Array = [];
  if (settings?.enabled === "show") {
    addCategories.push(...(viewData.categories?.enabled ?? []));
  } else if (settings?.enabled === "hide") {
    dropCategories.push(...(viewData.categories?.enabled ?? []));
  }
  if (settings?.disabled === "show") {
    addCategories.push(...(viewData.categories?.disabled ?? []));
  } else if (settings?.disabled === "hide") {
    dropCategories.push(...(viewData.categories?.disabled ?? []));
  }
  if (settings?.other !== "ignore") {
    const otherCategories = await queryMissingCategories(
      iModel,
      new Set([
        ...(viewData.categories?.disabled ?? []),
        ...(viewData.categories?.enabled ?? []),
      ]),
    );
    if (settings?.other === "show") {
      addCategories.push(...otherCategories);
    } else if (settings?.other === "hide") {
      dropCategories.push(...otherCategories);
    }
  }

  if (addCategories.length === 0 && dropCategories.length === 0) {
    return;
  }

  // Update model selector
  const categorySelector = viewState.categorySelector.clone();
  categorySelector.addCategories(addCategories);
  categorySelector.dropCategories(dropCategories);
  viewState.categorySelector = categorySelector;
  return;
}
