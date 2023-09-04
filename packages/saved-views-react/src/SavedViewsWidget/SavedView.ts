/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import type { ReactNode } from "react";

export interface SavedView {
  id: string;
  displayName: string;
  tagIds?: string[] | undefined;
  groupId?: string | undefined;
  shared?: boolean | undefined;
  thumbnail?: ReactNode | string | undefined;
}

export interface SavedViewTag {
  id: string;
  displayName: string;
}

export interface SavedViewGroup {
  id: string;
  displayName: string;
  shared?: boolean | undefined;
}

export interface SavedViewsActions {
  renameSavedView?: ((savedViewId: string, newName: string) => void) | undefined;
  renameGroup?: ((groupId: string, newName: string) => void) | undefined;
  deleteGroup?: ((groupId: string) => void) | undefined;
  moveToGroup?: ((savedViewId: string, groupId: string) => void) | undefined;
  moveToNewGroup?: ((savedViewId: string, groupName: string) => void) | undefined;
  addTag?: ((savedViewId: string, tagId: string) => void) | undefined;
  addNewTag?: ((savedViewId: string, tagName: string) => void) | undefined;
  removeTag?: ((savedViewId: string, tagId: string) => void) | undefined;
}
