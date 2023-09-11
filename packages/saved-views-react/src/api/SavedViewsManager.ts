/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { getClassName, UiError } from "@itwin/appui-abstract";
import { ReducerRegistryInstance, StateManager, SyncUiEventDispatcher, UiFramework } from "@itwin/appui-react";
import { BeEvent, type AccessToken } from "@itwin/core-bentley";
import { IModelReadRpcInterface, RenderMode, type ViewFlagProps, type ViewQueryParams } from "@itwin/core-common";
import {
  DrawingViewState, IModelApp, NotifyMessageDetails, OutputMessagePriority, OutputMessageType, SheetViewState,
  SpatialViewState, type IModelConnection, type ScreenViewport, type Viewport, type ViewState,
} from "@itwin/core-frontend";
import { type ITwinLocalization } from "@itwin/core-i18n";
import * as _ from "lodash";
import { type Store } from "redux";

import { IGroupClient, ISavedViewsClient, ITagClient } from "../saved-views";
import { ViewTypes } from "../SavedViewTypes";
import {
  clearSearchTags, SavedViewStateReducer, setSearchFilter, setTargetViewport, setTurnOnModelsCategoriesNotHidden,
  type SavedViewsActionUnion, type SavedViewsState,
} from "../store/SavedViewsStateReducer";
import { type IDefaultViewIdClient } from "./clients/DefaultViewIdClient";
import { type TargetViewport } from "./TargetViewport";
import { type ExtensionHandler } from "./utilities/SavedViewsExtensionHandlers";

export enum SavedViewEvents {
  SavedViewsGet = "SavedViews.Get",
  SavedViewsGetThumbnail = "SavedViews.GetThumbnail",
  SavedViewsDelete = "SavedViews.Delete",
  SavedViewsGetAll = "SavedViews.GetAll",
  SavedViewsCreate = "SavedViews.Create",
  SavedViewsApply = "SavedViews.Apply",
}

/** Optional overrides to be passed in to SavedViews.initialize */
export interface SavedViewsInitializationOptions {
  // Due to changes in 3.0, we can not reliably extract info such as the userId from the accessToken, so instead we will rely on the app passing the userId to us
  userId: string;
  groupClient: IGroupClient;
  savedViewsClient: ISavedViewsClient;
  tagClient: ITagClient;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  store?: Store<any>;
  createApplicationSpecific?: boolean;
  featureFlags?: SavedViewFeatureFlags;
  usageTracking?: Partial<SavedViewFeatureUsageTracking>;
  savedViewsNamespace?: string;
  thumbnailsNamespace?: string;
  groupNamespace?: string;
  tagNamespace?: string;
  setMapElevation?: (vp: Viewport) => Promise<void>;
  onViewSourceNotFound?: () => void;
  savedViewsStateKey?: string;
  defaultViewSettingsNamespace?: string;
  defaultViewIdClient?: IDefaultViewIdClient;
  extensionHandlers?: ExtensionHandler[];
  // Flag to share default saved view via shared settings instead of user settings (default)
  isDefaultViewShared?: boolean;
  getAccessToken?: () => Promise<AccessToken>;
  // Event tracker for actions done on saved views client
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trackEvent?: (name: string, properties?: { [key: string]: any; }) => void;
  // Choose to apply the saved view to either the selected viewport or first opened viewport (defaults to the selected)
  targetViewport?: TargetViewport;
  // Function for getting the preferred viewport when saving views.
  getViewport?: () => ScreenViewport | undefined;
}

