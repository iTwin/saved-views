/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import {
  useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactElement, type ReactNode, type SetStateAction,
} from "react";

import type {
  SavedView, SavedViewData, SavedViewGroup, SavedViewTag, WriteableSavedViewProperties,
} from "./SavedView.js";
import type { SavedViewsClient } from "./SavedViewsClient/SavedViewsClient.js";
import { useControlledState, type AllOrNone } from "./utils.js";

// #region documentation

type UseSavedViewsArgs = {
  /** iTwin identifier. */
  iTwinId: string;

  /** iModel identifier. */
  iModelId: string;

  /** Implements communication with Saved Views store. */
  client: SavedViewsClient;

} & AllOrNone<ExternalState>;

interface ExternalState {
  /**
   * Current immutable value of Saved Views store. If provided, it is returned as
   * {@linkcode UseSavedViewsResult.store}; otherwise an internal store is used.
   *
   * @example
   * const [state, setState] = useState(useSavedViews.emptyState);
   * const { store } = useSavedViews({ iTwinId, iModelId, client, state, setState });
   * console.log(store === state); // true
   */
  state: SavedViewsState;

  /**
   * Function which updates Saved Views store. It should behave the same as `setState` callback
   * that is returned by `React.useState`.
   *
   * @remarks
   * When hook arguments change, the state is not cleared automatically.
   *
   * @example
   * const [state, setState] = useState(useSavedViews.emptyState);
   * const savedViews = useSavedViews({ iTwinId, iModelId, client, state, setState });
   */
  setState: (action: SetStateAction<SavedViewsState>) => void;
}

export interface SavedViewsState {
  /** Maps `savedViewId` to {@link SavedView}. */
  savedViews: Map<string, SavedView>;

  /** Maps `savedViewId` to {@link SavedViewData}. */
  savedViewData: Map<string, SavedViewData>;

  /** Maps `groupId` to {@link SavedViewGroup}. */
  groups: Map<string, SavedViewGroup>;

  /** Maps `tagId` to {@link SavedViewTag}. */
  tags: Map<string, SavedViewTag>;

  /** Maps `savedViewId` to {@link ReactNode} representing Saved View thumbnail. */
  thumbnails: Map<string, ReactNode>;
}

interface UseSavedViewsResult extends SavedViewsActions {
  /**
   * Immutable state which holds Saved Views data. If {@linkcode UseSavedViewsArgs.state} is not
   * specified, an internal state is returned; otherwise its value is the same as the provided
   * `state` argument.
   */
  store: SavedViewsState;

  /**
   * When invoked, {@link SavedViewsClient} is queried for all available Saved Views, Groups, and
   * Tags. When the operation ends, all obtained entities are inserted into Saved Views store.
   *
   * @param callback Optional callback that is invoked when the operation ends. If an error occurs,
   *                 the operation gets cancelled and the error object is passed as the argument.
   * @returns Callback that cancels the operation.
   *
   * @example
   * const { startLoadingData } = useSavedViews({ iTwinId, iModelId, client });
   * const [isLoading, setIsLoading] = useState(true);
   * useEffect(
   *   () => {
   *     return startLoadingData((error) => {
   *       setIsLoading(false);
   *       if (error) {
   *         console.error(error);
   *       }
   *     });
   *   },
   *   [],
   * );
   */
  startLoadingData: (callback?: (error?: unknown) => void) => () => void;
}

export interface SavedViewsActions {
  /**
   * Creates a new {@link SavedView} entity using {@link SavedViewsClient} and stores the result in
   * Saved Views store.
   * @returns Identifier of the newly created Saved View.
   */
  createSavedView: (savedView: WriteableSavedViewProperties, savedViewData: SavedViewData) => Promise<string>;

  /**
   * Retrieves {@link SavedViewData} associated with given {@linkcode savedViewId} from the Saved
   * Views store if the data is present; otherwise it is queried from {@link SavedViewsClient} and the
   * store is updated to include the new data.
   */
  lookupSavedViewData: (savedViewId: string) => Promise<SavedViewData>;

