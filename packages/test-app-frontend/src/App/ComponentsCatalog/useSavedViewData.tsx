/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import type { SavedView, SavedViewGroup, SavedViewsActions, SavedViewTag } from "@itwin/saved-views-react";
import { enableMapSet, produce } from "immer";
import { type ReactElement, type ReactNode, useEffect, useState } from "react";

enableMapSet();

export function useSavedViewData() {
  const [state, setState] = useState(() => {
    const tags = new Map(Array.from({ length: 10 }).map(() => createTag()).map((tag) => [tag.tagId, tag]));
    const groups = new Map(
      Array.from({ length: 10 }).map(() => createSavedViewGroup()).map((group) => [group.groupId, group]),
    );
    const savedViews = new Map<string, SavedView>([
      ...createSavedViews(undefined, [...tags.keys()], 100),
      ...[...groups.keys()].map((groupId) => createSavedViews(groupId, [...tags.keys()], 10)).flat(),
    ]);
    const thumbnails = new Map<string, ReactNode>(
      Array.from(savedViews.keys()).map((savedViewId) => [savedViewId, <MockThumbnail key={savedViewId} />]),
    );
    return { savedViews, groups, tags, thumbnails, editing: false };
  });

  const actions: Partial<SavedViewsActions> = {
    async renameSavedView(savedViewId, newName) {
      setState(
        produce((draft) => {
          const savedView = draft.savedViews.get(savedViewId);
          if (!savedView) {
            return;
          }

          savedView.displayName = newName;
          draft.editing = true;
        }),
      );
    },
    async renameGroup(groupId, newName) {
      setState(
        produce((draft) => {
          const group = draft.groups.get(groupId);
          if (!group) {
            return;
          }

          group.displayName = newName;
          draft.editing = true;
        }),
      );
    },
    async moveToGroup(savedViewId, groupId) {
      setState(
        produce((draft) => {
          const savedView = draft.savedViews.get(savedViewId);
          if (!savedView) {
            return;
          }

          savedView.groupId = groupId;
          draft.editing = true;
        }),
      );
    },
    async addTag(savedViewId, tagId) {
      setState(
        produce((draft) => {
          const savedView = draft.savedViews.get(savedViewId);
          if (!savedView) {
            return;
          }

          savedView.tagIds ??= [];
          savedView.tagIds.push(tagId);
          draft.editing = true;
        }),
      );
    },
    async removeTag(savedViewId, tagId) {
      setState(
        produce((draft) => {
          const savedView = draft.savedViews.get(savedViewId);
          if (!savedView) {
            return;
          }

          savedView.tagIds?.splice(savedView.tagIds.indexOf(tagId), 1);
          draft.editing = true;
        }),
      );
    },
  };

  return {
    state,
    actions,
    setEditing(editing: boolean): void {
      setState((prev) => {
        const newState = { ...prev };
        newState.editing = editing;
        return newState;
      });
    },
  };
}

function createSavedViewGroup(): SavedViewGroup {
  const id = ++lastSavedViewGroupId;
  return { groupId: id.toString(), displayName: `Group ${id}`, shared: Math.random() > 0.8 };
}

let lastSavedViewGroupId = 0;

function createSavedViews(groupId: string | undefined, tagIds: string[], amount: number): Array<[string, SavedView]> {
  return Array
    .from({ length: amount })
    .map(() => createSavedView(groupId, tagIds))
    .map((savedView) => [savedView.savedViewId, savedView]);
}

function createSavedView(groupId: string | undefined, tagIds: string[]): SavedView {
  const id = ++lastSavedViewId;
  return {
    savedViewId: id.toString(),
    displayName: `Saved View ${id}`,
    shared: Math.random() > 0.8,
    tagIds: pickRandomItems(Math.floor(8.0 * (Math.random() ** 2)), tagIds),
    groupId,
  };
}

let lastSavedViewId = 0;

function createTag(): SavedViewTag {
  const id = ++lastTagId;
  return { tagId: id.toString(), displayName: `Tag ${id}` };
}

let lastTagId = 0;

function pickRandomItems<T>(n: number, items: T[]): T[] {
  if (items.length <= n) {
    return [...items];
  }

  const result = new Set<T>();
  while (result.size < n) {
    const r = Math.floor(Math.random() * items.length);
    result.add(items[r]);
  }

  return [...result];
}

export function MockThumbnail(): ReactElement {
  const [thumbnailUrl, setThumbnailUrl] = useState<string>();
  useEffect(
    () => {
      let disposed = false;
      void (async () => {
        const thumbnail = await getThumbnailImage();
        if (!disposed) {
          setThumbnailUrl(URL.createObjectURL(thumbnail));
        }
      })();

      return () => { disposed = true; };
    },
    [],
  );

  useEffect(
    () => {
      return () => {
        if (thumbnailUrl) {
          URL.revokeObjectURL(thumbnailUrl);
        }
      };
    },
    [thumbnailUrl],
  );

  return <img src={thumbnailUrl} />;
}

async function getThumbnailImage(): Promise<Blob> {
  const canvas = new OffscreenCanvas(400, 300);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not obtain 2d context from offscreen canvas.");
  }

  // Normalize coordates, put (0; 0) at the center, and flip the Y axis
  ctx.setTransform(0.5 * canvas.width, 0.0, 0.0, -0.5 * canvas.width, 0.5 * canvas.width, 0.5 * canvas.height);

  ctx.fillStyle = "#666666";
  ctx.fillRect(-1.0, -1.0, 2.0, 2.0);

  ctx.translate(0.0, -0.035);
  ctx.scale(2.0, 2.0);

  const hue = Math.floor(Math.random() * 360);
  paintCube(ctx, `oklch(60% 0.25 ${hue})`);

  return canvas.convertToBlob();
}

function paintCube(ctx: OffscreenCanvasRenderingContext2D, color: string): void {
  // Shadow
  ctx.beginPath();
  ctx.moveTo(0.05, -0.12);
  ctx.lineTo(0.2, -0.08);
  ctx.lineTo(0.3, 0.0);
  ctx.lineTo(-0.05, 0.0);
  ctx.fillStyle = "#00000055";
  ctx.fill();

  // Front
  ctx.beginPath();
  ctx.moveTo(-0.15, 0.1);
  ctx.lineTo(0.05, 0.08);
  ctx.lineTo(0.05, -0.12);
  ctx.lineTo(-0.15, -0.1);
  ctx.fillStyle = color;
  ctx.fill();

  // Top
  ctx.beginPath();
  ctx.moveTo(-0.15, 0.1);
  ctx.lineTo(0.05, 0.08);
  ctx.lineTo(0.15, 0.16);
  ctx.lineTo(-0.05, 0.18);
  ctx.fillStyle = `color-mix(in oklab, ${color}, white 25%)`;
  ctx.fill();

  // Side
  ctx.beginPath();
  ctx.moveTo(0.05, 0.08);
  ctx.lineTo(0.15, 0.16);
  ctx.lineTo(0.15, -0.04);
  ctx.lineTo(0.05, -0.12);
  ctx.fillStyle = `color-mix(in oklab, ${color}, black 20%)`;
  ctx.fill();
}
