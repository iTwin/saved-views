/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Camera } from "@itwin/core-common";
import {
  ViewChangeOptions,
  ViewPose,
  ViewPose2d,
  ViewPose3d,
  ViewState,
  type IModelConnection,
  type Viewport,
} from "@itwin/core-frontend";
import {
  Angle,
  Point2d,
  Point3d,
  Vector3d,
  YawPitchRollAngles,
} from "@itwin/core-geometry";

import type { SavedViewData, SavedViewExtension } from "./SavedView.js";
import { createViewState } from "./createViewState.js";
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
  if (settings.viewState !== "keep" || settings.camera !== "keep") {
    // We use "hidden" as the default value for modelAndCategoryVisibilityFallback
    // because users expect modelSelector.enabled and categorySelector.enabled to
    // act as exclusive whitelists when modelSelector.disabled or categorySelector.disabled
    // arrays are empty, respectively.
    const { modelAndCategoryVisibilityFallback = "hidden" } = settings;
    const baseView =
      settings.viewState !== "keep"
        ? settings.viewState
        : viewport.view.clone();
    const viewState =
      baseView instanceof ViewState
        ? baseView
        : await createViewState(
            iModel,
            settings.viewState !== "keep"
              ? savedViewData.viewData
              : viewport.view,
            {
              modelAndCategoryVisibilityFallback,
            },
          );

    if (settings.camera instanceof ViewPose) {
      viewState.applyPose(settings.camera);
    } else if (settings.camera === "keep") {
      viewState.applyPose(viewport.view.savePose());
    } else if (settings.viewState === "keep") {
      const data = savedViewData.viewData;
      const pose: ViewPose =
        data.type === "iTwin3d"
          ? new ViewPose3d({
              isCameraOn: data.camera !== undefined,
              origin: Point3d.fromJSON(data.origin),
              extents: Vector3d.fromJSON(data.extents),
              rotation: YawPitchRollAngles.fromJSON(data.angles).toMatrix3d(),
              camera: new Camera(data.camera),
            })
          : new ViewPose2d({
              isCameraOn: false,
              origin2d: Point2d.fromJSON(data.origin),
              delta: Point2d.fromJSON(data.delta),
              angle: Angle.fromJSON(data.angle),
            });
      viewState.applyPose(pose);
    }

    viewport.changeView(viewState, settings.viewChangeOptions);
  }

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
