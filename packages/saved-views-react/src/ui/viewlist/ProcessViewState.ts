/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { UiFramework } from "@itwin/appui-react";
import { Logger } from "@itwin/core-bentley";
import { QueryRowFormat, RenderSchedule, type ViewDefinitionProps } from "@itwin/core-common";
import {
  DisplayStyle3dState, IModelApp, ScreenViewport, type IModelConnection, type Viewport, type ViewState,
} from "@itwin/core-frontend";

import { IModelConnectionCache } from "../../api/caches/IModelConnectionCache";
import type { IDefaultViewIdClient } from "../../api/clients/DefaultViewIdClient";
import { isSavedView3d } from "../../api/clients/ISavedViewsClient";
import { SavedViewEvents, SavedViewsManager } from "../../api/SavedViewsManager";
import { getTargetViewport, type TargetViewport } from "../../api/TargetViewport";
import { type LegacySavedViewBase, type SavedViewBaseSetting } from "../../api/utilities/SavedViewTypes";
import { SavedViewUtil } from "../../api/utilities/SavedViewUtil";
import { ViewCreator } from "../../api/utilities/ViewCreator";
import { ModelCategoryOverrideProvider } from "./ModelCategoryOverrideProvider";

type cacheObject = {
  allModelIds: Set<string>;
  allCategoryIds: Set<string>;
};

export type ViewStateAndSetting = {
  viewState: ViewState;
  viewSetting: SavedViewBaseSetting;
};

const LOGGERCATEGORY = "ITwinSavedViews";
const selectScheduleScript =
  "Select bis.Displaystyle3d.ECInstanceId, json_extract(bis.Displaystyle3d.jsonProperties, '$.styles.scheduleScript') as scheduleScript From bis.Displaystyle3d Where json_extract(bis.Displaystyle3d.jsonProperties, '$.styles.scheduleScript') IS NOT NULL";

/** Processes a view selected by applying the view state, shows errors to the user if the view state is undefined */
export const processViewStateSelected = async (
  connection: IModelConnection,
  viewState: ViewState | undefined,
  want2dViews: boolean,
  applyCameraOnly: boolean,
  turnOnModelsCategories: boolean,
  view?: LegacySavedViewBase,
  allModelIds?: Set<string>,
  allCategoryIds?: Set<string>,
  isDesktopView?: boolean,
  targetViewport: TargetViewport = "selected",
) => {
  const vp: Viewport | undefined = getTargetViewport(targetViewport);
  if (!vp || !viewState) {
    SavedViewUtil.showError("GroupList", "listTools.error_loadView_brief", "listTools.error_loadView");
    return;
  }

  const shouldInclude3dViews = !want2dViews;
  if (shouldInclude3dViews && viewState.is3d()) {
    // Set ground bias from shared settings
    if (SavedViewsManager.setMapElevation) {
      await SavedViewsManager.setMapElevation(vp);
    }

    // If the view has a timepoint saved (Saved View Created from a Schedule View), load the
    // schedule script and provide it to the saved view since it omittied because of size.
    if (
      view &&
      isSavedView3d(view) &&
      view.displayStyleProps.jsonProperties?.styles?.timePoint &&
      !viewState.displayStyle.scheduleScript
    ) {
      const iModelConnection = connection;
      if (iModelConnection) {
        try {
          const sqlReader = iModelConnection.createQueryReader(
            selectScheduleScript,
            undefined,
            { rowFormat: QueryRowFormat.UseJsPropertyNames },
          );
          const result = await sqlReader.toArray();
          for (const row of result) {
            if (row) {
              const props: RenderSchedule.ScriptProps = JSON.parse(row.scheduleScript);
              const scheduleScript = RenderSchedule.Script.fromJSON(props);
              view.displayStyleProps.id = row.id as string;
              viewState.displayStyle = new DisplayStyle3dState(view.displayStyleProps, iModelConnection);
              viewState.displayStyle.scheduleScript = scheduleScript;
              break;
            }
          }
        } catch (ex) {
          let error = "Unknown Error";
          if (ex instanceof Error) {
            error = ex.message;
          } else if (typeof ex === "string") {
            error = ex;
          }
          Logger.logError(LOGGERCATEGORY, "error restoring schedule script", () => { error; });
        }
      }
    }
  }

  // Clear all overrides
  if (!applyCameraOnly) {
    await clearAllOverrides();
  }

  // Apply the valid state
  applyViewState(viewState, vp, applyCameraOnly);

  // Apply all colorization and alwaysDrawn/neverDrawn flags
  if (view && !applyCameraOnly) {
    await SavedViewUtil.setupOverrides(view, vp);
  }

  // Turn on all models/categories in the view state
  if (
    (turnOnModelsCategories || !view) &&
    allModelIds !== undefined &&
    allCategoryIds !== undefined
  ) {
    if (!isDesktopView) {
      // Cache all models/categories if necessary
      const cache: cacheObject = await cacheAllModelsCategories(connection, allModelIds, allCategoryIds);
      // Turn on all models
      await vp.addViewedModels(cache.allModelIds);
      // Turn on all categories and their subcategories
      vp.changeCategoryDisplay(cache.allCategoryIds, true, true);
    }
    // Clear all per-model category visibility settings
    vp.perModelCategoryVisibility.clearOverrides();
  }

  // Refresh on UI changes
  SavedViewsManager.ON_SAVED_VIEW_DATA_CHANGED.raiseEvent([{ viewState }]);

  Logger.logInfo("ProcessViewState", "Applied View State Successfully");
};

