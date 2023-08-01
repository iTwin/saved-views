// Copyright (c) Bentley Systems, Incorporated. All rights reserved.

import type { Id64Array } from "@itwin/core-bentley";
import { type IModelConnection, type ViewState } from "@itwin/core-frontend";

import { IModelQueryClient } from "../clients/IModelQueryClient";
import { isSavedView3d } from "../clients/ISavedViewsClient";
import {
  type SavedView,
  type SavedViewBase,
} from "../utilities/SavedViewTypes";

const getDiff = (arr1: string[] | Set<string>, arr2: string[] | Set<string>) => {
  const set1 = new Set([...arr1]);
  const set2 = new Set([...arr2].filter((x) => !set1.has(x)));
  return [...set2];
};

export class ModelsAndCategoriesCache {
  private static _map = new Map<string, ModelsAndCategoriesCache>();

  public static getCache(iModel: IModelConnection): ModelsAndCategoriesCache {
    const key = iModel.key;
    let cache: ModelsAndCategoriesCache | undefined;
    if (ModelsAndCategoriesCache._map.has(key)) {
      cache = ModelsAndCategoriesCache._map.get(key);
    }
    if (!cache) {
      cache = new ModelsAndCategoriesCache(iModel);
      ModelsAndCategoriesCache._map.set(key, cache);
    }
    return cache;
  }

  private _allModelsAndCategories: Promise<{
    models: Id64Array;
    categories: Id64Array;
  }>;

  constructor(iModel: IModelConnection) {
    this._allModelsAndCategories =
      IModelQueryClient.getAllModelsAndCategories(iModel);
  }

  public async getAllModels(): Promise<Id64Array> {
    return (await this._allModelsAndCategories).models;
  }

  public async getAllCategories(): Promise<Id64Array> {
    return (await this._allModelsAndCategories).categories;
  }

  private async getMissingModels(models: Id64Array) {
    const allModels = await this.getAllModels();
    return getDiff(models, allModels);
  }

  private async getMissingCategories(categories: Id64Array) {
    const allCategories = await this.getAllCategories();
    return getDiff(categories, allCategories);
  }

  public async getHiddenModels(savedView: SavedView): Promise<Id64Array> {
    const visibleModels = savedView.modelSelectorProps.models;
    return this.getMissingModels(visibleModels);
  }

  public async getVisibleModels(savedView: SavedView): Promise<Id64Array | undefined> {
    const hiddenModels = savedView.hiddenModels;
    return hiddenModels ? this.getMissingModels(hiddenModels) : undefined;
  }

  public async getHiddenCategories(savedView: SavedViewBase): Promise<Id64Array> {
    const visibleCategories = savedView.categorySelectorProps.categories;
    return this.getMissingCategories(visibleCategories);
  }

  public async getVisibleCategories(savedView: SavedViewBase): Promise<Id64Array | undefined> {
    const hiddenCategories = savedView.hiddenCategories;
    return hiddenCategories
      ? this.getMissingCategories(hiddenCategories)
      : undefined;
  }

  public async setHiddenModelsAndCategories(savedView: SavedViewBase): Promise<void> {
    if (isSavedView3d(savedView)) {
      savedView.hiddenModels = await this.getHiddenModels(savedView);
    }
    savedView.hiddenCategories = await this.getHiddenCategories(savedView);
  }

  public async getVisibleModelsAndCategories(
    savedView: SavedViewBase,
  ): Promise<{ models?: Id64Array; categories?: Id64Array; }> {
    return {
      models: isSavedView3d(savedView)
        ? await this.getVisibleModels(savedView)
        : undefined,
      categories: await this.getVisibleCategories(savedView),
    };
  }

  public hasValidHiddenModelsAndCategories = (savedView: SavedViewBase) => {
    if (isSavedView3d(savedView)) {
      return savedView.hiddenCategories && savedView.hiddenModels;
    }
    return !!savedView.hiddenCategories;
  };

  public async updateView(viewState: ViewState, savedView: SavedViewBase) {
    if (this.hasValidHiddenModelsAndCategories(savedView)) {
      const visible = await this.getVisibleModelsAndCategories(savedView);
      if (visible.categories) {
        viewState.categorySelector.addCategories(visible.categories);
      }
      if (viewState.isSpatialView() && visible.models) {
        viewState.modelSelector.addModels(visible.models);
      }
      await viewState.load();
    }
  }
}
