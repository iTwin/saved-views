/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { describe, expect, it } from "vitest";

import { defaultLocalization } from "./localization.js";

describe("localization", () => {
  it("has all required default strings", () => {
    expect(defaultLocalization.delete).toBe("Delete");
    expect(defaultLocalization.rename).toBe("Rename");
  });

  it("has moveToGroupMenu strings", () => {
    expect(defaultLocalization.moveToGroupMenu).toBeDefined();
    expect(defaultLocalization.moveToGroupMenu.createGroup).toBe("Create group:");
    expect(defaultLocalization.moveToGroupMenu.current).toBe("(current)");
    expect(defaultLocalization.moveToGroupMenu.findGroup).toBe("Find a group");
    expect(defaultLocalization.moveToGroupMenu.findOrCreateGroup).toBe("Find or create a new group");
    expect(defaultLocalization.moveToGroupMenu.moveToGroup).toBe("Move to group");
  });

  it("has searchableMenu strings", () => {
    expect(defaultLocalization.searchableMenu).toBeDefined();
    expect(defaultLocalization.searchableMenu.noSearchResults).toBe("No search results");
  });

  it("has tagsMenu strings", () => {
    expect(defaultLocalization.tagsMenu).toBeDefined();
    expect(defaultLocalization.tagsMenu.createTag).toBe("Create tag:");
    expect(defaultLocalization.tagsMenu.findOrCreateTag).toBe("Find or create a new tag");
    expect(defaultLocalization.tagsMenu.findTag).toBe("Find a tag");
    expect(defaultLocalization.tagsMenu.tags).toBe("Tags");
  });

  it("has tile strings", () => {
    expect(defaultLocalization.tile).toBeDefined();
    expect(defaultLocalization.tile.moreTags).toBe("more");
  });

  it("has tileGrid strings", () => {
    expect(defaultLocalization.tileGrid).toBeDefined();
    expect(defaultLocalization.tileGrid.moreAvailable).toBe("more available");
    expect(defaultLocalization.tileGrid.showMore).toBe("Show more");
  });
});
