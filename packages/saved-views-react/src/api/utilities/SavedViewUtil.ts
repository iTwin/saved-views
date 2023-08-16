/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { getClassName } from "@itwin/appui-abstract";
import { Guid, Logger } from "@itwin/core-bentley";
import {
  Code, type ImageBuffer, type SheetProps, type SpatialViewDefinitionProps, type ViewDefinitionProps,
  type ViewStateProps,
} from "@itwin/core-common";
import {
  DrawingViewState, EmphasizeElements, IModelApp, NotifyMessageDetails, OutputMessagePriority, SheetViewState,
  SpatialViewState, ViewState3d, getCenteredViewRect, getCompressedJpegFromCanvas, imageBufferToBase64EncodedPng,
  imageBufferToCanvas, type IModelConnection, type ViewState, type Viewport,
} from "@itwin/core-frontend";
import { Point2d } from "@itwin/core-geometry";
import * as matcher from "matcher";

import { ModelCategoryOverrideProvider } from "../../ui/viewlist/ModelCategoryOverrideProvider";
import { SavedViewEvents, SavedViewsManager } from "../SavedViewsManager";
import { getTargetViewport, type TargetViewport } from "../TargetViewport";
import { ModelsAndCategoriesCache } from "../caches/ModelsAndCategoriesCache";
import { isDrawingSavedView, isSheetSavedView, isSpatialSavedView } from "../clients/ISavedViewsClient";
import {
  type PerModelCategoryVisibilityProps, type SavedView, type SavedView2d, type SavedViewBase,
} from "./SavedViewTypes";

const getThumbnail = (vp: Viewport, width: number, height: number): ImageBuffer | undefined => {
  // Passing in vp.target.viewRect instead of vp.viewRect because currently vp.viewRect is not updated
  // correctly in some cases when a new dialog is created. The bottom property would be 2px
  // higher than the renderRect in readImageBuffer which caused the method to return undefined.
  // vp.target.viewRect allows us to have the correct dimensions when creating the thumbnail.
  const thumbnail = vp.readImageBuffer({
    rect: getCenteredViewRect(vp.target.viewRect),
    size: new Point2d(width, height),
  });
  if (thumbnail) {
    return thumbnail;
  }

  // Since using vp.target.viewRect while creating thumbnail returns undefined for some,
  // we switch back to using vp.viewRect and log the usage
  Logger.logInfo(
    "SavedViewUtil:getThumbnail",
    "vp.target.viewRect failed to generate thumbnail, switching to vp.viewRect",
  );
  return vp.readImageBuffer({
    rect: getCenteredViewRect(vp.viewRect),
    size: new Point2d(width, height),
  });
};

/**
 * Collection of helper methods various uses across this package
 */
export class SavedViewUtil {
  /**
   * @deprecated Since 1.13.1
   *
   * This method will be removed in version 2.0 in favor of a method whose name more accurately reflects what the method is doing.
   *
   * @description Used to generate an uncompressed thumbnail encoded in Base64
   * @param vp
   * @param width
   * @param height
   */
  public static generateThumbnailUncompressed(vp: Viewport, width = 282, height = 200): string | undefined {
    const thumbnail: ImageBuffer | undefined = getThumbnail(vp, width, height);
    if (thumbnail) {
      return imageBufferToBase64EncodedPng(thumbnail);
    }

    return undefined;
  }

  /**
   * Generates a thumbnail based on the viewport passed.
   * TODO: Turn off selection highlight, decorators, etc before generating the thumbnail
   * @param vp Viewport to use for the thumbnail generation
   */
  public static generateThumbnail(vp: Viewport, width = 280, height = 200): string | undefined {
    const thumbnail: ImageBuffer | undefined = getThumbnail(vp, width, height);
    if (thumbnail) {
      const canvas = imageBufferToCanvas(thumbnail);
      if (canvas) {
        if (SavedViewsManager.flags.usePublicReadWriteClient) {
          return canvas.toDataURL("image/png", 1.0);
        }
        return getCompressedJpegFromCanvas(canvas);
      }
    }

    // Log warnings when failing to generate thumbnails
    Logger.logWarning(
      SavedViewsManager.loggerCategory(getClassName(this)),
      "Generation of thumbnail failed. Viewport",
      () => {
        return {
          viewportDefined: vp !== undefined,
          viewStateJson: vp.view.toJSON(),
          width,
          height,
          rect: getCenteredViewRect(vp.viewRect),
        };
      },
    );
    return undefined;
  }

