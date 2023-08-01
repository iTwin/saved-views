// Copyright (c) Bentley Systems, Incorporated. All rights reserved.
import _ from "lodash";

import type { Group, SavedView } from "../api/utilities/SavedViewTypes";

export interface BooleanObject {
  [key: string]: boolean | undefined;
}

export interface GroupObject {
  [key: string]: Group;
}

export interface SavedViewsObject {
  [key: string]: { [key: string]: SavedView; };
}

export const SavedViewActions = {
  setViewSelected: (currentState: SavedView[], view: SavedView, selected: boolean) => {
    if (selected) {
      const viewAlreadySelected = currentState.find((v) => v.id === view.id);

      if (viewAlreadySelected) {
        return currentState;
      } else {
        return [...currentState, view];
      }
    } else {
      return [...currentState.filter((s) => s.id !== view.id)];
    }
  },

  setGroupOpen: (currentState: BooleanObject, groupId: string, opened: boolean): BooleanObject => {
    if (
      undefined !== currentState[groupId] &&
      currentState[groupId] === opened
    ) {
      return currentState;
    }

    return {
      ...currentState,
      [groupId]: opened,
    };
  },

  setRenaming: (currentState: BooleanObject, id: string, renaming: boolean): BooleanObject => {
    if (undefined !== currentState[id] && currentState[id] === renaming) {
      return currentState;
    }

    return {
      ...currentState,
      [id]: renaming,
    };
  },

  deleteGroup: (currentState: GroupObject, id: string): GroupObject => {
    return _.omit(currentState, id);
  },

  updateGroup: (currentState: GroupObject, id: string, newGroup: Group): GroupObject => {
    if (currentState[id] && _.isEqual(newGroup, currentState[id])) {
      return currentState;
    }

    return {
      ...currentState,
      [id]: newGroup,
    };
  },

  createGroup: (currentState: GroupObject, newGroup: Group): GroupObject => {
    if (currentState[newGroup.id]) {
      // The group already exists
      return currentState;
    }

    const ungrouped = currentState["-1"];

    return {
      "-1": ungrouped,
      [newGroup.id]: newGroup,
      ...currentState,
    };
  },

  deleteView: (currentState: SavedViewsObject, id: string, groupId: string): SavedViewsObject => {
    const views = currentState[groupId] ? currentState[groupId] : {};
    const updatedViews = _.omit(views, id);

    return {
      ...currentState,
      [groupId]: {
        ...updatedViews,
      },
    };
  },

  updateView: (currentState: SavedViewsObject, id: string, groupId: string, newView: SavedView): SavedViewsObject => {
    const views = currentState[groupId] ? currentState[groupId] : {};

    if (views[id]) {
      const currentView = views[id];
      if (_.isEqual(currentView, newView)) {
        return currentState;
      }
    }

    return {
      ...currentState,
      [groupId]: {
        ...views,
        [id]: newView,
      },
    } as SavedViewsObject;
  },

  addSearchTag: (currentState: string[], searchTag: string) => {
    if (!currentState.includes(searchTag)) {
      return [...currentState, searchTag];
    } else {
      return currentState;
    }
  },

  removeSearchTag: (_currentState: string[], searchTag: string) => {
    return _currentState.filter((tag) => tag !== searchTag);
  },
};