/** Supported Feature Flags for  */
export interface SavedViewFeatureFlags {
  /** If true, merge data from a seed view from the iModel with a default set of view state props. See method 'ViewCreator.mergeSeedView'. */
  useSeedView: boolean;
  /** If true, allows a saved view to be promoted to a 'shared' view available to other on the project team. */
  savedViewsPublicShare: boolean;
  /** Allows editing of shared views by users that did not create them */
  allowSharedEdit?: boolean;
  /** If true, enables Copy Link context menu item on Saved View */
  copyLinkEnabled?: boolean;
  /**
   * If true, shows dialog for case where saved view has too many emphasized elements to save
   * currently the limit is 1mb for a view in pss, but a SaveViewBase object over 990000 bytes triggers the too large case
   * */
  handleTooManyEmphasizedElements?: boolean;
  /** If true, enables setting the hidden models and categories in the saved view */
  supportHiddenModelsAndCategories?: boolean;
  /**
   * If true alongside 'supportHiddenModelsAndCategories', enables showing the 'Include New Content' apply view option
   * The 'Include New Content' option determines which models and categories to show based on which the saved view specifies as hidden
   * */
  enableHiddenModelsAndCategoriesApplyOption?: boolean;
  /**
   * to enable, 'supportHiddenModelsAndCategories' and 'enableHiddenModelsAndCategoriesApplyOption' must also be true
   * if enabled 'Include New Content' option becomes default instead of 'Filter Content'
   * */
  enableHiddenModelsAndCategoriesApplyOptionAsDefault?: boolean;
  /** If true, enables 2d views to be shown if the main viewport has a 2d view active */
  enable2dViews?: boolean;
  /** If true, use the public Saved Views API for reading & writing saved views */
  usePublicReadWriteClient?: boolean;
  /** If true, enables applying default saved view on open */
  enableApplyDefaultView?: boolean;
}

export interface SavedViewFeatureUsageTracking {
  /** usage is tracked when the app starts from a shared saved view (as opposed to the generated view) */
  trackOpenShareUsage: () => void;
  /** usage is tracked when the app starts from a default saved view */
  trackOpenDefaultUsage: () => void;
  /** when a saved view is applied from the saved view widget */
  trackApplyUsage: () => void;
  /** usage is tracked when a saved view is created */
  trackCreateUsage: () => void;
  /** usage is tracked when a saved view is deleted */
  trackDeleteUsage: () => void;
  /** usage is tracked when a saved view is shared */
  trackShareUsage: () => void;
  /** usage is tracked when opening the manage tags dialog from a save view entry in widget */
  trackManageTagsUsage: () => void;
}

/**
 * SavedView class provides utility methods that must be called by host application that want SavedView support.
 */
export class SavedViewsManager {
  // Due to changes in 3.0, we can not reliably extract info such as the userId from the accessToken, so instead we will rely on the app passing the userId to us
  // consequently we have need to maintain the userId in the redux store since it will not change
  private static _userId?: string;
  public static get userId(): string {
    if (!SavedViewsManager._userId) {
      throw new Error("UserId not found!");
    }
    return SavedViewsManager._userId;
  }

  public static groupClient: IGroupClient;
  public static savedViewsClient: ISavedViewsClient;
  public static tagClient: ITagClient;

  private static _getAccessToken?: () => Promise<AccessToken>;
  private static _extensionHandlers?: ExtensionHandler[];
  /** Translator */
  private static _i18n?: ITwinLocalization;

  /** Redux store to use for widget state */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static _store?: Store<any>;

  /** Used to cache ViewStates for seed values */
  private static _seedViewStates = new Map<ViewTypes, ViewState>();

  /** Default key for saved views state within a store */
  private static _savedViewsStateKeyInStore = "savedViewsState";

  /** Whether or not to store saved views/thumbnails/groups as application specific */
  private static _createApplicationSpecific = true;

  /** Refresh event: gets called each time the view is changed */
  public static readonly ON_SAVED_VIEW_DATA_CHANGED = new BeEvent<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (args?: any) => void
  >();

  private static _complaint = "iTwin Saved Views is not initialized";

  /** Client to get/ set default view id */
  private static _defaultSavedViewIdClient?: IDefaultViewIdClient;

  /** Namespaces for product settings service */
  private static _viewNamespace = "designreview-SavedViews";
  private static _thumbnailNamespace = "designreview-Thumbnails";
  private static _groupNamespace = "designreview-Group";
  private static _tagsNamespace = "designreview-Tags";
  private static _defaultViewNamespace = "designreview-DefaultView";

