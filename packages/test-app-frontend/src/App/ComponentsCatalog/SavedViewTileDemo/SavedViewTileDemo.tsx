/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { SvgLocation, SvgLockUnlocked, SvgShare, SvgStar } from "@itwin/itwinui-icons-react";
import {
  CreateTileOptionsParams, SavedViewTile, createTileOptions, type SavedView, type SavedViewGroup, type SavedViewTag,
} from "@itwin/saved-views-react";
import { useState, type ReactElement } from "react";

import { useThumbnailImage } from "../useSavedViewData.js";

export function SavedViewTileBasic(): ReactElement {
  const thumbnail = useThumbnailImage();

  const savedView: SavedView = {
    id: "tileId",
    displayName: "Basic Saved View",
    thumbnail,
  };

  return (
    <div style={{ placeSelf: "center" }}>
      <SavedViewTile savedView={savedView} />
    </div>
  );
}

export function SavedViewTileNoThumbnail(): ReactElement {
  const savedView: SavedView = {
    id: "tileId",
    displayName: "Basic Saved View",
  };

  return (
    <div style={{ placeSelf: "center" }}>
      <SavedViewTile savedView={savedView} />
    </div>
  );
}

export function SavedViewTileBadges(): ReactElement {
  const thumbnail1 = useThumbnailImage();
  const thumbnail2 = useThumbnailImage();

  const savedViewLeft: SavedView = {
    id: "tileId",
    displayName: "Saved view left badges",
    thumbnail: thumbnail1,
  };

  const savedViewRight: SavedView = {
    id: "tileId",
    displayName: "Saved view right badges",
    thumbnail: thumbnail2,
  };

  const leftIcons = [<SvgLocation key="location" />, <SvgLockUnlocked key="unlocked" />];
  const rightIcons = [<SvgStar key="star" />, <SvgShare key="share" />];
  return (
    <div style={{ placeSelf: "center", display: "flex", gap: "var(--iui-size-m)" }}>
      <SavedViewTile savedView={savedViewLeft} leftIcons={leftIcons} />
      <SavedViewTile savedView={savedViewRight} rightIcons={rightIcons} />
    </div>
  );
}

export function SavedViewTileEditableName(): ReactElement {
  const [displayName, setDisplayName] = useState("Editable name");
  const thumbnail = useThumbnailImage();
  const savedView: SavedView = {
    id: "tileId",
    displayName,
    thumbnail,
  };

  return (
    <div style={{ placeSelf: "center" }}>
      <SavedViewTile savedView={savedView} onRename={(_, newName) => setDisplayName(newName)} editable />
    </div>
  );
}

export function SavedViewTileGroups(): ReactElement {
  const [groupId, setGroupId] = useState<string>();
  const thumbnail = useThumbnailImage();
  const savedView: SavedView = {
    id: "tileId",
    displayName: "Grouped saved view",
    groupId,
    thumbnail,
  };

  const [groups, setGroups] = useState<SavedViewGroup[]>([
    { id: "group1", displayName: "First Group" },
  ]);

  const groupActions: CreateTileOptionsParams["groupActions"] = {
    groups,
    moveToGroup(_savedViewId: string, groupId: string): void {
      setGroupId(groupId);
    },
    moveToNewGroup(_savedViewId: string, groupName: string): void {
      const groupId = groups.length.toString();
      setGroups((prev) => [...prev, { id: groupId, displayName: groupName }]);
      setGroupId(groupId);
    },
  };

  return (
    <div style={{ placeSelf: "center" }}>
      <SavedViewTile savedView={savedView} options={createTileOptions({ groupActions })} />
    </div>
  );
}

export function SavedViewTileTags(): ReactElement {
  const [tagIds, setTagIds] = useState<string[]>(["tag1"]);
  const thumbnail = useThumbnailImage();
  const savedView: SavedView = {
    id: "tileId",
    displayName: "Saved view with tags",
    tagIds,
    thumbnail,
  };

  const [tags, setTags] = useState<SavedViewTag[]>([
    { id: "tag1", displayName: "First tag" },
    { id: "tag2", displayName: "Second tag" },
    { id: "tag3", displayName: "Third tag" },
  ]);

  const tagActions: CreateTileOptionsParams["tagActions"] = {
    tags,
    addTag(_savedViewId: string, tagId: string): void {
      setTagIds((prev) => [...prev, tagId]);
    },
    addNewTag(_savedViewId: string, tagName: string): void {
      const tagId = tags.length.toString();
      setTags((prev) => [...prev, { id: tagId, displayName: tagName }]);
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
        options={createTileOptions({ tagActions })}
        tags={new Map(tags.map((tag) => [tag.id, tag]))}
      />
    </div>
  );
}
