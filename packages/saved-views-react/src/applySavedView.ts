/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { ViewState, type IModelConnection, type Viewport } from "@itwin/core-frontend";
import { type SavedViewRepresentation } from "@itwin/saved-views-client";

import { createViewState } from "./createViewState.js";
import { extensionHandlers, type ExtensionHandler } from "./translation/SavedViewsExtensionHandlers.js";

export interface ApplySavedViewSettings {
  /**
   * Strategy to use when other setting does not specify one. By default, viewport is reset to default state and then
   * all captured Saved View data is applied on top.
   * @default "apply"
   *
   * @example
   * await applySavedView(iModel, viewport, savedView, { all: "keep", viewState: "apply" });
   */
  all?: ApplyStrategy | undefined;

  /**
   * How to handle captured {@link ViewState} data. The default behavior is to generate a new `ViewState` object and
   * apply it to viewport.
   *
   * You can optionally provide a pre-made `ViewState` instance to conserve resources. It is usually obtained from
   * {@link createViewState} result.
   *
   * @example
   * import { applySavedView, createViewState } from "@itwin/saved-views-react";
   *
   * const viewState = await createViewState(iModel, savedView);
   * await Promise.all([
   *   applySavedView(iModel, viewport1, savedView, { viewState }),
   *   applySavedView(iModel, viewport2, savedView, { viewState }),
   * ]);
   */
  viewState?: ApplyStrategy | ViewState | undefined;

  /**
   * How to handle visibility of models and categories that exist in iModel but are not captured in Saved View data. Has
   * effect only when `modelAndCategoryVisibility` strategy is set to `"apply"`.
   * @default "hidden"
   */
  modelAndCategoryVisibilityFallback?: "visible" | "hidden" | undefined;

  /** How to handle captured element emphasis data. In default state emphasis is turned off. */
  emphasis?: ApplyStrategy | undefined;

  /**
   * How to handle captured {@link Viewport.perModelCategoryVisibility} data. In default state no overrides are present.
   */
  perModelCategoryVisibility?: ApplyStrategy | undefined;
}

/**
 * Controls how viewport state is going to be altered.
 *
 * * `"apply"` – Apply captured Saved View state. Falls back to `"reset"` on failure (e.g. missing Saved View data).
 * * `"reset"` – Reset to the default viewport state
 * * `"keep"` – Keep the current viewport state
 */
type ApplyStrategy = "apply" | "reset" | "keep";

/**
 * Updates {@linkcode viewport} state to match captured Saved View.
 *
 * @example
 * // Optionally, you can create and manage ViewState object yourself to avoid redundant work,
 * // e.g. when applying the same Saved View to multiple viewports
 * const viewState = await createViewState(iModel, savedView);
 * await Promise.all([
 *   applySavedView(iModel, firstViewport, savedView, { viewState }),
 *   applySavedView(iModel, secondViewport, savedView, { viewState }),
 * ]);
 */
export async function applySavedView(
  iModel: IModelConnection,
  viewport: Viewport,
  savedViewData: Pick<SavedView, "viewData" | "extensions">,
  settings: ApplySavedViewSettings | undefined = {},
): Promise<void> {
  const defaultStrategy = settings.all ?? "apply";

  if ((settings.viewState ?? defaultStrategy) !== "keep") {
    if (settings.viewState instanceof ViewState) {
      viewport.changeView(settings.viewState);
    } else if (savedViewData.viewData) {
      const { modelAndCategoryVisibilityFallback } = settings;
      const viewState = await createViewState(iModel, savedViewData.viewData, { modelAndCategoryVisibilityFallback });
      viewport.changeView(viewState);
    }
  }

  const extensions = new Map(savedViewData.extensions?.map(({ extensionName, data }) => [extensionName, data]));
  const processExtension = (extensionHandler: ExtensionHandler, strategy: ApplyStrategy = defaultStrategy) => {
    if (strategy === "keep") {
      return;
    }

    extensionHandler.reset(viewport);
    if (strategy === "apply") {
      const extensionData = extensions.get(extensionHandler.extensionName);
      if (extensionData) {
        extensionHandler.apply(extensionData, viewport);
      }
    }
  };

  processExtension(extensionHandlers.emphasizeElements, settings.emphasis);
  processExtension(extensionHandlers.perModelCategoryVisibility, settings.perModelCategoryVisibility);
}