  /** Creates a drawing saved view object */
  private static _createDrawingSavedViewObject(
    vp: Viewport,
    name: string,
    userId?: string,
    shared?: boolean,
  ): SavedView2d {
    const viewState = vp.view as DrawingViewState;
    if (!viewState) {
      throw new Error("Invalid viewport");
    }

    const thumbnail = SavedViewUtil.generateThumbnail(vp);
    const categorySelectorProps = viewState.categorySelector.toJSON();
    const viewDefinitionProps = viewState.toJSON();
    const displayStyleProps = viewState.displayStyle.toJSON();
    const ee = EmphasizeElements.get(vp);
    const emphasizeElementsProps = ee ? ee.toJSON(vp) : undefined;

    const provider = vp.findFeatureOverrideProviderOfType<ModelCategoryOverrideProvider>(ModelCategoryOverrideProvider);
    const visibilityOverrideProps = provider?.toJSON();

    return {
      id: Guid.createValue(),
      is2d: true,
      groupId: SavedViewsManager.ungroupedId,
      name,
      userId,
      shared: shared ? shared : false,
      categorySelectorProps,
      viewDefinitionProps,
      displayStyleProps,
      emphasizeElementsProps,
      thumbnail,
      visibilityOverrideProps,
    };
  }

  /** Creates a sheet saved view object */
  private static _createSheetSavedViewObject(
    vp: Viewport,
    name: string,
    userId?: string,
    shared?: boolean,
  ): SavedView2d {
    const viewState = vp.view as SheetViewState;
    if (!viewState) {
      throw new Error("Invalid viewport");
    }

    const thumbnail = SavedViewUtil.generateThumbnail(vp);

    const categorySelectorProps = viewState.categorySelector.toJSON();
    const viewDefinitionProps = viewState.toJSON();
    const displayStyleProps = viewState.displayStyle.toJSON();
    const sheetSize = viewState.sheetSize;
    const sheetAttachments = viewState.attachmentIds;
    const sheetProps: SheetProps = {
      width: sheetSize.x,
      height: sheetSize.y,
      model: viewState.model,
      classFullName: SheetViewState.classFullName,
      code: Code.createEmpty(),
    };
    const ee = EmphasizeElements.get(vp);
    const emphasizeElementsProps = ee?.toJSON(vp);

    const provider =
      vp.findFeatureOverrideProviderOfType<ModelCategoryOverrideProvider>(ModelCategoryOverrideProvider);
    const visibilityOverrideProps = provider?.toJSON();

    return {
      id: Guid.createValue(),
      is2d: true,
      groupId: SavedViewsManager.ungroupedId,
      name,
      userId,
      shared: shared ? shared : false,
      categorySelectorProps,
      viewDefinitionProps,
      displayStyleProps,
      sheetProps,
      sheetAttachments,
      emphasizeElementsProps,
      thumbnail,
      visibilityOverrideProps,
    };
  }

