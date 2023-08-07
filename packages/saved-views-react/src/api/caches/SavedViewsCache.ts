/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { BeUiEvent } from "@itwin/core-bentley";
import { type IModelConnection, type ViewState } from "@itwin/core-frontend";

import { type ISavedViewsClient } from "../clients/ISavedViewsClient";
import { type SavedViewBase, type SavedViewBaseUpdate } from "../utilities/SavedViewTypes";
import { SavedViewUtil } from "../utilities/SavedViewUtil";
import { ModelsAndCategoriesCache } from "./ModelsAndCategoriesCache";

/** Event types to delineate what kind of change occurred when the saved view cache is modified */
export enum SavedViewCacheEventType {
  SavedViewAdded,
  SavedViewRemoved,
  SavedViewShared,
  SavedViewUpdated,
  CacheSync,
}

/** SavedView Event Args interface. */
export interface SavedViewCacheEventArgs {
  savedView?: SavedViewBase;
  updatedView?: SavedViewBase;
  eventType: SavedViewCacheEventType;
}

/** Group cache event */
export class SavedViewCacheEvent extends BeUiEvent<SavedViewCacheEventArgs> { }

/** Saved View Cache */
export class SavedViewsCache {
  private _client: ISavedViewsClient;
  private _cache: SavedViewBase[] | undefined;
  private _viewStateCache: Map<string, ViewState>;
  private _timerId: ReturnType<typeof setInterval> | undefined;
  private _interval: number;

  /** Get SavedView Added event. */
  public static readonly ON_CACHE_EVENT = new SavedViewCacheEvent();

  constructor(client: ISavedViewsClient) {
    this._client = client;
    this._viewStateCache = new Map<string, ViewState>();
    this._interval = 0;
  }

  public getNewSavedViewName(): string | undefined {
    if (!this._cache) {
      return undefined;
    }

    const allViewNumbersInUse = this._cache
      .filter((value) => value.name.match(/View (\d+)/))
      .map((value) => +value.name.split(" ")[1]);
    const set = new Set(allViewNumbersInUse);

    for (let i = 1; ; i++) {
      if (!set.has(i)) {
        return `View ${i}`;
      }
    }
  }

  /**
   * Creates a saved view in the BIM Review Share service and caches it
   * @param iModelConnection IModelConnection to use as reference for the new saved view
   * @param data SavedViewData to post
   * @param name Name of the saved view
   */
  public async createSavedView(iModelConnection: IModelConnection, data: SavedViewBase) {
    const savedView = await this._client.createSavedView(iModelConnection, data);

    // Update cache
    if (this._cache) {
      this._cache.push(savedView);
    }

    SavedViewsCache.ON_CACHE_EVENT.emit({
      savedView,
      eventType: SavedViewCacheEventType.SavedViewAdded,
    });
  }

  /**
   * For test purposes only, returns true if the saved view is contained in the cache
   */
  public hasSavedView(view: SavedViewBase) {
    if (!this._cache) {
      return false;
    }

    return (
      this._cache!.filter((value: SavedViewBase) => view.id === value.id)
        .length !== 0
    );
  }

  /**
   * For test purposes only, returns true if all the saved views are contained in the cache
   */
  public hasSavedViews(views: SavedViewBase[]) {
    return (
      views.filter((view: SavedViewBase) => this.hasSavedView(view)).length ===
      views.length
    );
  }

  /**
   * Updates the Saved View instance with the passed view state
   * @param data SavedViewData used to update the instance
   * @param view SavedView "instance" to be updated
   */
  public async updateSavedView(
    iModelConnection: IModelConnection,
    data: SavedViewBaseUpdate,
    view: SavedViewBase,
  ) {
    const savedView = await this._client.updateSavedView(iModelConnection, data, view);

    // Update cache
    if (this._cache) {
      this._cache = this._cache.map((value: SavedViewBase) => {
        if (value.id === savedView.id) {
          return savedView;
        }

        return value;
      });

      // Clear cached view state for this saved view
      this._viewStateCache.delete(savedView.id);

      SavedViewsCache.ON_CACHE_EVENT.emit({
        savedView: view,
        updatedView: savedView,
        eventType: SavedViewCacheEventType.SavedViewUpdated,
      });
    }
  }

  /*
   * Deletes a saved view from the BIM Review Share service
   * @param instanceId Instance to be deleted
   */
  public async deleteSavedView(iModelConnection: IModelConnection, view: SavedViewBase) {
    const id = view.id;
    await this._client.deleteSavedView(iModelConnection, view);

    // Update cache
    if (this._cache) {
      this._cache = this._cache.filter((value: SavedViewBase) => value.id !== id);
    }

    // Clear cached view state for this saved view
    this._viewStateCache.delete(view.id);

    SavedViewsCache.ON_CACHE_EVENT.emit({
      savedView: view,
      eventType: SavedViewCacheEventType.SavedViewRemoved,
    });
  }