  /**
   * Uses {@link SavedViewsClient} to update {@link SavedView} entity. On success, updates
   * {@link SavedView} in Saved Views store with provided values.
   */
  updateSavedView: (
    savedViewId: string,
    savedView: Partial<WriteableSavedViewProperties>,
    savedViewData?: SavedViewData | undefined,
  ) => Promise<void>;

  /**
   * Uses {@link SavedViewsClient} to update {@link SavedView} entity associated with given {@linkcode savedViewId}.
   * On success, updates {@link SavedView} in Saved Views store with provided name.
   */
  renameSavedView: (savedViewId: string, newName: string) => Promise<void>;

  /**
   * Uses {@link SavedViewsClient} to mark {@link SavedView} entity as shared or unshared. On
   * success, updates {@link SavedView} in Saved Views store with provided status.
   */
  shareSavedView: (savedViewId: string, shared: boolean) => Promise<void>;

  /**
   * Uses {@link SavedViewsClient} to delete {@link SavedView} entity. On success, removes
   * {@link SavedView} from Saved Views store.
   */
  deleteSavedView: (savedViewId: string) => Promise<void>;

  /**
   * Creates a new {@link SavedViewGroup} entity using {@link SavedViewsClient} and stores the
   * result in Saved Views store.
   * @returns Identifier of the newly created Saved View Group.
   */
  createGroup: (groupName: string) => Promise<string>;

  /**
   * Uses {@link SavedViewsClient} to update {@link SavedViewGroup} entity. On success, updates
   * {@link SavedViewGroup} in Saved Views store with provided name.
   */
  renameGroup: (groupId: string, newName: string) => Promise<void>;

  /**
   * Uses {@link SavedViewsClient} to mark {@link SavedViewGroup} entity as shared or unshared. On
   * success, updates {@link SavedViewGroup} in Saved Views store with provided status.
   */
  shareGroup: (groupId: string, shared: boolean) => Promise<void>;

  /**
   * Uses {@link SavedViewsClient} to move {@link SavedView} entity to the specified Saved View group.
   */
  moveToGroup: (savedViewId: string, groupId: string | undefined) => Promise<void>;

  /**
   * Uses {@link SavedViewsClient} to delete {@link SavedViewGroup} entity. On success, removes
   * {@link SavedViewGroup} from Saved Views store.
   */
  deleteGroup: (groupId: string) => Promise<void>;

  /**
   * Creates a new {@link SavedViewTag} entity using {@link SavedViewsClient} and stores the result
   * in Saved Views store.
   * @returns Identifier of the newly created Saved View Tag.
   */
  createTag: (tagName: string) => Promise<string>;

  /** Uses {@link SavedViewsClient} to add {@link SavedViewTag} to {@link SavedView} entity. */
  addTag: (savedViewId: string, tagId: string) => Promise<void>;

  /** Uses {@link SavedViewsClient} to remove {@link SavedViewTag} from {@link SavedView} entity. */
  removeTag: (savedViewId: string, tagId: string) => Promise<void>;

  /**
   * Uses {@link SavedViewsClient} to delete {@link SavedViewTag} entity. On success, removes
   * {@link SavedViewTag} from Saved Views store.
   */
  deleteTag: (tagId: string) => Promise<void>;

  /** Uses {@link SavedViewsClient} to change thumbnail image for {@link SavedView} entity. */
  uploadThumbnail: (savedViewId: string, imageDataUrl: string) => Promise<void>;
}

// #endregion

// #region useSavedViews

const emptyState: SavedViewsState = Object.freeze({
  savedViews: new Map(),
  savedViewData: new Map(),
  groups: new Map(),
  tags: new Map(),
  thumbnails: new Map(),
});

