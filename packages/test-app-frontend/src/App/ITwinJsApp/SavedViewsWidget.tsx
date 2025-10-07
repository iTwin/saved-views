/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import type { IModelConnection, Viewport } from "@itwin/core-frontend";
import { Button, useToaster } from "@itwin/itwinui-react";
import {
  ITwinSavedViewsClient, applySavedView, captureSavedViewData, captureSavedViewThumbnail, useSavedViews,
} from "@itwin/saved-views-react";
import { SavedViewsFolderWidget, createSavedViewOptions } from "@itwin/saved-views-react/experimental";
import { type ReactElement, useEffect, useMemo, useState } from "react";

import { applyUrlPrefix } from "../../environment.js";
import { useAuthorization } from "../Authorization.js";
import { LoadingScreen } from "../common/LoadingScreen.js";

interface SavedViewsWidgetProps {
  iTwinId: string;
  iModelId: string;
  iModel: IModelConnection;
  viewport: Viewport;
}

export function SavedViewsWidget(props: SavedViewsWidgetProps): ReactElement {
  const { authorizationClient } = useAuthorization();
  const client = useMemo(
    () => new ITwinSavedViewsClient({
      getAccessToken: () => authorizationClient.getAccessToken(),
      baseUrl: applyUrlPrefix("https://api.bentley.com/savedviews"),
    }),
    [authorizationClient],
  );

  const toaster = useToaster();

  let savedViews = useSavedViews({ iTwinId: props.iTwinId, iModelId: props.iModelId, client });
  const [operationsInProgress, setOperationsInProgress] = useState(0);
  savedViews = wrapAsyncFunctions(
    savedViews,
    async (func) => {
      setOperationsInProgress((prev) => prev + 1);
      return func()
        .catch((error) => {
          toaster.negative("Failed to update saved views.");
          // eslint-disable-next-line no-console
          console.error(error);
          throw error;
        })
        .finally(() => setOperationsInProgress((prev) => prev - 1));
    },
  );

  const [isLoading, setIsLoading] = useState(true);
  useEffect(
    () => (0, savedViews.startLoadingData)(() => setIsLoading(false)),
    [savedViews.startLoadingData],
  );

  const handleTileClick = async (savedViewId: string) => {
    const { close } = toaster.informational("Opening Saved View...", { type: "persisting" });
    try {
      const savedViewData = await savedViews.lookupSavedViewData(savedViewId);
      await applySavedView(props.iModel, props.viewport, savedViewData);
    } finally {
      close();
    }
  };

  if (isLoading) {
    return <LoadingScreen>Loading saved views...</LoadingScreen>;
  }

  const handleCaptureSavedView = async () => {
    try {
      const savedViewData = await captureSavedViewData({ viewport: props.viewport });
      toaster.positive("Captured saved view. See output in console.");
      // eslint-disable-next-line no-console
      console.log(savedViewData);
    } catch (error) {
      toaster.negative("Failed to capture saved view.");
      // eslint-disable-next-line no-console
      console.error(error);
    }
  };

  const handleCreateView = async () => {
    const savedViewData = await captureSavedViewData({ viewport: props.viewport });
    const savedViewId = await savedViews.createSavedView({ displayName: "0 Saved View Name" }, savedViewData);
    const thumbnail = captureSavedViewThumbnail(props.viewport);
    if (thumbnail) {
      await savedViews.uploadThumbnail(savedViewId, thumbnail);
    }
  };

  const groups = Array.from(savedViews.store.groups.values());
  const tags = Array.from(savedViews.store.tags.values());
  const tileOptions = createSavedViewOptions({
    renameSavedView: true,
    groupActions: {
      groups,
      moveToGroup: savedViews.moveToGroup,
      moveToNewGroup: async (savedViewId, groupName) => {
        try {
          setOperationsInProgress((prev) => prev + 1);
          const groupId = await savedViews.createGroup(groupName);
          await savedViews.moveToGroup(savedViewId, groupId);
        } finally {
          setOperationsInProgress((prev) => prev - 1);
        }
      },
    },
    tagActions: {
      tags,
      addTag: savedViews.addTag,
      addNewTag: async (savedViewId, tagName) => {
        try {
          setOperationsInProgress((prev) => prev + 1);
          const tagId = await savedViews.createTag(tagName);
          await savedViews.addTag(savedViewId, tagId);
        } finally {
          setOperationsInProgress((prev) => prev - 1);
        }
      },
      removeTag: savedViews.removeTag,
    },
    deleteSavedView: savedViews.deleteSavedView,
  });

  return (
    <div style={{
      width: 400,
      zIndex: 100,
      background: "var(--iui-color-background)",
      display: "grid",
      grid: "auto 1fr",
      gap: "var(--iui-size-s)",
      alignContent: "start",
      minHeight: 0,
    }}>
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "var(--iui-size-s)",
        paddingTop: "var(--iui-size-s)",
        alignItems: "center",
      }}>
        <Button onClick={handleCaptureSavedView}>Capture saved view</Button>
        <Button onClick={handleCreateView}>Create saved view</Button>
        <Button onClick={() => savedViews.createGroup("0 Group")}>Create group</Button>
        {operationsInProgress > 0 && "Updating saved views..."}
      </div>
      <SavedViewsFolderWidget
        savedViews={savedViews.store.savedViews}
        groups={savedViews.store.groups}
        tags={savedViews.store.tags}
        thumbnails={savedViews.store.thumbnails}
        actions={savedViews}
        options={() => tileOptions}
        onTileClick={handleTileClick}
      />
    </div>
  );
}

function wrapAsyncFunctions<T extends object>(obj: T, callback: (func: () => Promise<unknown>) => Promise<unknown>): T {
  return Object.fromEntries(Object.entries(obj).map(([key, value]) => [
    key,
    typeof value === "function" && value.constructor.name === "AsyncFunction"
      ? (...args: unknown[]) => callback(() => value(...args))
      : value,
  ])) as T;
}
