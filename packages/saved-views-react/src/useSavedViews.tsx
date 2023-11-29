/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { ReactElement, ReactNode, useEffect, useMemo, useRef, useState } from "react";

import { SavedViewsClient } from "./SavedViewsClient/SavedViewsClient.js";
import type { SavedView, SavedViewGroup, SavedViewTag } from "./SavedViewsWidget/SavedView.js";

interface UseSavedViewsParams {
  iTwinId: string;
  iModelId: string;
  client: SavedViewsClient;
}

interface UseSavedViewsResult {
  savedViews: Map<string, SavedView>;
  groups: Map<string, SavedViewGroup>;
  tags: Map<string, SavedViewTag>;
  createSavedView: (savedViewName: string) => void;
  renameSavedView: (savedViewId: string, newName: string) => void;
  deleteSavedView: (savedViewId: string) => void;
  createGroup: (groupName: string) => void;
  renameGroup: (groupId: string, newName: string) => void;
  moveToGroup: (savedViewId: string, groupId: string) => void;
  moveToNewGroup: (savedViewId: string, groupName: string) => void;
  deleteGroup: (groupId: string) => void;
  addTag: (savedViewId: string, tagId: string) => void;
  addNewTag: (savedViewId: string, tagName: string) => void;
  removeTag: (savedViewId: string, tagId: string) => void;
}

export function useSavedViews(args: UseSavedViewsParams): UseSavedViewsResult | undefined {
  const [store, setStore] = useState<SavedViewsStore>();

  useEffect(
    () => {
      const abortController = new AbortController();

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) {
              continue;
            }

            const savedViewId = (entry.target as HTMLElement).dataset.savedViewId;
            if (savedViewId) {
              void (async () => {
                let thumbnailUrl: string | undefined;
                try {
                  thumbnailUrl = await args.client.getThumbnailUrl({ savedViewId, signal: abortController.signal });
                } catch {
                  thumbnailUrl = undefined;
                }

                if (abortController.signal.aborted) {
                  return;
                }

                setStore((prev) => {
                  if (!prev) {
                    return prev;
                  }

                  const newState = { ...prev };
                  newState.savedViews = new Map(prev.savedViews);

                  const prevSavedView = prev.savedViews.get(savedViewId);
                  if (!prevSavedView) {
                    return prev;
                  }

                  const newSavedView = { ...prevSavedView };
                  newSavedView.thumbnail = thumbnailUrl;
                  newState.savedViews.set(savedViewId, newSavedView);
                  return newState;
                });
              })();
            }
          }
        },
      );

      void (async () => {
        try {
          const result = await args.client.getSavedViewInfo({
            iTwinId: args.iTwinId,
            iModelId: args.iModelId,
            signal: abortController.signal,
          });
          if (abortController.signal.aborted) {
            return;
          }

          setStore({
            savedViews: new Map(result.savedViews.map((savedView) => {
              if (savedView.thumbnail === undefined) {
                savedView.thumbnail = <ThumbnailPlaceholder savedViewId={savedView.id} observer={observer} />;
              }

              return [savedView.id, savedView];
            })),
            groups: new Map(result.groups.map((group) => [group.id, group])),
            tags: new Map(result.tags.map((tag) => [tag.id, tag])),
            thumbnails: new Map(),
          });
        } catch (error) {
          if ((error as { name: string; }).name !== "AbortError") {
            throw error;
          }
        }
      })();

      return () => {
        abortController.abort();
        observer.disconnect();
      };
    },
    [args.iTwinId, args.iModelId, args.client],
  );

  const result = useMemo<UseSavedViewsResult | undefined>(
    () => {
      if (!store) {
        return undefined;
      }

      return {
        savedViews: store.savedViews,
        groups: store.groups,
        tags: store.tags,
        createSavedView: (savedViewName: string) => {
          void args.client.createSavedView({
            iTwinId: args.iTwinId,
            iModelId: args.iModelId,
            savedView: {
              displayName: savedViewName,
            },
            savedViewData: {
              itwin3dView: {
                origin: [0.0, 0.0, 0.0],
                extents: [100.0, 100.0, 100.0],
                angles: {
                  yaw: 90.0,
                  pitch: 90.0,
                  roll: 90.0,
                },
              },
            },
          });
        },
        renameSavedView: (savedViewId: string, newName: string) => {
          void args.client.updateSavedView({ savedView: { id: savedViewId, displayName: newName } });
        },
        deleteSavedView: (savedViewId: string) => {
          void args.client.deleteSavedView({ savedViewId });
        },
        createGroup: (groupName: string) => {
          void args.client.createGroup({
            iTwinId: args.iTwinId,
            iModelId: args.iModelId,
            group: { displayName: groupName },
          });

        },
        renameGroup: (groupId: string, newName: string) => {
          void args.client.updateGroup({ group: { id: groupId, displayName: newName } });
        },
        moveToGroup: (savedViewId: string, groupId: string) => {
          void args.client.updateSavedView({ savedView: { id: savedViewId, groupId } });
        },
        moveToNewGroup: async (savedViewId: string, groupName: string) => {
          const group = await args.client.createGroup({
            iTwinId: args.iTwinId,
            iModelId: args.iModelId,
            group: { displayName: groupName },
          });
          void args.client.updateSavedView({ savedView: { id: savedViewId, groupId: group.id } });
        },
        deleteGroup: (groupId: string) => {
          void args.client.deleteGroup({ groupId });
        },
        addTag: (savedViewId: string, tagId: string) => {
          const savedView = store.savedViews.get(savedViewId);
          if (!savedView) {
            return;
          }

          const tagIds = savedView.tagIds ?? [];
          void args.client.updateSavedView({ savedView: { id: savedViewId, tagIds: [...tagIds, tagId] } });
        },
        addNewTag: async (savedViewId: string, tagName: string) => {
          const savedView = store.savedViews.get(savedViewId);
          if (!savedView) {
            return;
          }

          const tag = await args.client.createTag({
            iTwinId: args.iTwinId,
            iModelId: args.iModelId,
            displayName: tagName,
          });

          const tagIds = savedView.tagIds ?? [];
          void args.client.updateSavedView({ savedView: { id: savedViewId, tagIds: [...tagIds, tag.id] } });
        },
        removeTag: (savedViewId: string, tagId: string) => {
          const savedView = store.savedViews.get(savedViewId);
          if (!savedView) {
            return;
          }

          const tagIds = savedView.tagIds ?? [];
          const updatedTagIds = tagIds.filter((id) => id !== tagId);
          if (updatedTagIds.length < tagIds.length) {
            void args.client.updateSavedView({ savedView: { id: savedViewId, tagIds: updatedTagIds } });
          }
        },
      };
    },
    [args.client, args.iModelId, args.iTwinId, store],
  );

  return result;
}

interface ThumbnailPlaceholderProps {
  savedViewId: string;
  observer: IntersectionObserver;
}

function ThumbnailPlaceholder(props: ThumbnailPlaceholderProps): ReactElement {
  const divRef = useRef<HTMLDivElement>(null);
  useEffect(
    () => {
      const div = divRef.current;
      if (!div) {
        return;
      }

      props.observer.observe(div);
      return () => props.observer.unobserve(div);
    },
    [props.observer],
  );
  return <div ref={divRef} data-saved-view-id={props.savedViewId} />;
}

interface SavedViewsStore {
  savedViews: Map<string, SavedView>;
  groups: Map<string, SavedViewGroup>;
  tags: Map<string, SavedViewTag>;
  thumbnails: Map<string, ReactNode>;
}