/**
 * Provides basic functionality to help get started with Saved Views.
 *
 * @remarks
 * When hook arguments change, it does not automatically clear the {@linkcode UseSavedViewsResult.store}.
 * If you want more control over the state, provide an external store via {@linkcode UseSavedViewsArgs.state}
 * and {@linkcode UseSavedViewsArgs.setState} arguments.
 *
 * @example
 * const { iTwinId, iModelId, client, viewport } = props;
 * const savedViews = useSavedViews({ iTwinId, iModelId, client });
 * const [isLoading, setIsLoading] = useState(true);
 * useEffect(
 *   () => {
 *     return savedViews.startLoadingData(() => { setIsLoading(false); });
 *   },
 *   [],
 * );
 *
 * if (isLoading) {
 *   return <MyLoadingState />;
 * }
 *
 * const handleOpenSavedView = async (savedViewId) => {
 *   const savedViewData = await savedViews.lookupSavedViewData(savedViewId);
 *   await applySavedView(iModel, viewport, savedViewData);
 * };
 *
 * return <MySavedViewsWidget savedViews={savedViews} onOpenSavedView={handleOpenSavedView} />;
 */
export const useSavedViews = Object.assign(
  (args: UseSavedViewsArgs): UseSavedViewsResult => {
    const { iTwinId, iModelId, client } = args;
    const [state, setState] = useControlledState(args.state ?? emptyState, args.state, args.setState);

    const stateRef = useRef({ iTwinId, iModelId, client, state, setState });
    stateRef.current = { iTwinId, iModelId, client, state, setState };

    const [events] = useState<Omit<UseSavedViewsResult, "store">>({
      ...createActions(stateRef),
      startLoadingData: (callback) => {
        const { iTwinId, iModelId, client, setState } = stateRef.current;
        const abortController = new AbortController();
        const signal = abortController.signal;

        const observer = new CustomObserver(
          (savedViewId) => {
            void (async () => {
              const loadSavedViewData = async () => {
                let savedViewData: SavedViewData | undefined;
                try {
                  savedViewData = await client.getSavedViewDataById({ savedViewId, signal });
                } catch {
                  savedViewData = undefined;
                }

                if (savedViewData && !signal.aborted) {
                  setState((prev) => {
                    const newState = { ...prev };
                    newState.savedViewData = new Map(prev.savedViewData);
                    newState.savedViewData.set(savedViewId, savedViewData);
                    return newState;
                  });
                }
              };
              const loadThumbnail = async () => {
                let thumbnailUrl: string | undefined;
                try {
                  thumbnailUrl = await client.getThumbnailUrl({ savedViewId, signal });
                } catch {
                  thumbnailUrl = undefined;
                }

                if (!signal.aborted) {
                  setState((prev) => {
                    const newState = { ...prev };
                    newState.thumbnails = new Map(prev.thumbnails);
                    newState.thumbnails.set(savedViewId, thumbnailUrl && <img src={thumbnailUrl} />);
                    return newState;
                  });
                }
              };
              await Promise.all([loadSavedViewData(), loadThumbnail()]);
            })();
          },
        );

        void (async () => {
          try {
            const result = await getSavedViewInfo(client, iTwinId, iModelId, signal);
            signal.throwIfAborted();

            setState((prev) => {
              const newState = { ...prev };
              newState.savedViews = new Map(prev.savedViews);
              result.savedViews.forEach((savedView) => newState.savedViews.set(savedView.savedViewId, savedView));
              newState.groups = new Map(prev.groups);
              result.groups.forEach((group) => newState.groups.set(group.groupId, group));
              newState.tags = new Map(prev.tags);
              result.tags.forEach((tag) => newState.tags.set(tag.tagId, tag));
              newState.thumbnails = new Map(prev.thumbnails);
              result.savedViews
                .filter(({ savedViewId }) => !prev.thumbnails.has(savedViewId))
                .forEach(({ savedViewId }) => {
                  newState.thumbnails.set(
                    savedViewId,
                    <ThumbnailPlaceholder savedViewId={savedViewId} observer={observer} />,
                  );
                });
              return newState;
            });

            callback?.();
          } catch (error) {
            if (callback) {
              callback(error);
            } else {
              throw error;
            }
          }
        })();

        return () => {
          abortController.abort();
          observer.disconnect();
        };
      },
    });

    return useMemo(() => ({ ...events, store: state }), [events, state]);
  },
  {
    /** Suggested initial state of custom Saved View stores. Immutable. */
    emptyState,
  },
);

