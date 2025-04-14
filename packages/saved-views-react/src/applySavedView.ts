/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  Camera,
  ViewDefinition2dProps,
  ViewDefinition3dProps,
  ViewDefinitionProps,
  ViewStateProps,
} from "@itwin/core-common";
import {
  ViewChangeOptions,
  ViewPose,
  ViewPose2d,
  ViewPose3d,
  ViewState,
  type IModelConnection,
  type Viewport,
} from "@itwin/core-frontend";
import { YawPitchRollAngles } from "@itwin/core-geometry";

import type {
  SavedViewData,
  SavedViewExtension,
  ViewData,
} from "./SavedView.js";
import {
  createViewStateFromProps,
  createViewStateProps,
} from "./createViewState.js";
import {
  extensionHandlers,
  type DefaultExtensionHandlersApplyOverrides,
} from "./translation/SavedViewsExtensionHandlers.js";

export interface ApplySavedViewSettings {
  /**
   * How to make use of captured {@link ViewState} data. The default behavior is
   * to generate a new `ViewState` object out of {@linkcode SavedViewData.viewData}
   * and apply it to viewport.
   *
   * You can optionally provide a pre-made `ViewState` instance.
   *
   * @default "apply"
   *
   * @example
   * import { applySavedView, createViewState } from "@itwin/saved-views-react";
   *
   * const viewState = await createViewState(iModel, savedViewData);
   * await Promise.all([
   *   applySavedView(iModel, viewport1, savedView, { viewState }),
   *   applySavedView(iModel, viewport2, savedView, { viewState }),
   * ]);
   */
  viewState?: ApplyStrategy | ViewState | undefined;

  /**
   * How to handle camera pose in captured data.
   * @default "apply"
   */
  camera?: ApplyStrategy | ViewPose | undefined;

  /**
   * How to handle element emphasis in captured data.
   * @default "apply"
   */
  emphasis?: ApplyStrategy | "clear" | undefined;

  /**
   * How to handle captured {@link Viewport.perModelCategoryVisibility} data.
   * @default "apply"
   */
  perModelCategoryVisibility?: ApplyStrategy | "clear" | undefined;

  /**
   * How to handle visibility of models and categories that exist in iModel but
   * are not captured in Saved View data.
   * @default "hidden"
   */
  modelAndCategoryVisibilityFallback?: "visible" | "hidden" | undefined;

  /**
   * Options forwarded to {@link Viewport.changeView}.
   * @default undefined
   */
  viewChangeOptions?: ViewChangeOptions | undefined;
}

/**
 * Controls how viewport state is going to be altered.
 *   * `"apply"` – Apply captured Saved View state to viewport
 *   * `"keep"` – Preserve current viewport state
 */
type ApplyStrategy = "apply" | "keep";

async function createSeedViewStateProps(
  iModel: IModelConnection,
  viewport: Viewport,
  savedViewData: SavedViewData,
  settings: ApplySavedViewSettings | undefined = {},
): Promise<ViewStateProps> {
  if (settings.viewState !== "keep") {
    return settings.viewState instanceof ViewState
      ? settings.viewState.toProps()
      : createViewStateProps(iModel, savedViewData.viewData);
  }
  return viewport.view.toProps();
}

function applyCameraOptions(
  seedViewStateProps: ViewStateProps,
  _iModel: IModelConnection,
  viewport: Viewport,
  savedViewData: SavedViewData,
  settings: ApplySavedViewSettings,
): ViewStateProps {
  const setCameraInfo = (
    seedViewDef: ViewStateProps,
    cameraProps: ViewPose | ViewDefinitionProps | ViewData,
    viewDataType: "iTwin3d" | "iTwinDrawing" | "iTwinSheet" = "iTwin3d"
  ): ViewStateProps => {
    if (viewDataType === "iTwin3d") {
      const viewDef =
        seedViewStateProps.viewDefinitionProps as ViewDefinition3dProps;
      if (cameraProps instanceof ViewPose3d) {
        viewDef.cameraOn = cameraProps.cameraOn;
        viewDef.origin = cameraProps.origin;
        viewDef.extents = cameraProps.extents;
        viewDef.angles = YawPitchRollAngles.createFromMatrix3d(
          cameraProps.rotation,
        )?.toJSON();
        viewDef.camera = cameraProps.camera;
      } else {
        const cameraProps3d = cameraProps as ViewDefinition3dProps;
        viewDef.cameraOn = cameraProps3d.camera !== undefined;
        viewDef.origin = cameraProps3d.origin;
        viewDef.extents = cameraProps3d.extents;
        viewDef.angles = cameraProps3d.angles;
        viewDef.camera = cameraProps3d.camera ?? new Camera();
      }
    } else {
      //2d Sheet or Drawing
      const viewDef =
        seedViewStateProps.viewDefinitionProps as ViewDefinition2dProps;
      if (cameraProps instanceof ViewPose2d) {
        viewDef.origin = cameraProps.origin;
        viewDef.delta = cameraProps.delta;
        viewDef.angle = cameraProps.angle;
      } else {
        const cameraProps2d = cameraProps as ViewDefinition2dProps;
        viewDef.origin = cameraProps2d.origin;
        viewDef.delta = cameraProps2d.delta;
        viewDef.angle = cameraProps2d.angle;
      }
    }
    return seedViewDef;
  };

  const cameraProps =
    settings.camera instanceof ViewPose
      ? settings.camera
      : settings.camera === "keep"
      ? viewport.view.toProps().viewDefinitionProps
      : savedViewData.viewData;
  setCameraInfo(seedViewStateProps, cameraProps, savedViewData.viewData.type);
  return seedViewStateProps;
}
async function applyViewStateProps(
  viewStateProps: ViewStateProps,
  iModel: IModelConnection,
  viewport: Viewport,
  savedViewData: SavedViewData,
  settings: ApplySavedViewSettings,
): Promise<void> {
  // We use "hidden" as the default value for modelAndCategoryVisibilityFallback
  // because users expect modelSelector.enabled and categorySelector.enabled to
  // act as exclusive whitelists when modelSelector.disabled or categorySelector.disabled
  // arrays are empty, respectively.
  const { modelAndCategoryVisibilityFallback = "hidden" } = settings;
  const viewState = await createViewStateFromProps(
    viewStateProps,
    iModel,
    savedViewData.viewData,
    {
      modelAndCategoryVisibilityFallback,
    },
  );
  viewport.changeView(viewState, settings.viewChangeOptions);
}

