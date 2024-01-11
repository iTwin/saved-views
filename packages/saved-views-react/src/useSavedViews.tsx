/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import type { ViewData } from "@itwin/saved-views-client";
import {
  useCallback, useEffect, useRef, useState, type MutableRefObject, type ReactElement, type ReactNode,
  type SetStateAction,
} from "react";

import type { SavedView, SavedViewGroup, SavedViewTag } from "./SavedView.js";
import type { SavedViewsClient } from "./SavedViewsClient/SavedViewsClient.js";

interface UseSavedViewsParams {
  iTwinId: string;
  iModelId: string;
  client: SavedViewsClient;
  onUpdateInProgress?: (() => void) | undefined;
  onUpdateComplete?: (() => void) | undefined;
  onUpdateError?: ((error: unknown) => void) | undefined;
}

interface UseSavedViewsResult {
  savedViews: Map<string, SavedView>;
  groups: Map<string, SavedViewGroup>;
  tags: Map<string, SavedViewTag>;
  actions: SavedViewActions;
}

export interface SavedViewActions {
  createSavedView: (savedViewName: string, savedViewData: ViewData) => void;
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
  const onUpdateInProgress = useEvent(args.onUpdateInProgress ?? (() => { }));
  const onUpdateComplete = useEvent(args.onUpdateComplete ?? (() => { }));
  // eslint-disable-next-line no-console
  const onUpdateError = useEvent(args.onUpdateError ?? ((error) => console.error(error)));

  const [state, setState] = useState<SavedViewsStore>();
  const providerRef = useRef<Partial<ActionsRef>>({
    mostRecentState: state,
    actionQueue: [],
    abortController: new AbortController(),
  });
  providerRef.current.mostRecentState = state;

  const [provider, setProvider] = useState<SavedViewActions>();