async function clearAllOverrides(): Promise<void> {
  const clearHideIsolateEmphizeElements = async (vp: ScreenViewport) => {
    const subcatProvider = vp.findFeatureOverrideProviderOfType(ModelCategoryOverrideProvider);
    if (subcatProvider) {
      vp.dropFeatureOverrideProvider(subcatProvider);
    }

    await Promise.all([
      UiFramework.hideIsolateEmphasizeActionHandler.processClearEmphasize(),
      UiFramework.hideIsolateEmphasizeActionHandler.processClearOverrideCategories(),
      UiFramework.hideIsolateEmphasizeActionHandler.processClearOverrideModels(),
    ]);
  };

  await applyVisibilityOverrideToViewports(clearHideIsolateEmphizeElements);
}

async function applyVisibilityOverrideToViewports(
  visibilityFunc: (vp: ScreenViewport) => void | Promise<void>,
): Promise<void> {
  const contentGroup = UiFramework.frontstages.activeFrontstageDef?.contentGroup;
  if (contentGroup) {
    const contentControls = contentGroup.getContentControls();
    for (const cc of contentControls) {
      if (cc.isViewport && cc.viewport) {
        const contentProp = contentGroup.contentPropsList.find((prop) => prop.id === cc.uniqueId);
        if (
          !contentProp?.applicationData ||
          !Object.prototype.hasOwnProperty.call(contentProp?.applicationData, "disableVisibilityOverrides") ||
          contentProp?.applicationData["disableVisibilityOverrides"] === false
        ) {
          await visibilityFunc(cc.viewport);
        }
      }
    }
  }

  UiFramework.getIModelConnection()?.selectionSet.emptyAll();
}

/** Applies a view state, also sets up default viewFlags if needed and triggers refresh events */
const applyViewState = (viewState: ViewState, vp: Viewport, applyCameraOnly: boolean) => {
  // Change viewport or setup from frustum based on applyCameraOnly
  if (applyCameraOnly) {
    const frustum = viewState.calculateFrustum();
    if (!frustum) {
      throw new Error("Problem calculating frustum to apply camera only");
    }

    vp.setupViewFromFrustum(frustum);
    IModelApp.viewManager.selectedView?.animateFrustumChange();
  } else {
    vp.changeView(viewState);
  }

  // Track application of a saved view
  SavedViewsManager.trackEvent(SavedViewEvents.SavedViewsApply);
};

/** Caches all models and categories by querying the Db and storing the sets of ids */
const cacheAllModelsCategories = async (
  connection: IModelConnection,
  allModelIds: Set<string>,
  allCategoryIds: Set<string>,
): Promise<cacheObject> => {
  if (allModelIds.values.length === 0) {
    allModelIds = new Set(await ViewCreator.getAllModels(connection));
  }

  if (allCategoryIds.values.length === 0) {
    allCategoryIds = new Set(await ViewCreator.getAllCategories(connection));
  }

  return { allModelIds, allCategoryIds };
};

export const applyView = async (
  connection: IModelConnection,
  isSavedView: boolean,
  view: LegacySavedViewBase | ViewDefinitionProps,
  want2dViews: boolean,
  applyCameraOnly: boolean,
  turnOnModelsCategories: boolean,
  allModelIds?: Set<string>,
  allCategoryIds?: Set<string>,
): Promise<ViewState | undefined> => {
  const iModelConnection = connection;
  if (!view.id) {
    return undefined;
  }

  const client = IModelConnectionCache.getSavedViewCache(iModelConnection);
  const viewState = isSavedView
    ? await client.getViewState(
      iModelConnection,
      view as LegacySavedViewBase,
      SavedViewsManager.onViewSourceNotFound,
      SavedViewsManager.state?.turnOnModelsCategoriesNotHidden,
    )
    : await iModelConnection.views.load(view.id);

  if (viewState) {
    await processViewStateSelected(
      iModelConnection,
      viewState,
      want2dViews ?? false,
      applyCameraOnly,
      turnOnModelsCategories,
      isSavedView ? (view as LegacySavedViewBase) : undefined,
      allModelIds,
      allCategoryIds,
    );

    if (isSavedView === true) {
      connection.selectionSet.emptyAll();
    }

    // Track application of saved view
    SavedViewsManager.trackEvent(SavedViewEvents.SavedViewsApply);
  }
  return viewState;
};

export const applyDefaultSavedView = async (
  connection: IModelConnection,
  defaultViewIdClient: IDefaultViewIdClient = SavedViewsManager.defaultSavedViewIdClient,
): Promise<ViewStateAndSetting | undefined> => {
  const { iTwinId, iModelId } = connection;
  if (!iModelId || !iTwinId) {
    throw new Error("iModelId/iTwinId not defined!");
  }
  const viewId = await defaultViewIdClient.getDefaultSavedViewId(iTwinId, iModelId);
  if (!viewId) {
    return undefined;
  }
  const cache = IModelConnectionCache.getSavedViewCache(connection);
  const views = await cache.getSavedViews(connection);
  const defaultView: LegacySavedViewBase | undefined = views.find((view) => {
    if (view.id === viewId) {
      return view;
    }

    return undefined;
  });
  if (defaultView) {
    const isSavedView = true;
    const want2dViews = false;
    const applyCameraOnly = false;
    const turnOnModelsCategories = false;
    const savedViewState = await applyView(
      connection,
      isSavedView,
      defaultView,
      want2dViews,
      applyCameraOnly,
      turnOnModelsCategories,
    );
    if (savedViewState) {
      UiFramework.setDefaultViewState(savedViewState);
      const savedViewSetting = await SavedViewsManager.savedViewsClient.getViewSetting(
        viewId,
        iTwinId,
        iModelId,
        SavedViewsManager.viewSettingsNamespace,
      );

      return { viewState: savedViewState, viewSetting: savedViewSetting };
    }
  }
  return undefined;
};
