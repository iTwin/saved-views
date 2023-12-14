/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

export type LocalizationStrings = Customizable<typeof defaultLocalization>;

type Customizable<T> = {
  -readonly [K in keyof T]?: T[K] extends string ? string | undefined : Customizable<T[K]> | undefined;
}

export const defaultLocalization = {
  /** @default "Delete" */
  delete: "Delete",

  /** @default "Rename" */
  rename: "Rename",

  moveToGroupMenu: {
    /** @default "Create group" */
    createGroup: "Create group:",

    /** @default "(current)" */
    current: "(current)",

    /** @default "Find a group" */
    findGroup: "Find a group",

    /** @default "Find or create a new group" */
    findOrCreateGroup: "Find or create a new group",

    /** @default "Move to group" */
    moveToGroup: "Move to group",
  },

  searchableMenu: {
    /** @default "No search results" */
    noSearchResults: "No search results",
  },

  tagsMenu: {
    /** @default "Create tag:" */
    createTag: "Create tag:",

    /** @default "Find or create a new tag" */
    findOrCreateTag: "Find or create a new tag",

    /** @default "Find a tag" */
    findTag: "Find a tag",

    /** @default "Tags" */
    tags: "Tags",
  },

  tile: {
    /** @default "more" */
    moreTags: "more",
  },
} as const;
