// Copyright (c) Bentley Systems, Incorporated. All rights reserved.

import { type ViewDefinitionProps } from "@itwin/core-common";

import { SavedViewsManager } from "../api/SavedViewsManager";
import { type SavedView } from "../api/utilities/SavedViewTypes";
import { SavedViewUtil } from "../api/utilities/SavedViewUtil";
import { type GroupItemProps } from "../ui/grouplist/groupitem/GroupItem";
import { type SavedViewsState } from "./SavedViewsStateReducer";

const getGroup = (state: SavedViewsState, props: GroupItemProps) =>
  state.groups[props.group.id];

const getViews = (state: SavedViewsState, props: GroupItemProps) =>
  props.group.id === SavedViewsManager.desktopViewsGroupId
    ? state.desktopViews
    : state.savedViews[props.group.id]
    ? state.savedViews[props.group.id]
    : [];

const getSearchFilter = (state: SavedViewsState) => state.searchFilter;

const getSearchTags = (state: SavedViewsState) => state.searchTags;

export const selectViews = (state: SavedViewsState, props: GroupItemProps): SavedView[] | ViewDefinitionProps[] => {
  const views = getViews(state, props);
  const searchTags = getSearchTags(state);
  const searchFilter = getSearchFilter(state);
  if (views) {
    return SavedViewUtil.getFilteredViews(Object.values(views), searchFilter, searchTags);
  } else {
    return [];
  }
};

export const selectShouldGroupRenderSelector = (state: SavedViewsState, props: GroupItemProps): boolean => {
  const group = getGroup(state, props);
  const views = getViews(state, props);
  const isExtraneousUnsharedGroup =
    group.id !== SavedViewsManager.ungroupedId &&
    group.id !== SavedViewsManager.desktopViewsGroupId &&
    !group.shared &&
    group.userId !== SavedViewsManager.userId;

  let thereIsASharedViewInThisGroup;

  if (views) {
    const values = Object.values(views);
    thereIsASharedViewInThisGroup =
      values.length !== 0 && SavedViewUtil.isSavedView(values[0])
        ? (values as SavedView[]).some((s) => s.shared)
        : false;
  } else {
    thereIsASharedViewInThisGroup = false;
  }

  return (
    !isExtraneousUnsharedGroup ||
    (isExtraneousUnsharedGroup && thereIsASharedViewInThisGroup)
  );
};