  useEffect(
    () => {
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
                  thumbnailUrl = await args.client.getThumbnailUrl({ savedViewId, signal });
                } catch {
                  thumbnailUrl = undefined;
                }

                if (signal.aborted) {
                  return;
                }

                setState((prev) => {
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

      const abortController = new AbortController();
      const signal = abortController.signal;

      providerRef.current.abortController = abortController;
      providerRef.current.actionQueue = [];

      void (async () => {
        try {
          const result = await args.client.getSavedViewInfo({
            iTwinId: args.iTwinId,
            iModelId: args.iModelId,
            signal: signal,
          });
          if (signal.aborted) {
            return;
          }

          setState({
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

          setProvider(createSavedViewActions(
            args.iTwinId,
            args.iModelId,
            args.client,
            setState as (action: SetStateAction<SavedViewsStore>) => void,
            providerRef as MutableRefObject<ActionsRef>,
            onUpdateInProgress,
            onUpdateComplete,
            onUpdateError,
          ));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [args.client, args.iModelId, args.iTwinId],
  );

  if (state === undefined || provider === undefined) {
    return undefined;
  }

  return {
    savedViews: state.savedViews,
    groups: state.groups,
    tags: state.tags,
    actions: provider,
  };
}

// Loosely based on useEvent proposal https://github.com/reactjs/rfcs/blob/useevent/text/0000-useevent.md
function useEvent<T extends unknown[], U>(handleEvent: (...args: T) => U): (...args: T) => U {
  const handleEventRef = useRef(handleEvent);
  handleEventRef.current = handleEvent;
  return useCallback((...args) => handleEventRef.current(...args), []);
}

interface ActionsRef {
  mostRecentState: SavedViewsStore;
  actionQueue: Array<() => Promise<void>>;
  abortController: AbortController;
}

function createSavedViewActions(
  iTwinId: string,
  iModelId: string,
  client: SavedViewsClient,
  setState: (action: SetStateAction<SavedViewsStore>) => void,
  ref: MutableRefObject<ActionsRef>,
  onUpdateInProgress: () => void,
  onUpdateComplete: () => void,
  onUpdateError: (error: unknown) => void,
): SavedViewActions {
  const signal = ref.current.abortController.signal;

  return {
    createSavedView: actionWrapper(
      async (savedViewName: string, savedViewData: ViewData) => {
        const savedView = await client.createSavedView({
          iTwinId: iTwinId,
          iModelId: iModelId,
          savedView: {
            displayName: savedViewName,
          },
          savedViewData,
          signal,
        });
        updateSavedViews((savedViews) => savedViews.set(savedView.id, savedView));
      },
    ),
    renameSavedView: actionWrapper(
      async (savedViewId: string, newName: string) => {
        let prevName: string | undefined;
        updateSavedView(savedViewId, (savedView) => {
          prevName = savedView.displayName;
          savedView.displayName = newName;
        });

        try {
          const savedView = await client.updateSavedView({
            savedView: { id: savedViewId, displayName: newName },
            signal,
          });
          updateSavedView(savedViewId, () => savedView);
        } catch (error) {
          if (prevName !== undefined) {
            const restoredDisplayName = prevName;
            updateSavedView(savedViewId, (savedView) => {
              savedView.displayName = restoredDisplayName;
            });
          }
          throw error;
        }
      },
    ),
    deleteSavedView: actionWrapper(
      async (savedViewId: string) => {
        let prevSavedView: SavedView | undefined;
        updateSavedViews((savedViews) => {
          prevSavedView = savedViews.get(savedViewId);
          savedViews.delete(savedViewId);
        });
        try {
          await client.deleteSavedView({ savedViewId, signal });
        } catch {
          if (prevSavedView !== undefined) {
            const restoredSavedView = prevSavedView;
            updateSavedViews((savedViews) => {
              // The deleted view will return at the last position in the enumeration
              savedViews.set(savedViewId, restoredSavedView);
            });
          }
        }
      },
    ),
    createGroup: actionWrapper(
      async (groupName: string) => {
        const group = await client.createGroup({
          iTwinId: iTwinId,
          iModelId: iModelId,
          group: { displayName: groupName },
          signal,
        });
        updateGroups((groups) => groups.set(group.id, group));
      },
    ),
    renameGroup: actionWrapper(
      async (groupId: string, newName: string) => {
        let prevName: string | undefined;
        updateGroup(groupId, (group) => {
          prevName = group.displayName;
          group.displayName = newName;
        });
        try {
          const group = await client.updateGroup({ group: { id: groupId, displayName: newName }, signal });
          if (!signal.aborted) {
            updateGroup(group.id, () => group);
          }
        } catch (error) {
          if (prevName !== undefined) {
            const restoredDisplayName = prevName;
            updateGroup(groupId, (group) => {
              group.displayName = restoredDisplayName;
            });
          }
          throw error;
        }
      },
    ),
    moveToGroup: actionWrapper(
      async (savedViewId: string, groupId: string | undefined) => {
        let prevGroupId: string | undefined;
        updateSavedView(savedViewId, (savedView) => {
          prevGroupId = savedView.groupId;
          savedView.groupId = groupId;
        });
        try {
          const savedView = await client.updateSavedView({ savedView: { id: savedViewId, groupId }, signal });
          updateSavedView(savedView.id, () => savedView);
        } catch (error) {
          const restoredGroupId = prevGroupId;
          updateSavedView(savedViewId, (savedView) => {
            savedView.groupId = restoredGroupId;
          });
          throw error;
        }
      },
    ),
    moveToNewGroup: actionWrapper(
      async (savedViewId: string, groupName: string) => {
        const group = await client.createGroup({
          iTwinId: iTwinId,
          iModelId: iModelId,
          group: { displayName: groupName },
          signal,
        });
        if (signal.aborted) {
          return;
        }

        updateGroups((groups) => groups.set(group.id, group));
        let prevGroupId: string | undefined;
        updateSavedView(savedViewId, (savedView) => {
          prevGroupId = savedView.groupId;
          savedView.groupId = group.id;
        });
        try {
          const savedView = await client.updateSavedView({ savedView: { id: savedViewId, groupId: group.id }, signal });
          updateSavedView(savedView.id, () => savedView);
        } catch (error) {
          updateSavedView(savedViewId, (savedView) => {
            savedView.groupId = prevGroupId;
          });
          throw error;
        }
      },
    ),
    deleteGroup: actionWrapper(
      async (groupId: string) => {
        let prevGroup: SavedViewGroup | undefined;
        updateGroups((groups) => {
          prevGroup = groups.get(groupId);
          groups.delete(groupId);
        });
        try {
          await client.deleteGroup({ groupId, signal });
        } catch (error) {
          if (prevGroup) {
            const restoredGroup = prevGroup;
            updateGroups((groups) => {
              // The deleted group will return at the last position in the enumeration
              groups.set(groupId, restoredGroup);
            });
          }
          throw error;
        }
      },
    ),
    addTag: actionWrapper(
      async (savedViewId: string, tagId: string) => {
        let savedView = ref.current.mostRecentState.savedViews.get(savedViewId);
        if (!savedView) {
          return;
        }

        const tagIds = savedView.tagIds?.slice() ?? [];
        tagIds.push(tagId);
        tagIds.sort((a, b) => {
          const aDisplayName = ref.current.mostRecentState.tags.get(a)?.displayName;
          const bDisplayName = ref.current.mostRecentState.tags.get(b)?.displayName;
          return aDisplayName?.toLowerCase().localeCompare(bDisplayName?.toLowerCase() ?? "") ?? -1;
        });

        let prevTagIds: string[] | undefined;
        updateSavedView(savedViewId, (savedView) => {
          prevTagIds = savedView.tagIds;
          savedView.tagIds = tagIds;
        });

        try {
          savedView = await client.updateSavedView({ savedView: { id: savedViewId, tagIds }, signal });
          updateSavedView(savedView.id, () => savedView);
        } catch (error) {
          updateSavedView(savedViewId, (savedView) => {
            savedView.tagIds = prevTagIds;
          });
          throw error;
        }
      },
    ),
    addNewTag: actionWrapper(
      async (savedViewId: string, tagName: string) => {
        let savedView = ref.current.mostRecentState.savedViews.get(savedViewId);
        if (!savedView) {
          return;
        }

        const tag = await client.createTag({
          iTwinId: iTwinId,
          iModelId: iModelId,
          displayName: tagName,
          signal,
        });
        updateTags((tags) => {
          tags.set(tag.id, tag);
        });

        const tagIds = savedView.tagIds?.slice() ?? [];
        tagIds.push(tag.id);
        tagIds.sort((a, b) => {
          const aDisplayName = ref.current.mostRecentState.tags.get(a)?.displayName;
          const bDisplayName = ref.current.mostRecentState.tags.get(b)?.displayName;
          return aDisplayName?.toLowerCase().localeCompare(bDisplayName?.toLowerCase() ?? "") ?? -1;
        });

        let prevTagIds: string[] | undefined;
        updateSavedView(savedViewId, (savedView) => {
          prevTagIds = savedView.tagIds;
          savedView.tagIds = tagIds;
        });

        try {
          savedView = await client.updateSavedView({ savedView: { id: savedViewId, tagIds }, signal });
          updateSavedView(savedView.id, () => savedView);
        } catch (error) {
          updateSavedView(savedViewId, (savedView) => {
            savedView.tagIds = prevTagIds;
          });
          throw error;
        }
      },
    ),
    removeTag: actionWrapper(
      async (savedViewId: string, tagId: string) => {
        let savedView = ref.current.mostRecentState.savedViews.get(savedViewId);
        if (!savedView) {
          return;
        }

        const tagIds = (savedView.tagIds ?? []).filter((id) => id !== tagId);
        if (tagIds.length === (savedView.tagIds?.length ?? 0)) {
          return;
        }

        let prevTagIds: string[] | undefined;
        updateSavedView(savedViewId, (savedView) => {
          prevTagIds = savedView.tagIds;
          savedView.tagIds = tagIds;
        });
        try {
          savedView = await client.updateSavedView({ savedView: { id: savedViewId, tagIds }, signal });
          updateSavedView(savedView.id, () => savedView);
        } catch (error) {
          updateSavedView(savedViewId, (savedView) => {
            savedView.tagIds = prevTagIds;
          });
          throw error;
        }
      },
    ),
  };

  /** Serializes action execution and notifies when action processing begins and ends. Silences cancellation errors. */
  function actionWrapper<T extends unknown[]>(
    callback: (...args: T) => Promise<void>,
  ): (...args: T) => Promise<void> {
    return async (...args) => {
      ref.current.actionQueue.push(async () => {
        if (signal.aborted) {
          return;
        }

        try {
          await callback(...args);
        } catch (error) {
          if (error && typeof error === "object" && "name" in error && error.name === "AbortError") {
            // It's a cancellation error
          } else {
            throw error;
          }
        }
      });

      // If there are no other queued actions, start executing the queue
      if (ref.current.actionQueue.length === 1) {
        onUpdateInProgress();

        // By the time the first action completes, other actions may have been queued
        while (ref.current.actionQueue.length > 0) {
          try {
            await ref.current.actionQueue[0]();
          } catch (error) {
            onUpdateError(error);
          } finally {
            ref.current.actionQueue.shift();
          }
        }

        onUpdateComplete();
      }
    };
  }

  function updateSavedViews(callback: (mutableSavedViews: Map<string, SavedView>) => void): void {
    if (signal.aborted) {
      return;
    }

    setState((prev) => {
      const store = { ...prev };
      store.savedViews = new Map(prev.savedViews);
      callback(store.savedViews);
      return store;
    });
  }

  function updateSavedView(savedViewId: string, callback: (mutableSavedView: SavedView) => SavedView | void): void {
    if (signal.aborted) {
      return;
    }

    setState((prev) => {
      const store = { ...prev };
      store.savedViews = new Map(prev.savedViews);
      const prevSavedView = store.savedViews.get(savedViewId);
      if (!prevSavedView) {
        return prev;
      }

      const savedView = { ...prevSavedView };
      store.savedViews.set(savedViewId, callback(savedView) ?? savedView);
      return store;
    });
  }

  function updateGroups(callback: (mutableGroups: Map<string, SavedViewGroup>) => void): void {
    if (signal.aborted) {
      return;
    }

    setState((prev) => {
      const store = { ...prev };
      store.groups = new Map(prev.groups);
      callback(store.groups);
      return store;
    });
  }

  function updateGroup(groupId: string, callback: (mutableGroup: SavedViewGroup) => SavedViewGroup | void): void {
    if (signal.aborted) {
      return;
    }

    setState((prev) => {
      const store = { ...prev };
      store.groups = new Map(prev.groups);
      const prevGroup = store.groups.get(groupId);
      if (!prevGroup) {
        return prev;
      }

      const group = { ...prevGroup };
      store.groups.set(groupId, callback(group) ?? group);
      return store;
    });
  }

  function updateTags(callback: (mutableTags: Map<string, SavedViewTag>) => void): void {
    if (signal.aborted) {
      return;
    }

    setState((prev) => {
      const store = { ...prev };
      store.tags = new Map(prev.tags);
      callback(store.tags);
      return store;
    });
  }
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