  /**
   * Share a view definition with other users (simply sets a flag on the instance)
   * @param view Saved View instance will be shared/unshared
   * @param share boolean determining if the view is shared or not
   */
  public async shareView(iModelConnection: IModelConnection, view: SavedViewBase, share: boolean) {
    const savedView = await this._client.shareView(iModelConnection, view, share);

    // Update cache
    if (this._cache) {
      this._cache = this._cache.map((value: SavedViewBase) => {
        if (value.id === savedView.id) {
          return savedView;
        }

        return value;
      });

      SavedViewsCache.ON_CACHE_EVENT.emit({
        savedView,
        eventType: SavedViewCacheEventType.SavedViewShared,
      });
    }
  }

  /**
   * Syncs cache with BIM Review Share and triggers an UI Event
   */
  public async syncCache(iModelConnection: IModelConnection) {
    try {
      // Get saved views and force refresh
      await this.getSavedViews(iModelConnection, true);
      // Emit message to UI
      SavedViewsCache.ON_CACHE_EVENT.emit({
        eventType: SavedViewCacheEventType.CacheSync,
      });
    } catch (e) {
      // Stop automatic syncing if requests are failing
      this.clearAutomaticSync(iModelConnection);
    }
  }

  /**
   * Setups automatic sync based on an interval
   * @param iModelConnection IModelConnection to search views for
   * @param interval time in milliseconds that determines the automatic sync interval
   */
  public setupAutomaticSync(iModelConnection: IModelConnection, interval: number) {
    // Initialize timer Id
    // aliasing of "this" to local variable is not allowed by TSlint, arrow lamdas preserve this scope, so removing self to pass lint.
    this._timerId = setInterval(async () => {
      await this.syncCache(iModelConnection);
    }, interval);
    this._interval = interval;
  }

  /**
   *  Clears the automatic sync and also resets the timer if wanted
   * @param iModelConnection IModelConnection to search views for
   * @param reset optional. Reset the timer
   */
  public clearAutomaticSync(iModelConnection: IModelConnection, reset?: boolean) {
    clearInterval(this._timerId);

    if (reset) {
      this.setupAutomaticSync(iModelConnection, this._interval);
    }
  }

  /**
   * Gets saved views that this user can access
   * These are the ones created by the current user and the shared views in the iModel
   */
  public async getSavedViews(iModelConnection: IModelConnection, refresh?: boolean) {
    if (!this._cache || refresh) {
      this._cache = await this._client.getSavedViews(iModelConnection);
      this._viewStateCache.clear();
    }

    return this._cache;
  }

  public async getSavedViewsForGroup(iModelConnection: IModelConnection, groupId: string, refresh?: boolean) {
    const views = await this.getSavedViews(iModelConnection, refresh);
    return views.filter((v) => v.groupId === groupId);
  }

  /**
   * Returns true if theres an already cached ViewState
   * @param savedView SavedView base object ot check for a view state cached
   * @returns true if there's a cached ViewState
   */
  public isViewCached(savedView: SavedViewBase) {
    return this._viewStateCache.has(savedView.id);
  }

  /**
   * Gets a view state from the SavedView object and caches it
   * @param iModelConnection IModelConnection for querying source view
   * @param savedView SavedView object
   */
  public async getViewState(
    iModel: IModelConnection,
    savedView: SavedViewBase,
    onSourceNotFound?: () => void,
    useHiddenModelsAndCategories?: boolean,
    onHiddenModelsAndCategoriesNotSupported?: () => void,
  ) {
    const viewState = await this.getOrCreateViewState(iModel, savedView, onSourceNotFound);
    if (viewState && useHiddenModelsAndCategories) {
      const modelsAndCategoriesCache =
        ModelsAndCategoriesCache.getCache(iModel);
      if (
        !modelsAndCategoriesCache.hasValidHiddenModelsAndCategories(savedView)
      ) {
        onHiddenModelsAndCategoriesNotSupported?.();
      } else {
        await modelsAndCategoriesCache.updateView(viewState, savedView);
      }
    }
    return viewState;
  }

  private async getOrCreateViewState(
    iModel: IModelConnection,
    savedView: SavedViewBase,
    onSourceNotFound?: () => void,
  ) {
    if (this._viewStateCache.has(savedView.id)) {
      return this._viewStateCache.get(savedView.id)!.clone();
    }
    const viewState = await SavedViewUtil.createViewState(iModel, savedView, onSourceNotFound);
    if (viewState) {
      this._viewStateCache.set(savedView.id, viewState);
    }

    return viewState ? viewState.clone() : undefined;
  }
}
