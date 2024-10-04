/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { SvgLocation, SvgLockUnlocked, SvgShare, SvgStar } from "@itwin/itwinui-icons-react";
import { SavedViewTile, type SavedViewGroup, type SavedView, type SavedViewTag } from "@itwin/saved-views-react";
import { createSavedViewOptions, type CreateSavedViewOptionsParams } from "@itwin/saved-views-react/experimental";
import { useState, type ReactElement } from "react";

import { MockThumbnail } from "../useSavedViewData.js";

export function SavedViewTileBasic(): ReactElement {
  const savedView: SavedView = {
    savedViewId: "tileId",
    displayName: "Basic Saved View",
  };

  return (
    <div style={{ placeSelf: "center" }}>
      <SavedViewTile savedView={savedView} thumbnail={<MockThumbnail />} />
    </div>
  );
}

export function SavedViewTileNoThumbnail(): ReactElement {
  const savedView: SavedView = {
    savedViewId: "tileId",
    displayName: "Basic Saved View",
  };

  return (
    <div style={{ placeSelf: "center" }}>
      <SavedViewTile savedView={savedView} />
    </div>
  );
}

export function SavedViewTileBadges(): ReactElement {
  const savedViewLeft: SavedView = {
    savedViewId: "tileId1",
    displayName: "Saved view left badges",
  };

  const savedViewRight: SavedView = {
    savedViewId: "tileId2",
    displayName: "Saved view right badges",
  };

  const savedViewBoth: SavedView = {
    savedViewId: "tileId3",
    displayName: "Saved view both badges",
  };

  const leftIcons = [<SvgLocation key="location" />, <SvgLockUnlocked key="unlocked" />];
  const rightIcons = [<SvgStar key="star" />, <SvgShare key="share" />];
  return (
    <div style={{ display: "grid", grid: "auto auto / auto auto", gap: "var(--iui-size-m)", placeSelf: "center" }}>
      <SavedViewTile savedView={savedViewLeft} thumbnail={<MockThumbnail />} leftIcons={leftIcons} />
      <SavedViewTile savedView={savedViewRight} thumbnail={<MockThumbnail />} rightIcons={rightIcons} />
      <SavedViewTile
        savedView={savedViewBoth}
        thumbnail={<MockThumbnail />}
        leftIcons={leftIcons}
        rightIcons={rightIcons}
      />
    </div>
  );
}

export function SavedViewTileEditableName(): ReactElement {
  const [displayName, setDisplayName] = useState("Editable name");
  const savedView: SavedView = {
    savedViewId: "tileId",
    displayName,
  };

  return (
    <div style={{ placeSelf: "center" }}>
      <SavedViewTile
        savedView={savedView}
        thumbnail={<MockThumbnail />}
        onRename={(_, newName) => newName && setDisplayName(newName)}
        editable
      />
    </div>
  );
}

export function SavedViewTileGroups(): ReactElement {
  const [groupId, setGroupId] = useState<string>();
  const savedView: SavedView = {
    savedViewId: "tileId",
    displayName: "Grouped saved view",
    groupId,
  };

  const [groups, setGroups] = useState<SavedViewGroup[]>([
    { groupId: "group1", displayName: "First Group" },
  ]);

  const groupActions: CreateSavedViewOptionsParams["groupActions"] = {
    groups,
    moveToGroup(_savedViewId: string, groupId: string): void {
      setGroupId(groupId);
    },
    moveToNewGroup(_savedViewId: string, groupName: string): void {
      const groupId = groups.length.toString();
      setGroups((prev) => [...prev, { groupId, displayName: groupName }]);
      setGroupId(groupId);
    },
  };

  return (
    <div style={{ placeSelf: "center" }}>
      <SavedViewTile
        savedView={savedView}
        thumbnail={<MockThumbnail />}
        options={createSavedViewOptions({ groupActions })}
      />
    </div>
  );
}

export function SavedViewTileTags(): ReactElement {
  const [tagIds, setTagIds] = useState<string[]>(["tag1"]);
  const savedView: SavedView = {
    savedViewId: "tileId",
    displayName: "Saved view with tags",
    tagIds,
  };

  const [tags, setTags] = useState<SavedViewTag[]>([
    { tagId: "tag1", displayName: "First tag" },
    { tagId: "tag2", displayName: "Second tag" },
    { tagId: "tag3", displayName: "Third tag" },
  ]);

  const tagActions: CreateSavedViewOptionsParams["tagActions"] = {
    tags,
    addTag(_savedViewId: string, tagId: string): void {
      setTagIds((prev) => [...prev, tagId]);
    },
    addNewTag(_savedViewId: string, tagName: string): void {
      const tagId = tags.length.toString();
      setTags((prev) => [...prev, { tagId, displayName: tagName }]);
      setTagIds((prev) => [...prev, tagId]);
    },
    removeTag(_savedViewId: string, tagId: string): void {
      setTagIds((prev) => prev.filter((id) => id !== tagId));
    },
  };

  return (
    <div style={{ placeSelf: "center" }}>
      <SavedViewTile
        savedView={savedView}
        thumbnail={<MockThumbnail />}
        options={createSavedViewOptions({ tagActions })}
        tags={new Map(tags.map((tag) => [tag.tagId, tag]))}
      />
    </div>
  );
}
