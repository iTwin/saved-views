// Copyright (c) Bentley Systems, Incorporated. All rights reserved.
import {
  IModelConnection,
  ViewState,
} from "@itwin/core-frontend";

import {
  isSavedView3d,
} from "../../clients/ISavedViewsClient.js";
import {
  SavedView as LegacySavedView, SavedViewBase as LegacySavedViewBase,
} from "../SavedViewTypes.js";
import { Id64Array } from "@itwin/core-bentley";
import { IModelQueryClient } from "../../clients/IModelQueryClient.js";



function legacyViewHasValidHiddenModelsAndCategories(savedView: LegacySavedViewBase): boolean {
  if (isSavedView3d(savedView)) {
    return !!(savedView.hiddenCategories && savedView.hiddenModels);
  }
  return !!savedView.hiddenCategories;
}

export async function applyHiddenModelsAndCategories(viewState: ViewState, savedView: LegacySavedViewBase, iModelConnection: IModelConnection): Promise<void> {
  if (legacyViewHasValidHiddenModelsAndCategories(savedView)) {
    const visible = await getVisibleModelsAndCategories(savedView, iModelConnection);
    if (visible.categories) {
      viewState.categorySelector.addCategories(visible.categories);
    }
    if (viewState.isSpatialView() && visible.models) {
      viewState.modelSelector.addModels(visible.models);
    }
    await viewState.load();
  }
}

async function getVisibleModelsAndCategories(
  savedView: LegacySavedViewBase,
  iModelConnection: IModelConnection,
): Promise<{ models?: Id64Array; categories?: Id64Array; }> {
  return {
    models: isSavedView3d(savedView)
      ? await getVisibleModels(savedView, iModelConnection)
      : undefined,
    categories: await getVisibleCategories(savedView, iModelConnection),
  };
}

async function getVisibleModels(
  savedView: LegacySavedViewBase,
  iModelConnection: IModelConnection,
): Promise<Id64Array | undefined> {
  const hiddenModels = (savedView as LegacySavedView).hiddenModels;
  return hiddenModels ? getMissingModels(hiddenModels, iModelConnection) : undefined;
}


async function getVisibleCategories(
  savedView: LegacySavedViewBase,
  iModelConnection: IModelConnection,
): Promise<Id64Array | undefined> {
  const hiddenCategories = savedView.hiddenCategories;
  return hiddenCategories
    ? getMissingCategories(hiddenCategories, iModelConnection)
    : undefined;
}

async function getMissingModels(models: Id64Array, iModelConnection: IModelConnection) {
  const allModels = await getAllModels(iModelConnection);
  return getDiff(models, allModels);
}

async function getMissingCategories(categories: Id64Array, iModelConnection: IModelConnection) {
  const allCategories = await getAllCategories(iModelConnection);
  return getDiff(categories, allCategories);
}

async function getAllModels(iModelConnection: IModelConnection): Promise<Id64Array> {
  return IModelQueryClient.getAllModels(iModelConnection);
}

async function getAllCategories(iModelConnection: IModelConnection): Promise<Id64Array> {
  return IModelQueryClient.getAllCategories(iModelConnection);
}

const getDiff = (
  arr1: string[] | Set<string>,
  arr2: string[] | Set<string>,
) => {
  const set1 = new Set([...arr1]);
  const set2 = new Set([...arr2].filter((x) => !set1.has(x)));
  return [...set2];
};