  /** Defaults for widget feature flags */
  private static _featureFlags: SavedViewFeatureFlags = {
    useSeedView: true,
    savedViewsPublicShare: true,
    copyLinkEnabled: true,
    handleTooManyEmphasizedElements: false,
    supportHiddenModelsAndCategories: false,
    enableApplyDefaultView: false,
    enableHiddenModelsAndCategoriesApplyOption: false,
    enableHiddenModelsAndCategoriesApplyOptionAsDefault: false,
    enable2dViews: true,
    usePublicReadWriteClient: false,
  };

  private static _usageTracking?: Partial<SavedViewFeatureUsageTracking>;
  public static get usageTracking():
    | Partial<SavedViewFeatureUsageTracking>
    | undefined {
    return SavedViewsManager._usageTracking;
  }

  public static get enableHiddenModelsAndCategoriesApplyOption() {
    return (
      SavedViewsManager.flags.supportHiddenModelsAndCategories &&
      SavedViewsManager.flags.enableHiddenModelsAndCategoriesApplyOption
    );
  }

  public static get enableHiddenModelsAndCategoriesApplyOptionAsDefault() {
    return (
      SavedViewsManager.flags.supportHiddenModelsAndCategories &&
      SavedViewsManager.flags.enableHiddenModelsAndCategoriesApplyOption &&
      SavedViewsManager.flags
        .enableHiddenModelsAndCategoriesApplyOptionAsDefault
    );
  }

  private static _getViewport?: () => ScreenViewport | undefined;
  public static get getViewport():
    | (() => ScreenViewport | undefined)
    | undefined {
    return SavedViewsManager._getViewport;
  }

  /** Default function that allows host application can provide to set map elevation as saved views are loaded */
  private static _setMapElevation: (vp: Viewport) => Promise<void>;

  /** Defaults for forced view flags (they come from Design Review) */
  private static _forcedViewFlags: ViewFlagProps = {
    renderMode: RenderMode.SmoothShade,
    grid: false,
  };

  /** Default ID for the "Ungrouped" group */
  private static _ungroupedId = "-1";

  /** Default ID for the "Desktop Views" group */
  private static _desktopViewsGroupId = "-2";

  /** Default function that is called when the source view is not found */
  private static _onViewSourceNotFound = () => {
    const briefMsg = SavedViewsManager.translate("listTools.warning_viewInvalidInChangeset_brief");
    const msg = SavedViewsManager.translate("listTools.warning_viewInvalidInChangeset");
    IModelApp.notifications.outputMessage(
      new NotifyMessageDetails(OutputMessagePriority.Warning, briefMsg, msg, OutputMessageType.Sticky),
    );
  };