  /** Create 3D spatial saved view object */
  private static _createSpatialSavedViewObject(
    vp: Viewport,
    name: string,
    userId?: string,
    shared?: boolean,
  ): SavedView {
    const viewState = vp.view as SpatialViewState;
    if (!viewState) {
      throw new Error("Invalid viewport");
    }

    const thumbnail = SavedViewUtil.generateThumbnail(vp);

    const categorySelectorProps = viewState.categorySelector.toJSON();
    const modelSelectorProps = viewState.modelSelector.toJSON();
    const displayStyleProps = viewState.displayStyle.toJSON();

    // Omit the schedule script - may cause excessively large JSON.
    if (displayStyleProps.jsonProperties?.styles?.scheduleScript) {
      displayStyleProps.jsonProperties.styles.scheduleScript = undefined;
    }

    const viewDefinitionProps =
      viewState.toJSON() as SpatialViewDefinitionProps;
    const ee = EmphasizeElements.getOrCreate(vp);
    const emphasizeElementsProps = ee ? ee.toJSON(vp) : undefined;
    const perModelCategoryVisibility: PerModelCategoryVisibilityProps[] = [];

    for (const overrideEntry of vp.perModelCategoryVisibility) {
      perModelCategoryVisibility.push({
        modelId: overrideEntry.modelId,
        categoryId: overrideEntry.categoryId,
        visible: overrideEntry.visible,
      });
    }

    const provider =
      vp.findFeatureOverrideProviderOfType<ModelCategoryOverrideProvider>(ModelCategoryOverrideProvider);
    const visibilityOverrideProps = provider ? provider.toJSON() : undefined;

    return {
      id: Guid.createValue(),
      is2d: false,
      groupId: SavedViewsManager.ungroupedId,
      name,
      userId,
      shared: shared ? shared : false,
      categorySelectorProps,
      modelSelectorProps,
      displayStyleProps,
      viewDefinitionProps,
      emphasizeElementsProps,
      perModelCategoryVisibility,
      thumbnail,
      visibilityOverrideProps,
    };
  }

  private static _createSavedViewObject(
    vp: Viewport,
    name: string,
    userId?: string,
    shared?: boolean,
  ): SavedViewBase {
    if (vp.view.isSpatialView()) {
      return this._createSpatialSavedViewObject(vp, name, userId, shared);
    } else if (vp.view.isDrawingView()) {
      return this._createDrawingSavedViewObject(vp, name, userId, shared);
    } else {
      return this._createSheetSavedViewObject(vp, name, userId, shared);
    }
  }

  /**
   * Creates a saved view object from the viewport, it could return a
   * SavedView2d (Sheet or Drawings) or a SavedView (Spatial views) object
   */
  public static async createSavedViewObject(
    vp: Viewport,
    name: string,
    userId?: string,
    shared?: boolean,
  ): Promise<SavedViewBase> {
    const savedView = SavedViewUtil._createSavedViewObject(vp, name, userId, shared);
    if (SavedViewsManager.flags.supportHiddenModelsAndCategories) {
      await ModelsAndCategoriesCache.getCache(vp.iModel).setHiddenModelsAndCategories(savedView);
    }
    return savedView;
  }

  /** Creates a spatial view state from the saved view object props */
  private static async _createSpatialViewState(
    iModelConnection: IModelConnection,
    savedView: SavedView,
    _onSourceNotFound?: () => void,
  ): Promise<SpatialViewState | undefined> {
    const props: ViewStateProps = {
      viewDefinitionProps: savedView.viewDefinitionProps,
      categorySelectorProps: savedView.categorySelectorProps,
      modelSelectorProps: savedView.modelSelectorProps,
      displayStyleProps: savedView.displayStyleProps,
    };
    const viewState = SpatialViewState.createFromProps(props, iModelConnection);
    await viewState.load();
    return viewState;
  }

  /** Creates a drawing view state from the data object */
  private static async _createDrawingViewState(
    iModelConnection: IModelConnection,
    savedView: SavedView2d,
  ): Promise<DrawingViewState | undefined> {
    const props: ViewStateProps = {
      viewDefinitionProps: savedView.viewDefinitionProps,
      categorySelectorProps: savedView.categorySelectorProps,
      displayStyleProps: savedView.displayStyleProps,
    };
    const viewState = DrawingViewState.createFromProps(props, iModelConnection) as DrawingViewState;
    await viewState.load();
    return viewState;
  }

  /** Creates a sheet view state from the data object */
  private static async _createSheetViewState(
    iModelConnection: IModelConnection,
    savedView: SavedView2d,
  ): Promise<SheetViewState | undefined> {
    if (
      savedView.sheetProps === undefined ||
      savedView.sheetAttachments === undefined
    ) {
      return undefined;
    }
    const props: ViewStateProps = {
      viewDefinitionProps: savedView.viewDefinitionProps,
      categorySelectorProps: savedView.categorySelectorProps,
      displayStyleProps: savedView.displayStyleProps,
      sheetProps: savedView.sheetProps,
      sheetAttachments: savedView.sheetAttachments,
    };
    const viewState = SheetViewState.createFromProps(props, iModelConnection);
    await viewState.load();
    return viewState;
  }

