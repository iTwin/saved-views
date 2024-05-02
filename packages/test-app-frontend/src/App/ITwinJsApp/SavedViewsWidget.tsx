/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { IModelConnection, Viewport, type ViewState } from "@itwin/core-frontend";
import { Button, useToaster } from "@itwin/itwinui-react";
import {
  ITwinSavedViewsClient, captureSavedViewData, captureSavedViewThumbnail, useSavedViews,
} from "@itwin/saved-views-react";
import {
  SavedViewsFolderWidget, createSavedViewOptions, translateLegacySavedViewToITwinJsViewState,
  translateSavedViewToLegacySavedView, type LegacySavedViewBase,
} from "@itwin/saved-views-react/experimental";
import { ReactElement, useMemo, useState } from "react";

import { applyUrlPrefix } from "../../environment.js";
import { useAuthorization } from "../Authorization.js";
import { LoadingScreen } from "../common/LoadingScreen.js";

interface SavedViewsWidgetProps {
  iTwinId: string;
  iModelId: string;
  iModel: IModelConnection;
  viewport: Viewport;
  onSavedViewSelect: (savedView: LegacySavedViewBase, viewState: ViewState) => void;
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

  const [updatingSavedViews, setUpdatingSavedViews] = useState(false);
  const savedViews = useSavedViews({
    iTwinId: props.iTwinId,
    iModelId: props.iModelId,
    client,
    onUpdateInProgress: () => setUpdatingSavedViews(true),
    onUpdateComplete: () => setUpdatingSavedViews(false),
    onUpdateError: (error) => {
      toaster.negative("Failed to update saved views.");
      // eslint-disable-next-line no-console
      console.error(error);
    },
  });

  // This function converts a saved view from the Saved View API into a legacy view, then converts the legacy view into
  // an iTwin.js-style ViewState.
  //
  // Once legacy views are officially retired, a straight translation from Saved View to ViewState can be done instead
  // (but code has not been created for that yet).
  const handleTileClick = async (savedViewId: string) => {
    const { close } = toaster.informational("Opening Saved View...", { type: "persisting" });
    try {
      const savedViewResponse = await client.getSingularSavedView({ savedViewId });
      const savedView = await translateSavedViewToLegacySavedView(props.iModel, savedViewResponse);
      const viewState = await translateLegacySavedViewToITwinJsViewState(savedView, props.iModel);
      if (viewState) {
        props.onSavedViewSelect(savedView, viewState);
      }
    } finally {
      close();
    }
  };

  if (!savedViews) {
    return <LoadingScreen>Loading saved views...</LoadingScreen>;
  }

  const handleCreateView = async () => {
    const savedViewData = await captureSavedViewData({ viewport: props.viewport });
    const savedViewId = await savedViews.actions.createSavedView("0 Saved View Name", savedViewData);
    const thumbnail = captureSavedViewThumbnail(props.viewport);
    if (thumbnail) {
      savedViews.actions.uploadThumbnail(savedViewId, thumbnail);
    }
  };

  const groups = [...savedViews.groups.values()];
  const tags = [...savedViews.tags.values()];
  const tileOptions = createSavedViewOptions({
    renameSavedView: true,
    groupActions: {
      groups,
      moveToGroup: savedViews.actions.moveToGroup,
      moveToNewGroup: savedViews.actions.moveToNewGroup,
    },
    tagActions: {
      tags,
      addTag: savedViews.actions.addTag,
      addNewTag: savedViews.actions.addNewTag,
      removeTag: savedViews.actions.removeTag,
    },
    deleteSavedView: savedViews.actions.deleteSavedView,
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
      <div style={{ display: "flex", gap: "var(--iui-size-s)", paddingTop: "var(--iui-size-s)", alignItems: "center" }}>
        <Button onClick={handleCreateView}>Create saved view</Button>
        <Button onClick={() => savedViews.actions.createGroup("0 Group")}>Create group</Button>
        {updatingSavedViews && "Updating saved views..."}
      </div>
      <SavedViewsFolderWidget
        savedViews={savedViews.savedViews}
        groups={savedViews.groups}
        tags={savedViews.tags}
        actions={savedViews.actions}
        options={() => tileOptions}
        onTileClick={handleTileClick}
      />
    </div>
  );
}