  /** function that is called when the view does not support hidden models / categories */
  public static onHiddenModelsAndCategoriesNotSupported = () => {
    const briefMsg = SavedViewsManager.translate("listTools.hiddenModelsCategoriesNotSupported_brief");
    const msg = SavedViewsManager.translate("listTools.hiddenModelsCategoriesNotSupported");
    IModelApp.notifications.outputMessage(
      new NotifyMessageDetails(OutputMessagePriority.Warning, briefMsg, msg, OutputMessageType.Toast),
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static _trackEvent = (_name: string, _properties?: { [key: string]: any; }) => {
    /** No-op */
  };
  /**
   * Tracks events for saved views if a tracker is provided to the manager
   * @param name
   * @param properties
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static trackEvent = (name: string, properties?: { [key: string]: any; }) => {
    SavedViewsManager._trackEvent(name, properties);
  };

  /** @internal */
  public static get packageName(): string {
    return "saved-views";
  }

  /** Get the default ID for the "Ungrouped" group */
  public static get ungroupedId() {
    return SavedViewsManager._ungroupedId;
  }

  /** Get the default ID for the "Desktop Views" group */
  public static get desktopViewsGroupId() {
    return SavedViewsManager._desktopViewsGroupId;
  }

  /** Get the translation for "Ungrouped" */
  public static get defaultUngroupedGroupName() {
    return SavedViewsManager.translate("groups.ungrouped");
  }

  /** Get the translation for "Desktop Views" */
  public static get defaultDesktopViewGroupName() {
    return SavedViewsManager.translate("groups.desktopViews");
  }

  /** Get the internationalization sevice that is in use */
  public static get i18n(): ITwinLocalization {
    if (!SavedViewsManager._i18n) {
      throw new Error(SavedViewsManager._complaint);
    }
    return SavedViewsManager._i18n;
  }

  /** Get the internationalization service namespace. */
  public static get i18nNamespace(): string {
    return "ITwinSavedViews";
  }

  /** Calls i18n.getLocalizedStringWithNamespace with the "SavedViews" namespace. Do NOT include the namespace in the key.
   * @internal
   */
  public static translate: typeof SavedViewsManager.i18n.getLocalizedString = (key, options) => {
    return SavedViewsManager.i18n.getLocalizedStringWithNamespace(SavedViewsManager.i18nNamespace, key, options);
  };

  /** Get the namespace under which views are stored in the product settings service */
  public static get viewSettingsNamespace() {
    return SavedViewsManager._viewNamespace;
  }

  /** Get the namespace under which namespaces are stored in the product settings service */
  public static get thumbnailSettingsNamespace() {
    return SavedViewsManager._thumbnailNamespace;
  }

  /** Get the namespace under which groups are stored in the product settings service */
  public static get groupSettingsNamespace() {
    return SavedViewsManager._groupNamespace;
  }

  /** Get the namespace under which tags are stored in the product settings service */
  public static get tagSettingsNamespace() {
    return SavedViewsManager._tagsNamespace;
  }

  /** Get the namespace under which default view id is stored in the product settings service */
  public static get defaultViewSettingsNamespace() {
    return SavedViewsManager._defaultViewNamespace;
  }

  /** Returns whether or not settings are being stored as application specific in the product settings service */
  public static get applicationSpecificSettings() {
    return SavedViewsManager._createApplicationSpecific;
  }

  /** Returns the function that is called when the source view is not found   */
  public static get onViewSourceNotFound() {
    return SavedViewsManager._onViewSourceNotFound;
  }

  /** Set the function that is called when the source view is not found */
  public static set onViewSourceNotFound(handleSourceViewNotFound) {
    SavedViewsManager._onViewSourceNotFound = handleSourceViewNotFound;
  }

  /** Function that sets the map elevation as the saved views are loaded */
  public static get setMapElevation() {
    return SavedViewsManager._setMapElevation;
  }

  public static set setMapElevation(setElevationFunc) {
    SavedViewsManager._setMapElevation = setElevationFunc;
  }

  /** Return object that contains all feature flags */
  public static get flags() {
    return SavedViewsManager._featureFlags;
  }

  /** Support changing feature flags */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static changeFlags(featureFlags: any) {
    SavedViewsManager._featureFlags = {
      ...SavedViewsManager._featureFlags,
      ...featureFlags,
    };
  }

  /**
   * Grabs Seeded SavedView From IModel
   * @throws if iModel Connection of App is invalid
   * @returns iModelViewData
   */
  public static async fetchIModelViewData(viewClassName: ViewTypes) {
    let seedViewState = this._seedViewStates.get(viewClassName);
    if (seedViewState) {
      return seedViewState;
    }
    const iModelConnection = UiFramework.getIModelConnection();
    if (!iModelConnection) {
      throw new Error("IModel Connection is invalid ");
    }
    const viewId = await SavedViewsManager.getDefaultViewIdFromClassName(iModelConnection, viewClassName);
    seedViewState = await iModelConnection.views.load(viewId);
    this._seedViewStates.set(viewClassName, seedViewState);
    return seedViewState;
  }

  /** Get subset of ViewFlags that will override value in the SavedView data before being applied to view */
  public static get forcedViewFlags() {
    return this._forcedViewFlags;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static set forcedViewFlags(forcedViewFlags: any) {
    this._forcedViewFlags = forcedViewFlags;
  }

  public static getAccessToken(): Promise<AccessToken> {
    if (!SavedViewsManager._getAccessToken) {
      throw new Error("AccessToken not found!");
    }
    return SavedViewsManager._getAccessToken();
  }

  public static get extensionHandlers(): ExtensionHandler[] {
    return this._extensionHandlers ?? [];
  }

  public static get defaultSavedViewIdClient(): IDefaultViewIdClient {
    if (!this._defaultSavedViewIdClient) {
      throw new Error("_defaultSavedViewIdClient not found!");
    }
    return this._defaultSavedViewIdClient;
  }
  /**
   * Called by IModelApp to initialize the SavedViews
   * @param i18n The internationalization service created by the IModelApp.
   * @param options.savedViewsNamespace If specified overrides the default namespace used to store/retrieve SavedViews in the Settings Service.
   * @param options.thumbnailsNamespace If specified overrides the default namespace used to store/retrieve views thumbnails in the Settings Service.
   * @param options.onViewSourceNotFound If specified defines the function to be called to report error when Saved View source is not found.
   *
   * @internal
   */
  public static async initialize(i18n: ITwinLocalization, options: SavedViewsInitializationOptions): Promise<void> {
    SavedViewsManager._userId = options.userId;
    SavedViewsManager.groupClient = options.groupClient;
    SavedViewsManager.savedViewsClient = options.savedViewsClient;
    SavedViewsManager.tagClient = options.tagClient;
    SavedViewsManager._i18n = i18n;
    SavedViewsManager._store = options.store;

    SavedViewsManager._defaultSavedViewIdClient = options.defaultViewIdClient;

    SavedViewsManager._createApplicationSpecific = _.defaultTo(
      options.createApplicationSpecific,
      SavedViewsManager._createApplicationSpecific,
    );
    SavedViewsManager._viewNamespace = _.defaultTo(
      options.savedViewsNamespace,
      SavedViewsManager._viewNamespace,
    );
    SavedViewsManager._thumbnailNamespace = _.defaultTo(
      options.thumbnailsNamespace,
      SavedViewsManager._thumbnailNamespace,
    );
    SavedViewsManager._groupNamespace = _.defaultTo(
      options.groupNamespace,
      SavedViewsManager._groupNamespace,
    );
    SavedViewsManager._tagsNamespace = _.defaultTo(
      options.tagNamespace,
      SavedViewsManager._tagsNamespace,
    );
    SavedViewsManager._defaultViewNamespace = _.defaultTo(
      options.defaultViewSettingsNamespace,
      SavedViewsManager._defaultViewNamespace,
    );
    SavedViewsManager._onViewSourceNotFound = _.defaultTo(
      options.onViewSourceNotFound,
      SavedViewsManager._onViewSourceNotFound,
    );
    SavedViewsManager._setMapElevation = _.defaultTo(
      options.setMapElevation,
      SavedViewsManager._setMapElevation,
    );

    if (options.featureFlags) {
      SavedViewsManager.changeFlags(options.featureFlags);
    }

    if (options.trackEvent) {
      SavedViewsManager._trackEvent = options.trackEvent;
    }

    if (!options.store) {
      ReducerRegistryInstance.registerReducer(SavedViewsManager._savedViewsStateKeyInStore, SavedViewStateReducer);
    }

    if (options.savedViewsStateKey) {
      SavedViewsManager._savedViewsStateKeyInStore = options.savedViewsStateKey;
    }

    SavedViewsManager._getAccessToken = options.getAccessToken ?? IModelApp.getAccessToken.bind(IModelApp);
    SavedViewsManager._extensionHandlers = options.extensionHandlers ?? [];

    if (SavedViewsManager.enableHiddenModelsAndCategoriesApplyOptionAsDefault) {
      SavedViewsManager.dispatchActiontoStore(setTurnOnModelsCategoriesNotHidden(true));
    }

    // if the targetViewport is specified in the init option, update the store value accordingly
    if (options.targetViewport) {
      SavedViewsManager.dispatchActiontoStore(setTargetViewport(options.targetViewport));
    }

    if (options.getViewport) {
      SavedViewsManager._getViewport = options.getViewport;
    }

    SavedViewsManager._usageTracking = options.usageTracking;

    return SavedViewsManager._i18n.registerNamespace(SavedViewsManager.i18nNamespace);
  }

  /** Unregister the SavedViews internationalization service namespace */
  public static terminate() {
    SavedViewsManager._store = undefined;
    SavedViewsManager._savedViewsStateKeyInStore = "savedViewsState";

    if (SavedViewsManager._i18n) {
      SavedViewsManager._i18n.unregisterNamespace(SavedViewsManager.i18nNamespace);
      SavedViewsManager._i18n = undefined;
    }
  }

  public static dispatchActiontoStore(action: SavedViewsActionUnion, immediateSync = false) {
    SavedViewsManager.store.dispatch(action);
    if (immediateSync) {
      SyncUiEventDispatcher.dispatchImmediateSyncUiEvent(action.type);
    } else {
      SyncUiEventDispatcher.dispatchSyncUiEvent(action.type);
    }
  }

  public static get savedViewsStateKey(): string {
    return SavedViewsManager._savedViewsStateKeyInStore;
  }

  public static get state(): SavedViewsState | undefined {
    // tslint:disable-next-line:no-string-literal
    return SavedViewsManager.store.getState()[
      SavedViewsManager.savedViewsStateKey
    ];
  }

  /** The Redux store */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static get store(): Store<any> {
    if (SavedViewsManager._store) {
      return SavedViewsManager._store;
    }

    if (!StateManager.isInitialized(true)) {
      throw new UiError(SavedViewsManager.loggerCategory(getClassName(this)), SavedViewsManager._complaint);
    }

    return StateManager.store;
  }

  /** @internal */
  public static loggerCategory(className?: string): string {
    return `${SavedViewsManager.packageName}.${className ? `.${className}` : ""
      }`;
  }

  // code is not D.R.Y but this decision was made to uphold existing contracts
  // method shared some implementation with getDefaultViewId
  public static async getDefaultViewIdFromClassName(iModelConnection: IModelConnection, savedViewType: ViewTypes) {
    let viewFullName = undefined;
    switch (savedViewType) {
      case ViewTypes.ViewDefinition3d:
        viewFullName = SpatialViewState.classFullName;
        break;
      case ViewTypes.DrawingViewDefinition:
        viewFullName = DrawingViewState.classFullName;
        break;
      case ViewTypes.SheetViewDefinition:
        viewFullName = SheetViewState.classFullName;
        break;
      default:
        throw new Error("Unrecognized View Type");
    }
    const viewId = await iModelConnection.views.queryDefaultViewId();
    const params: ViewQueryParams = {};
    params.from = viewFullName;
    params.where = "ECInstanceId=" + viewId;

    // Check validity of default view
    const viewProps = await IModelReadRpcInterface.getClient().queryElementProps(
      iModelConnection.getRpcProps(),
      params,
    );
    if (viewProps.length === 0) {
      // Return the first view we can find
      const viewList = await iModelConnection.views.getViewList({
        from: viewFullName,
        wantPrivate: false,
      });
      if (viewList.length === 0) {
        return "";
      }
      return viewList[0].id;
    }

    return viewId;
  }

  public static async getDefaultViewId(iModelConnection: IModelConnection) {
    const viewId = await iModelConnection.views.queryDefaultViewId();
    const params: ViewQueryParams = {};
    params.from = SpatialViewState.classFullName;
    params.where = "ECInstanceId=" + viewId;

    // Check validity of default view
    const viewProps =
      await IModelReadRpcInterface.getClient().queryElementProps(iModelConnection.getRpcProps(), params);
    if (viewProps.length === 0) {
      // Return the first view we can find
      const viewList = await iModelConnection.views.getViewList({
        wantPrivate: false,
      });
      if (viewList.length === 0) {
        return "";
      }

      const spatialViewList = viewList.filter((value) => value.class.indexOf("Spatial") !== -1);
      if (spatialViewList.length === 0) {
        return "";
      }

      return spatialViewList[0].id;
    }

    return viewId;
  }

  public static clearSearchFilterAndTags() {
    SavedViewsManager.dispatchActiontoStore(setSearchFilter(""));
    SavedViewsManager.dispatchActiontoStore(clearSearchTags());
  }
}
