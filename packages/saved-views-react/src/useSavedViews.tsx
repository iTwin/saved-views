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
  /** iTwin identifier. */
  iTwinId: string;

  /** iModel identifier. */
  iModelId: string;

  /** Implements communication with Saved Views store. */
  client: SavedViewsClient;

  /**
   * Invoked when any of {@linkcode SavedViewActions} is triggered. Does not get called again until either
   * {@linkcode onUpdateComplete} or {@linkcode onUpdateError} is invoked.
   */
  onUpdateInProgress?: (() => void) | undefined;

  /** Invoked once after {@linkcode onUpdateInProgress} when the data is successfully synchronised with the store. */
  onUpdateComplete?: (() => void) | undefined;

  /** Invoked once after {@linkcode onUpdateInProgress} when data synchronisation with the store fails. */
  onUpdateError?: ((error: unknown) => void) | undefined;
}

interface UseSavedViewsResult {
  savedViews: Map<string, SavedView>;
  groups: Map<string, SavedViewGroup>;
  tags: Map<string, SavedViewTag>;
  actions: SavedViewActions;
}

export interface SavedViewActions {
  submitSavedView: (
    savedView: string | Partial<SavedView> & Pick<SavedView, "displayName">,
    savedViewData: ViewData,
  ) => Promise<string>;
  renameSavedView: (savedViewId: string, newName: string | undefined) => void;
  shareSavedView: (savedViewId: string, share: boolean) => void;
  deleteSavedView: (savedViewId: string) => void;
  createGroup: (groupName: string) => void;
  renameGroup: (groupId: string, newName: string) => void;
  shareGroup: (groupId: string, share: boolean) => void;
  moveToGroup: (savedViewId: string, groupId: string) => void;
  moveToNewGroup: (savedViewId: string, groupName: string) => void;
  deleteGroup: (groupId: string) => void;
  addTag: (savedViewId: string, tagId: string) => void;
  addNewTag: (savedViewId: string, tagName: string) => void;
  removeTag: (savedViewId: string, tagId: string) => void;
  uploadThumbnail: (savedViewId: string, imageDataUrl: string) => void;
}

