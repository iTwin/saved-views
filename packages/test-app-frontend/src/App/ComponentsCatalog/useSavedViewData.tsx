/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import type { SavedView, SavedViewActions, SavedViewGroup, SavedViewTag } from "@itwin/saved-views-react";
import { enableMapSet, produce } from "immer";
import { useEffect, useState } from "react";

enableMapSet();

export function useSavedViewData() {
  const [state, setState] = useState(() => {
    const tags = new Map(Array.from({ length: 10 }).map(() => createTag()).map((tag) => [tag.id, tag]));
    const groups = new Map(
      Array.from({ length: 10 }).map(() => createSavedViewGroup()).map((group) => [group.id, group]),
    );
    const savedViews = new Map<string, SavedView>([
      ...createSavedViews(undefined, [...tags.keys()], 100),
      ...[...groups.keys()].map((groupId) => createSavedViews(groupId, [...tags.keys()], 10)).flat(),
    ]);
    return { savedViews, groups, tags, editing: false };
  });

  useEffect(
    () => {
      let disposed = false;
      void (async () => {
        for (const savedViewId of state.savedViews.keys()) {
          const thumbnail = await getThumbnailImage();
          if (disposed) {
            return;
          }

          setState(
            produce((draft) => {
              const savedView = draft.savedViews.get(savedViewId);
              if (!savedView) {
                return;
              }

              savedView.thumbnail = thumbnail;
            }),
          );
        }
      })();

      return () => { disposed = true; };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const actions: Partial<SavedViewActions> = {
    renameSavedView(savedViewId: string, newName: string | undefined): void {
      if (!newName) {
        return;
      }

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
    renameGroup(groupId: string, newName: string): void {
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
    moveToGroup(savedViewId: string, groupId: string): void {
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
    moveToNewGroup(savedViewId: string, groupName: string): void {
      setState((prev) => {
        return produce(
          prev,
          (draft) => {
            const savedView = draft.savedViews.get(savedViewId);
            if (!savedView) {
              return;
            }

            const newGroup: SavedViewGroup = {
              id: crypto.randomUUID(),
              displayName: groupName,
              shared: false,
            };
            savedView.groupId = newGroup.id;
            const groups = [...prev.groups.values(), newGroup]
              .sort((a, b) => a.displayName.localeCompare(b.displayName))
              .map((group) => [group.id, group] as const);
            draft.groups = new Map(groups);
            draft.editing = true;
          },
        );
      });
    },
    addTag(savedViewId: string, tagId: string): void {
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
    addNewTag(savedViewId: string, tagName: string): void {
      setState((prev) => {
        return produce(
          prev,
          (draft) => {
            const savedView = draft.savedViews.get(savedViewId);
            if (!savedView) {
              return;
            }

            const newTag: SavedViewTag = {
              id: crypto.randomUUID(),
              displayName: tagName,
            };
            savedView.tagIds ??= [];
            savedView.tagIds.push(newTag.id);
            const tags = [...prev.tags.values(), newTag].sort((a, b) => a.displayName.localeCompare(b.displayName));
            draft.tags = new Map(tags.map((tag) => [tag.id, tag]));
            draft.editing = true;
          },
        );
      });
    },
    removeTag(savedViewId: string, tagId: string): void {
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
  return { id: id.toString(), displayName: `Group ${id}`, shared: Math.random() > 0.8 };
}

let lastSavedViewGroupId = 0;

function createSavedViews(groupId: string | undefined, tagIds: string[], amount: number): Array<[string, SavedView]> {
  return Array
    .from({ length: amount })
    .map(() => createSavedView(groupId, tagIds))
    .map((savedView) => [savedView.id, savedView]);
}

function createSavedView(groupId: string | undefined, tagIds: string[]): SavedView {
  const id = ++lastSavedViewId;
  return {
    id: id.toString(),
    displayName: `Saved View ${id}`,
    shared: Math.random() > 0.8,
    tagIds: pickRandomItems(Math.floor(8.0 * (Math.random() ** 2)), tagIds),
    groupId,
    thumbnail: undefined,
  };
}

let lastSavedViewId = 0;

function createTag(): SavedViewTag {
  const id = ++lastTagId;
  return { id: id.toString(), displayName: `Tag ${id}` };
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

export function useThumbnailImage(): string | undefined {
  const [thumbnail, setThumbnail] = useState<string | undefined>("");
  useEffect(
    () => {
      let disposed = false;
      void (async () => {
        const thumbnail = await getThumbnailImage();
        if (!disposed) {
          setThumbnail(thumbnail);
        }
      })();

      return () => { disposed = true; };
    },
    [],
  );

  return thumbnail;
}

async function getThumbnailImage(): Promise<string | undefined> {
  const canvas = new OffscreenCanvas(400, 300);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return undefined;
  }

  // Normalize coordates, put (0; 0) at the center, and flip the Y axis
  ctx.setTransform(0.5 * canvas.width, 0.0, 0.0, -0.5 * canvas.width, 0.5 * canvas.width, 0.5 * canvas.height);

  ctx.fillStyle = "#666666";
  ctx.fillRect(-1.0, -1.0, 2.0, 2.0);

  ctx.translate(0.0, -0.035);
  ctx.scale(2.0, 2.0);

  const hue = Math.floor(Math.random() * 360);
  paintCube(ctx, `oklch(60% 0.25 ${hue})`);

  const imageBlob = await canvas.convertToBlob();
  return URL.createObjectURL(imageBlob);
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
