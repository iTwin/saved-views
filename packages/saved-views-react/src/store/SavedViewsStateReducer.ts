/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { type ViewDefinitionProps } from "@itwin/core-common";
import { type IModelConnection } from "@itwin/core-frontend";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "react-redux-typescript";

import { type TargetViewport } from "../api/TargetViewport";
import { type LegacyGroup, type LegacySavedView } from "../api/utilities/SavedViewTypes";
import { SavedViewActions, type BooleanObject, type GroupObject, type SavedViewsObject } from "./SavedViewsActions";

export type SavedViewsState = {
  selectedViews: LegacySavedView[];
  openedGroups: BooleanObject;
  renamedViews: BooleanObject;
  groups: GroupObject;
  savedViews: SavedViewsObject;
  displayErrors: boolean;
  displaySuccess: boolean;
  applyCameraOnly: boolean;
  filterContent: boolean;
  turnOnModelsCategoriesNotHidden: boolean;
  turnOnModelsCategories: boolean;
  searchFilter: string;
  searchTags: string[];
  showThumbnails: boolean;
  showDefaultView: boolean;
  enableApplyDefaultView: boolean;
  defaultViewId: string;
  targetViewport: TargetViewport;
  desktopViews?: ViewDefinitionProps[];
  iModel?: IModelConnection;
};

const initialState: SavedViewsState = {
  selectedViews: [],
  openedGroups: {},
  renamedViews: {},
  groups: {},
  savedViews: {},
  displayErrors: false,
  displaySuccess: false,
  applyCameraOnly: false,
  filterContent: false,
  turnOnModelsCategoriesNotHidden: false,
  turnOnModelsCategories: false,
  searchFilter: "",
  searchTags: [],
  showThumbnails: false,
  showDefaultView: false,
  enableApplyDefaultView: false,
  defaultViewId: "",
  targetViewport: "selected",
  desktopViews: undefined,
  iModel: undefined,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SavedViewsSlice: any = createSlice({
  name: "SavedViewsSlice",
  initialState,
  reducers: {
    setViewSelected(state, action: PayloadAction<string, { view: LegacySavedView; selected: boolean; }>) {
      const { view, selected } = action.payload;
      state.selectedViews = SavedViewActions.setViewSelected(state.selectedViews, view, selected);
    },
    setGroupOpen(state, action: PayloadAction<string, { groupId: string; opened: boolean; }>) {
      const { groupId, opened } = action.payload;
      state.openedGroups = SavedViewActions.setGroupOpen(state.openedGroups, groupId, opened);
    },
    clearSelectedViews(state, _action: PayloadAction<string, void>) {
      state.selectedViews = [];
    },
    setRenaming(state, action: PayloadAction<string, { id: string; renaming: boolean; }>) {
      const { id, renaming } = action.payload;
      state.renamedViews = SavedViewActions.setRenaming({ ...state.renamedViews }, id, renaming);
    },
    deleteGroup(state, action: PayloadAction<string, { id: string; }>) {
      const { id } = action.payload;
      state.groups = SavedViewActions.deleteGroup(state.groups, id);
    },
    updateGroup(state, action: PayloadAction<string, { id: string; newGroup: LegacyGroup; }>) {
      const { id, newGroup } = action.payload;
      state.groups = SavedViewActions.updateGroup(state.groups, id, newGroup);
    },
    createGroup(state, action: PayloadAction<string, { newGroup: LegacyGroup; }>) {
      const { newGroup } = action.payload;
      state.groups = SavedViewActions.createGroup(state.groups, newGroup);
    },
    clearGroups(state, _action: PayloadAction<string, void>) {
      state.groups = {};
    },
    deleteView(state, action: PayloadAction<string, { id: string; groupId: string; }>) {
      const { id, groupId } = action.payload;
      state.savedViews = SavedViewActions.deleteView(state.savedViews, id, groupId);
    },
    updateView(state, action: PayloadAction<string, { id: string; groupId: string; newView: LegacySavedView; }>) {
      const { id, groupId, newView } = action.payload;
      state.savedViews = SavedViewActions.updateView(state.savedViews, id, groupId, newView);
    },
    clearViews(state, _action: PayloadAction<string, void>) {
      state.savedViews = {};
    },
    setIModel(state, action: PayloadAction<string, IModelConnection | undefined>) {
      state.iModel = action.payload;
    },
    setDisplayErrors(state, action: PayloadAction<string, boolean>) {
      state.displayErrors = action.payload;
    },
    setDisplaySuccess(state, action: PayloadAction<string, boolean>) {
      state.displaySuccess = action.payload;
    },
    setApplyCameraOnly(state, action: PayloadAction<string, boolean>) {
      state.applyCameraOnly = action.payload;
    },
    setFilterContent(state, action: PayloadAction<string, boolean>) {
      state.filterContent = action.payload;
    },
    setTurnOnModelsCategoriesNotHidden(state, action: PayloadAction<string, boolean>) {
      state.turnOnModelsCategoriesNotHidden = action.payload;
    },
    setTurnOnModelsCategories(state, action: PayloadAction<string, boolean>) {
      state.turnOnModelsCategories = action.payload;
    },
    setSearchFilter(state, action: PayloadAction<string, string>) {
      state.searchFilter = action.payload;
    },
    addSearchTag(state, action: PayloadAction<string, string>) {
      const searchTag = action.payload;
      state.searchTags = SavedViewActions.addSearchTag(state.searchTags, searchTag);
    },
    removeSearchTag(state, action: PayloadAction<string, string>) {
      const searchTag = action.payload;
      state.searchTags = SavedViewActions.removeSearchTag(state.searchTags, searchTag);
    },
    clearSearchTags(state, _action: PayloadAction<string, void>) {
      state.searchTags = [];
    },
    setShowThumbnails(state, action: PayloadAction<string, boolean>) {
      state.showThumbnails = action.payload;
    },
    setDesktopViews(state, action: PayloadAction<string, ViewDefinitionProps[] | undefined>) {
      state.desktopViews = action.payload;
    },
    setShowDefaultView(state, action: PayloadAction<string, boolean>) {
      state.showDefaultView = action.payload;
    },
    setEnableApplyDefaultView(state, action: PayloadAction<string, boolean>) {
      state.enableApplyDefaultView = action.payload;
    },
    setDefaultViewId(state, action: PayloadAction<string, string>) {
      state.defaultViewId = action.payload;
    },
    setTargetViewport(state, action: PayloadAction<string, TargetViewport>) {
      state.targetViewport = action.payload;
    },
  },
});

export const {
  setViewSelected,
  setGroupOpen,
  clearSelectedViews,
  setRenaming,
  deleteGroup,
  updateGroup,
  createGroup,
  clearGroups,
  deleteView,
  updateView,
  clearViews,
  setIModel,
  setDisplayErrors,
  setDisplaySuccess,
  setApplyCameraOnly,
  setFilterContent,
  setTurnOnModelsCategoriesNotHidden,
  setTurnOnModelsCategories,
  setSearchFilter,
  addSearchTag,
  removeSearchTag,
  clearSearchTags,
  setShowThumbnails,
  setDesktopViews,
  setEnableApplyDefaultView,
  setShowDefaultView,
  setDefaultViewId,
  setTargetViewport,
} = SavedViewsSlice.actions;

type ReturnTypeUnion<T> = {
  [K in keyof T]: T[K] extends (...args: unknown[]) => unknown ? ReturnType<T[K]> : never;
}[keyof T];

export type SavedViewsActionUnion = ReturnTypeUnion<
  typeof SavedViewsSlice.actions
>;

export const SavedViewStateReducer = SavedViewsSlice.reducer;