class CustomObserver {
  #observer: IntersectionObserver;
  #observedElements = new Map<Element, string>();
  constructor(onObserved: (savedViewId: string) => void) {
    this.#observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }

          const savedViewId = this.#observedElements.get(entry.target);
          if (savedViewId) {
            onObserved(savedViewId);
          }
        }
      },
    );
  }

  observe(savedViewId: string, element: HTMLElement): void {
    this.#observedElements.set(element, savedViewId);
    this.#observer.observe(element);
  }

  unobserve(element: HTMLElement): void {
    this.#observer.unobserve(element);
    this.#observedElements.delete(element);
  }
  disconnect(): void {
    this.#observer.disconnect();
  }
}

interface SavedViewInfo {
  savedViews: SavedView[];
  groups: SavedViewGroup[];
  tags: SavedViewTag[];
}

async function getSavedViewInfo(
  client: SavedViewsClient,
  iTwinId: string,
  iModelId: string,
  signal: AbortSignal,
): Promise<SavedViewInfo> {
  const args = { iTwinId, iModelId, signal };

  const collectSavedViews = async () => {
    let savedViews: SavedView[] = [];
    const iterable = client.getSavedViews(args);
    for await (const page of iterable) {
      savedViews = savedViews.concat(page);
    }

    return savedViews;
  };

  const [savedViews, groups, tags] = await Promise.all([
    collectSavedViews(),
    client.getGroups(args),
    client.getTags(args),
  ]);

  type NamedObject = { displayName: string; };
  const comparator = (a: NamedObject, b: NamedObject) => a.displayName.localeCompare(b.displayName);
  return {
    savedViews: savedViews.sort(comparator),
    groups: groups.sort(comparator),
    tags: tags.sort(comparator),
  };
}

// #endregion

// #region ThumbnailPlaceholder

interface ThumbnailPlaceholderProps {
  savedViewId: string;
  observer: CustomObserver;
}

function ThumbnailPlaceholder(props: ThumbnailPlaceholderProps): ReactElement {
  const { savedViewId, observer } = props;
  const divRef = useRef<HTMLDivElement>(null);
  useEffect(
    () => {
      const div = divRef.current;
      if (!div) {
        return;
      }

      observer.observe(savedViewId, div);
      return () => observer.unobserve(div);
    },
    [savedViewId, observer],
  );
  return <div ref={divRef} />;
}

// #endregion

// #region createActions