  /**
   * Creates a ViewState from a SavedView object returned by the SavedViewsClient
   * @param iModelConnection IModelConnection to use for requesting source view states
   * @param savedView SavedView object obtained from SavedViewsClient
   */
  public static async createViewState(
    iModelConnection: IModelConnection,
    savedView: SavedViewBase,
    _onSourceNotFound?: () => void,
  ): Promise<ViewState | undefined> {
    if (isSpatialSavedView(savedView)) {
      return this._createSpatialViewState(iModelConnection, savedView as SavedView);
    } else if (isDrawingSavedView(savedView)) {
      return this._createDrawingViewState(iModelConnection, savedView as SavedView2d);
    } else if (isSheetSavedView(savedView)) {
      return this._createSheetViewState(iModelConnection, savedView as SavedView2d);
    }

    return undefined;
  }

  /** Setup the overrides of the viewport based on the saved view when using the ReadonlyClient*/
  private static async applyExtensionOverrides(view: SavedViewBase, vp: Viewport) {
    // Clear the current if there's any (this should always happen, even if there are no extensions)
    if (EmphasizeElements.get(vp)) {
      EmphasizeElements.clear(vp);
      vp.isFadeOutActive = false;
    }

    for (const extHandler of SavedViewsManager.extensionHandlers) {
      const extData = view.extensions?.get(extHandler.extensionName);
      if (extData) {
        await extHandler.onViewApply(extData, vp);
      }
    }
  }

  /** Setup the overrides of the viewport based on the saved view */
  public static async setupOverrides(view: SavedViewBase, vp: Viewport) {
    await SavedViewUtil.applyExtensionOverrides(view, vp);
  }

  private static _urlTemplate = "";

  public static setUrlTemplate(template: string) {
    SavedViewUtil._urlTemplate = template;
  }

  public static generateAndCopyUrl(savedView: SavedViewBase) {
    const urlToCopyStr = SavedViewUtil._urlTemplate || window.location.href;
    const urlToCopy = new URL(urlToCopyStr);
    urlToCopy.searchParams.set("shareViewId", savedView.id);
    navigator.clipboard.writeText(urlToCopy.href).catch(() => { });
  }

  public static showError(component: string, briefKey: string, detailedKey: string, error?: Error) {
    if (!SavedViewsManager.state!.displayErrors) {
      return;
    }

    const briefError = SavedViewsManager.translate(briefKey);
    const detailed = SavedViewsManager.translate(detailedKey);
    IModelApp.notifications.outputMessage(
      new NotifyMessageDetails(OutputMessagePriority.Error, briefError, detailed),
    );
    Logger.logInfo(
      SavedViewsManager.loggerCategory(getClassName(this)),
      `${component} Error: ${briefError}: ${detailed} ${error ? `- ${error.toString()}` : ""}`,
    );
  }

  public static showSuccess(component: string, briefKey: string, detailedKey?: string) {
    if (!SavedViewsManager.state!.displaySuccess) {
      return;
    }

    const brief = SavedViewsManager.translate(briefKey);
    const detailed = detailedKey
      ? SavedViewsManager.translate(detailedKey)
      : brief;
    IModelApp.notifications.outputMessage(new NotifyMessageDetails(OutputMessagePriority.Info, brief, detailed));
    Logger.logInfo(
      SavedViewsManager.loggerCategory(getClassName(this)),
      `${component} success: ${brief}: ${detailed}`,
    );
  }

  public static isSavedView(view: SavedViewBase | ViewDefinitionProps) {
    return (
      (view as SavedView).shared !== undefined &&
      (view as SavedView).name !== undefined
    );
  }