/**
 * Pulls Saved View data from a store and provides means to update and synchronize the data back to it. Interaction with
 * the store is performed via {@linkcode SavedViewsClient} interface which could communicate, for instance, with
 * [iTwin Saved Views API](https://developer.bentley.com/apis/savedviews/overview/) using `ITwinSavedViewsClient`.
 *
 * Note on the current implementation limitations. While the result of the first update action is reflected immediately,
 * subsequent actions are put in a queue and executed serially. This may cause the UI to feel sluggish when user makes
 * changes to Saved Views faster than the Saved Views store can be updated.
 */
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
            savedViews: new Map(result.savedViews.map((savedView) => [
              savedView.id,
              {
                ...savedView,
                thumbnail: savedView.thumbnail
                  ?? <ThumbnailPlaceholder savedViewId={savedView.id} observer={observer} />,
              },
            ])),
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
          if (!isAbortError(error)) {
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
  actionQueue: Array<() => Promise<unknown>>;
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
    submitSavedView: actionWrapper(
      async (savedView: string | Partial<SavedView> & Pick<SavedView, "displayName">, savedViewData: ViewData) => {
        let newSavedView: SavedView;
        if (typeof savedView !== "string" && savedView.id) {
          newSavedView = await client.updateSavedView(
            {
              // TypeScript cannot tell that `savedView` object contains `id` string without a little help
              savedView: { id: savedView.id, ...savedView },
              savedViewData,
              signal,
            },
          );
        } else {
          newSavedView = await client.createSavedView({
            iTwinId: iTwinId,
            iModelId: iModelId,
            savedView: typeof savedView === "string" ? { displayName: savedView } : savedView,
            savedViewData,
            signal,
          });
        }
        updateSavedViews((savedViews) => {
          const entries = Array.from(savedViews.values());
          entries.push(newSavedView);
          entries.sort((a, b) => a.displayName.localeCompare(b.displayName));
          return new Map(entries.map((savedView) => [savedView.id, savedView]));
        });
        return newSavedView.id;
      },
    ),
    renameSavedView: actionWrapper(
      async (savedViewId: string, newName: string | undefined) => {
        if (!newName) {
          return;
        }

        const savedView = ref.current.mostRecentState.savedViews.get(savedViewId);
        if (!savedView || newName === savedView.displayName) {
          return;
        }

        let prevName: string | undefined;
        updateSavedView(savedViewId, (savedView) => {
          prevName = savedView.displayName;
          savedView.displayName = newName;
        });

        try {
          await client.updateSavedView({
            savedView: { id: savedViewId, displayName: newName },
            signal,
          });
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
    shareSavedView: actionWrapper(
      async (savedViewId: string, share: boolean) => {
        const savedView = ref.current.mostRecentState.savedViews.get(savedViewId);
        if (!savedView || savedView.shared === share) {
          return;
        }

        updateSavedView(savedViewId, (savedView) => {
          savedView.shared = share;
        });

        try {
          await client.updateSavedView({ savedView: { id: savedViewId, shared: share }, signal });
        } catch (error) {
          updateSavedView(savedViewId, (savedView) => {
            savedView.shared = !share;
          });
          throw error;
        }
      },
    ),
    deleteSavedView: actionWrapper(
      async (savedViewId: string) => {
        let prevSavedViews: Map<string, SavedView> | undefined;
        updateSavedViews((savedViews) => {
          prevSavedViews = new Map(savedViews);
          savedViews.delete(savedViewId);
        });
        try {
          await client.deleteSavedView({ savedViewId, signal });
        } catch (error) {
          if (prevSavedViews !== undefined) {
            updateSavedViews(() => prevSavedViews);
          }

          throw error;
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
        updateGroups((groups) => {
          const entries = Array.from(groups.values());
          entries.push(group);
          entries.sort((a, b) => a.displayName.localeCompare(b.displayName));
          return new Map(entries.map((group) => [group.id, group]));
        });
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
          updateGroup(group.id, () => group);
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
    shareGroup: actionWrapper(
      async (groupId: string, share: boolean) => {
        const group = ref.current.mostRecentState.groups.get(groupId);
        if (!group || group.shared === share) {
          return;
        }

        updateGroup(groupId, (group) => {
          group.shared = share;
        });
        try {
          const group = await client.updateGroup({ group: { id: groupId, shared: share }, signal });
          updateGroup(group.id, () => group);
        } catch (error) {
          updateGroup(groupId, (group) => {
            group.shared = !share;
          });
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
          await client.updateSavedView({ savedView: { id: savedViewId, groupId }, signal });
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
          await client.updateSavedView({ savedView: { id: savedViewId, groupId: group.id }, signal });
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
        let prevGroups: Map<string, SavedViewGroup> | undefined;
        updateGroups((groups) => {
          prevGroups = new Map(groups);
          groups.delete(groupId);
        });
        try {
          await client.deleteGroup({ groupId, signal });
        } catch (error) {
          if (prevGroups) {
            updateGroups(() => prevGroups);
          }

          throw error;
        }
      },
    ),
    addTag: actionWrapper(
      async (savedViewId: string, tagId: string) => {
        const savedView = ref.current.mostRecentState.savedViews.get(savedViewId);
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
          await client.updateSavedView({ savedView: { id: savedViewId, tagIds }, signal });
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
        const savedView = ref.current.mostRecentState.savedViews.get(savedViewId);
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
          await client.updateSavedView({ savedView: { id: savedViewId, tagIds }, signal });
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
        const savedView = ref.current.mostRecentState.savedViews.get(savedViewId);
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
          await client.updateSavedView({ savedView: { id: savedViewId, tagIds }, signal });
        } catch (error) {
          updateSavedView(savedViewId, (savedView) => {
            savedView.tagIds = prevTagIds;
          });
          throw error;
        }
      },
    ),
    uploadThumbnail: actionWrapper(
      async (savedViewId: string, imageDataUrl: string) => {
        let prevThumnbnail: ReactNode | string | undefined;
        updateSavedView(savedViewId, (savedView) => {
          prevThumnbnail = savedView.thumbnail;
          savedView.thumbnail = imageDataUrl;
        });

        try {
          await client.uploadThumbnail({ savedViewId, image: imageDataUrl, signal });
        } catch (error) {
          if (prevThumnbnail !== undefined) {
            updateSavedView(savedViewId, (savedView) => {
              savedView.thumbnail = prevThumnbnail;
            });
          }
          throw error;
        }
      },
    ),
  };

  /**
   * Serializes action execution and notifies when action processing begins and ends. Continues to execute actions
   * after cancellation.
   */
  function actionWrapper<T extends unknown[], U>(callback: (...args: T) => Promise<U>): (...args: T) => Promise<U> {
    return async (...args) => {
      // eslint-disable-next-line no-async-promise-executor
      return new Promise(async (resolve, reject) => {
        ref.current.actionQueue.push(async () => {
          if (signal.aborted) {
            reject(signal.reason);
            return;
          }

          try {
            resolve(await callback(...args));
          } catch (error) {
            reject(error);

            if (isAbortError(error)) {
              // It's a cancellation error, no need to report it
            } else {
              try {
                onUpdateError(error);
              } catch { }
            }
          }
        });

        // If there are no other queued actions, start executing the queue
        if (ref.current.actionQueue.length === 1) {
          onUpdateInProgress();

          // By the time the first action completes, other actions may have been queued
          while (ref.current.actionQueue.length > 0) {
            await ref.current.actionQueue[0]();
            ref.current.actionQueue.shift();
          }

          onUpdateComplete();
        }
      });
    };
  }

  function updateSavedViews(
    callback: (mutableSavedViews: Map<string, SavedView>) => Map<string, SavedView> | void,
  ): void {
    if (signal.aborted) {
      return;
    }

    setState((prev) => {
      const store = { ...prev };
      const savedViews = new Map(prev.savedViews);
      store.savedViews = callback(savedViews) ?? savedViews;
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

  function updateGroups(
    callback: (mutableGroups: Map<string, SavedViewGroup>) => Map<string, SavedViewGroup> | void,
  ): void {
    if (signal.aborted) {
      return;
    }

    setState((prev) => {
      const store = { ...prev };
      const groups = new Map(prev.groups);
      store.groups = callback(groups) ?? groups;
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

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
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