function createActions(
  stateRef: MutableRefObject<{
    iTwinId: string;
    iModelId: string;
    client: SavedViewsClient;
    state: SavedViewsState;
    setState: (value: SetStateAction<SavedViewsState>) => void;
  }>,
): SavedViewsActions {
  // When an action is invoked, stateRef contains the most recent parameters that were passed to
  // useSavedViews hook. We need to ensure that the same parameters are used throughout the
  // operation, so we capture their current values at the beginning of each action.

  return {
    createSavedView: async (savedView, savedViewData) => {
      const { iTwinId, iModelId, client, setState } = stateRef.current;
      const newSavedView = await client.createSavedView({ ...savedView, iTwinId, iModelId, savedViewData });

      setState((prev) => {
        const savedViews = Array.from(prev.savedViews.values());
        savedViews.splice(
          savedViews.findIndex(({ savedViewId }) => savedViewId === newSavedView.savedViewId),
          1,
          newSavedView,
        );
        savedViews.sort((a, b) => a.displayName.localeCompare(b.displayName));

        const newState = { ...prev };
        newState.savedViews = new Map(savedViews.map((savedView) => [savedView.savedViewId, savedView]));
        return newState;
      });
      return newSavedView.savedViewId;
    },
    lookupSavedViewData: async (savedViewId) => {
      const { client, setState } = stateRef.current;
      const savedViewData = await client.getSavedViewDataById({ savedViewId });

      setState((prev) => {
        const newState = { ...prev };
        newState.savedViewData = new Map(prev.savedViewData);
        newState.savedViewData.set(savedViewId, savedViewData);
        return newState;
      });
      return savedViewData;
    },
    updateSavedView: async (savedViewId, savedView, savedViewData) => {
      const { client, setState } = stateRef.current;
      const updatedSavedView = await client.updateSavedView({ ...savedView, savedViewId, savedViewData });

      setState((prev) => {
        const savedViews = Array.from(prev.savedViews.values());
        savedViews.splice(
          savedViews.findIndex(({ savedViewId }) => savedViewId === updatedSavedView.savedViewId),
          1,
          updatedSavedView,
        );
        savedViews.sort((a, b) => a.displayName.localeCompare(b.displayName));

        const newState = { ...prev };
        newState.savedViews = new Map(savedViews.map((savedView) => [savedView.savedViewId, savedView]));
        return newState;
      });
    },
    renameSavedView: async (savedViewId, newName) => {
      const { client, setState } = stateRef.current;
      await client.updateSavedView({ savedViewId, displayName: newName });

      setState((prev) => {
        const savedView = prev.savedViews.get(savedViewId);
        if (!savedView) {
          return prev;
        }

        const newSavedView = { ...savedView };
        newSavedView.displayName = newName;

        const newState = { ...prev };
        newState.savedViews = new Map(prev.savedViews);
        newState.savedViews.set(savedViewId, newSavedView);
        savedView.displayName = newName;
        return newState;
      });
    },
    shareSavedView: async (savedViewId, shared) => {
      const { client, setState } = stateRef.current;
      await client.updateSavedView({ savedViewId, shared });

      setState((prev) => {
        const savedView = prev.savedViews.get(savedViewId);
        if (!savedView) {
          return prev;
        }

        const newSavedView = { ...savedView };
        newSavedView.shared = shared;

        const newState = { ...prev };
        newState.savedViews = new Map(prev.savedViews);
        newState.savedViews.set(savedViewId, newSavedView);
        return newState;
      });
    },
    deleteSavedView: async (savedViewId) => {
      const { client, setState } = stateRef.current;
      await client.deleteSavedView({ savedViewId });

      setState((prev) => {
        const newState = { ...prev };
        newState.savedViews = new Map(prev.savedViews);
        newState.savedViews.delete(savedViewId);
        return newState;
      });
    },
    createGroup: async (groupName) => {
      const { iTwinId, iModelId, client, setState } = stateRef.current;
      const newGroup = await client.createGroup({ iTwinId, iModelId, displayName: groupName });

      setState((prev) => {
        const groups = Array.from(prev.groups.values());
        groups.push(newGroup);
        groups.sort((a, b) => a.displayName.localeCompare(b.displayName));

        const newState = { ...prev };
        newState.groups = new Map(groups.map((group) => [group.groupId, group]));
        return newState;
      });

      return newGroup.groupId;
    },
    renameGroup: async (groupId, newName) => {
      const { client, setState } = stateRef.current;
      await client.updateGroup({ groupId, displayName: newName });

      setState((prev) => {
        const group = prev.groups.get(groupId);
        if (!group) {
          return prev;
        }

        const newGroup = { ...group };
        newGroup.displayName = newName;

        const newState = { ...prev };
        newState.groups = new Map(prev.groups);
        newState.groups.set(groupId, newGroup);
        return newState;
      });
    },
    shareGroup: async (groupId, shared) => {
      const { client, setState } = stateRef.current;
      await client.updateGroup({ groupId, shared });

      setState((prev) => {
        const group = prev.groups.get(groupId);
        if (!group) {
          return prev;
        }

        const newGroup = { ...group };
        newGroup.shared = shared;

        const newState = { ...prev };
        newState.groups = new Map(prev.groups);
        newState.groups.set(groupId, newGroup);
        return newState;
      });
    },
    moveToGroup: async (savedViewId, groupId) => {
      const { client, setState } = stateRef.current;
      await client.updateSavedView({ savedViewId, groupId });

      setState((prev) => {
        const savedView = prev.savedViews.get(savedViewId);
        if (!savedView) {
          return prev;
        }

        const newSavedView = { ...savedView };
        newSavedView.groupId = groupId;

        const newState = { ...prev };
        newState.savedViews = new Map(prev.savedViews);
        newState.savedViews.set(savedViewId, newSavedView);
        return newState;
      });
    },
    deleteGroup: async (groupId) => {
      const { client, setState } = stateRef.current;
      await client.deleteGroup({ groupId });

      setState((prev) => {
        const newState = { ...prev };
        newState.groups = new Map(prev.groups);
        newState.groups.delete(groupId);
        return newState;
      });
    },
    createTag: async (tagName) => {
      const { iTwinId, iModelId, client, setState } = stateRef.current;
      const newTag = await client.createTag({ iTwinId, iModelId, displayName: tagName });

      setState((prev) => {
        const newState = { ...prev };
        newState.tags = new Map(prev.tags);
        newState.tags.set(newTag.tagId, newTag);
        return newState;
      });

      return newTag.tagId;
    },
    addTag: async (savedViewId, tagId) => {
      const { client, state, setState } = stateRef.current;
      const savedView = state.savedViews.get(savedViewId);
      if (!savedView) {
        return;
      }

      const tagIds = savedView.tagIds?.slice() ?? [];
      tagIds.push(tagId);
      await client.updateSavedView({ savedViewId, tagIds });

      setState((prev) => {
        const savedView = prev.savedViews.get(savedViewId);
        if (!savedView) {
          return prev;
        }

        const newSavedView = { ...savedView };
        newSavedView.tagIds = savedView.tagIds?.slice() ?? [];
        newSavedView.tagIds.push(tagId);

        const newState = { ...prev };
        newState.savedViews = new Map(prev.savedViews);
        newState.savedViews.set(savedViewId, newSavedView);
        return newState;
      });
    },
    removeTag: async (savedViewId, tagId) => {
      const { client, state, setState } = stateRef.current;
      const savedView = state.savedViews.get(savedViewId);
      if (!savedView || !savedView.tagIds) {
        return;
      }

      const newTagIds = savedView.tagIds.splice(savedView.tagIds.indexOf(tagId), 1) ?? [];
      if (newTagIds.length === savedView.tagIds.length) {
        return;
      }

      await client.updateSavedView({ savedViewId, tagIds: newTagIds });

      setState((prev) => {
        const savedView = prev.savedViews.get(savedViewId);
        if (!savedView) {
          return prev;
        }

        const newSavedView = { ...savedView };
        newSavedView.tagIds = newTagIds;

        const newState = { ...prev };
        newState.savedViews = new Map(prev.savedViews);
        newState.savedViews.set(savedViewId, newSavedView);
        return newState;
      });
    },
    deleteTag: async (tagId) => {
      const { client, setState } = stateRef.current;
      await client.deleteTag({ tagId });

      setState((prev) => {
        const newState = { ...prev };
        newState.tags = new Map(prev.tags);
        newState.tags.delete(tagId);
        return newState;
      });
    },
    uploadThumbnail: async (savedViewId, imageDataUrl) => {
      const { client, setState } = stateRef.current;
      await client.uploadThumbnail({ savedViewId, image: imageDataUrl });

      setState((prev) => {
        const newState = { ...prev };
        newState.thumbnails = new Map(prev.thumbnails);
        newState.thumbnails.set(savedViewId, <img src={imageDataUrl} />);
        return newState;
      });
    },
  };
}

// #endregion