  // TODO: This will need to handle SavedViewBase instead of SavedView when we update widget to handle 2D
  public static getFilteredViews(
    views: SavedView[] | ViewDefinitionProps[],
    filter: string,
    searchTags: string[],
  ) {
    if (!views) {
      return [];
    }

    if (views.length === 0 || (!filter && searchTags.length === 0)) {
      return views;
    }

    if (SavedViewUtil.isSavedView(views[0])) {
      return (views as SavedView[]).filter((view: SavedView) => {
        const viewNameContainsFilter =
          !!filter &&
          view.name.toLowerCase().indexOf(filter.toLowerCase()) >= 0;
        const viewNameIsMatch = matcher.isMatch(view.name, filter);
        const viewTagMatchesSearchTags =
          typeof view.tags?.find((tag) => searchTags.includes(tag.name)) !==
          "undefined";
        return (
          viewNameContainsFilter || viewNameIsMatch || viewTagMatchesSearchTags
        );
      });
    } else if (filter.length > 0) {
      return (views as ViewDefinitionProps[]).filter((viewProps) => {
        // Filter the definitions by user label
        if (viewProps.userLabel) {
          return (
            viewProps.userLabel.toLowerCase().indexOf(filter.toLowerCase()) >=
              0 || matcher.isMatch(viewProps.userLabel, filter)
          );
        } else if (viewProps.code && viewProps.code.value) {
          return (
            viewProps.code.value.toLowerCase().indexOf(filter.toLowerCase()) >=
              0 || matcher.isMatch(viewProps.code.value, filter)
          );
        }

        return false;
      });
    } else {
      // If filtering by tags, don't show desktop views
      return [];
    }
  }

  public static async updateViewStateFromHiddenContent(
    viewState: ViewState,
    savedView: SavedViewBase,
    iModel: IModelConnection,
  ) {
    const modelsAndCategoriesCache = ModelsAndCategoriesCache.getCache(iModel);
    if (
      !modelsAndCategoriesCache.hasValidHiddenModelsAndCategories(savedView)
    ) {
      if (!IModelApp.viewManager.selectedView) {
        IModelApp.viewManager.onViewOpen.addOnce((_vp) => SavedViewsManager.onHiddenModelsAndCategoriesNotSupported());
      } else {
        SavedViewsManager.onHiddenModelsAndCategoriesNotSupported();
      }
    } else {
      await modelsAndCategoriesCache.updateView(viewState, savedView);
    }
  }

  public static async applyView(
    iModelConnection: IModelConnection,
    savedView: SavedViewBase,
    forceFilterContent?: boolean,
    targetViewport: TargetViewport = "selected",
  ) {
    const viewState = await SavedViewUtil.createViewState(iModelConnection, savedView);
    if (
      !forceFilterContent &&
      viewState &&
      SavedViewsManager.enableHiddenModelsAndCategoriesApplyOptionAsDefault
    ) {
      await SavedViewUtil.updateViewStateFromHiddenContent(viewState, savedView, iModelConnection);
    }

    const vp: Viewport | undefined = getTargetViewport(targetViewport);

    if (!vp || !viewState) {
      return;
    }

    // if the view of the viewport is also 3d,
    // use it to override the view state's groundBias and planarClipMask
    if (vp.view.is3d()) {
      const backgroundMapProps =
        viewState.displayStyle.backgroundMapSettings.toJSON();
      backgroundMapProps.groundBias =
        vp.view.displayStyle.backgroundMapSettings.groundBias;
      backgroundMapProps.planarClipMask =
        vp.view.displayStyle.backgroundMapSettings.planarClipMask?.toJSON();
      viewState.displayStyle.changeBackgroundMapProps(backgroundMapProps);
    }

    if (vp.view instanceof ViewState3d && vp.view.displayStyle.scheduleScript) {
      await (viewState as ViewState3d)
        .getDisplayStyle3d()
        .changeRenderTimeline(vp.view.displayStyle.settings.renderTimeline);
    }

    // Clear emphasize elements
    if (EmphasizeElements.get(vp)) {
      EmphasizeElements.clear(vp);
    }

    // Apply the valid state
    vp.changeView(viewState);

    // Track application of a saved view
    SavedViewsManager.trackEvent(SavedViewEvents.SavedViewsApply);

    // Apply all colorization and alwaysDrawn/neverDrawn flags
    await SavedViewUtil.setupOverrides(savedView, vp);
  }
}