/**
 * Updates {@linkcode viewport} state to match captured Saved View.
 *
 * @example
 * // Optionally, you can create and manage ViewState object yourself to avoid redundant work,
 * // e.g. when applying the same Saved View to multiple viewports
 * const viewState = await createViewState(iModel, savedViewData);
 * await Promise.all([
 *   applySavedView(iModel, viewport1, savedView, { viewState }),
 *   applySavedView(iModel, viewport2, savedView, { viewState }),
 * ]);
 */
export async function applySavedView(
  iModel: IModelConnection,
  viewport: Viewport,
  savedViewData: SavedViewData,
  settings: ApplySavedViewSettings | undefined = {},
  overrides?: DefaultExtensionHandlersApplyOverrides,
): Promise<void> {
  let viewStateProps: ViewStateProps = await createSeedViewStateProps(
    iModel,
    viewport,
    savedViewData,
    settings,
  );
  viewStateProps = applyCameraOptions(
    viewStateProps,
    iModel,
    viewport,
    savedViewData,
    settings,
  );
  await applyViewStateProps(
    viewStateProps,
    iModel,
    viewport,
    savedViewData,
    settings,
  );

  // Reset each extension even if it's not present in the saved view data
  if (settings.emphasis !== "keep") {
    overrides?.emphasizeElements?.reset
      ? overrides?.emphasizeElements.reset(viewport)
      : extensionHandlers.emphasizeElements.reset(viewport);
  }
  if (settings.perModelCategoryVisibility !== "keep") {
    overrides?.perModelCategoryVisibility?.reset
      ? overrides?.perModelCategoryVisibility.reset(viewport)
      : extensionHandlers.perModelCategoryVisibility.reset(viewport);
  }

  const extensions = findKnownExtensions(savedViewData.extensions ?? []);
  if (extensions.emphasis) {
    const override = overrides?.emphasizeElements;
    if (settings.emphasis === "apply") {
      override?.apply
        ? override.apply(extensions.emphasis, viewport)
        : extensionHandlers.emphasizeElements.apply(
            extensions.emphasis,
            viewport,
          );
    }
  }

  if (extensions.perModelCategoryVisibility) {
    const override = overrides?.perModelCategoryVisibility;
    if (settings.perModelCategoryVisibility === "apply") {
      override?.apply
        ? override.apply(extensions.perModelCategoryVisibility, viewport)
        : extensionHandlers.perModelCategoryVisibility.apply(
            extensions.perModelCategoryVisibility,
            viewport,
          );
    }
  }
}

interface FindKnownExtensionsResult {
  emphasis: string | undefined;
  perModelCategoryVisibility: string | undefined;
}

/** Finds first occurences of known extensions. */
function findKnownExtensions(
  extensions: SavedViewExtension[],
): FindKnownExtensionsResult {
  const result: FindKnownExtensionsResult = {
    emphasis: undefined,
    perModelCategoryVisibility: undefined,
  };

  for (const extension of extensions) {
    if (
      result.emphasis === undefined &&
      extension.extensionName ===
        extensionHandlers.emphasizeElements.extensionName
    ) {
      result.emphasis = extension.data;
      if (result.perModelCategoryVisibility) {
        break;
      }
    }

    if (
      result.perModelCategoryVisibility === undefined &&
      extension.extensionName ===
        extensionHandlers.perModelCategoryVisibility.extensionName
    ) {
      result.perModelCategoryVisibility = extension.data;
      if (result.emphasis) {
        break;
      }
    }

    if (result.emphasis && result.perModelCategoryVisibility) {
      break;
    }
  }

  return result;
}
