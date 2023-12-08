/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { AppNotificationManager, UiFramework } from "@itwin/appui-react";
import { Id64 } from "@itwin/core-bentley";
import {
  AuthorizationClient, BentleyCloudRpcManager, BentleyCloudRpcParams, IModelReadRpcInterface, IModelTileRpcInterface,
} from "@itwin/core-common";
import { CheckpointConnection, IModelApp, IModelConnection, ViewCreator3d, ViewState } from "@itwin/core-frontend";
import { ITwinLocalization } from "@itwin/core-i18n";
import { UiCore } from "@itwin/core-react";
import { FrontendIModelsAccess } from "@itwin/imodels-access-frontend";
import { IModelsClient } from "@itwin/imodels-client-management";
import { PageLayout } from "@itwin/itwinui-layouts-react";
import { Button, toaster } from "@itwin/itwinui-react";
import {
  ITwinSavedViewsClient, SavedViewsFolderWidget, createTileOptions, useSavedViews,
} from "@itwin/saved-views-react";
import { useEffect, useMemo, useState, type ReactElement } from "react";

import { applyUrlPrefix } from "../../environment";
import { LoadingScreen } from "../common/LoadingScreen";

export interface ITwinJsAppProps {
  iTwinId: string;
  iModelId: string;
  authorizationClient: AuthorizationClient;
}

export function ITwinJsApp(props: ITwinJsAppProps): ReactElement | null {
  type LoadingState = "opening-imodel" | "opening-viewstate" | "creating-viewstate" | "loaded";
  const [loadingState, setLoadingState] = useState<LoadingState>("opening-imodel");
  const iModel = useIModel(props.iTwinId, props.iModelId, props.authorizationClient);
  useEffect(
    () => {
      if (!iModel) {
        return;
      }

      let disposed = false;
      void (async () => {
        setLoadingState("opening-viewstate");
        let viewState = await getStoredViewState(iModel);
        if (disposed) {
          return;
        }

        if (!viewState) {
          setLoadingState("creating-viewstate");
          const viewCreator = new ViewCreator3d(iModel);
          viewState = await viewCreator.createDefaultView();
        }

        if (!disposed) {
          setLoadingState("loaded");
          UiFramework.setIModelConnection(iModel);
          UiFramework.setDefaultViewState(viewState);
        }
      })();
      return () => { disposed = true; };
    },
    [iModel],
  );

  const client = useMemo(
    () => new ITwinSavedViewsClient({
      getAccessToken: () => props.authorizationClient.getAccessToken(),
      baseUrl: "https://qa-api.bentley.com/savedviews",
    }),
    [props.authorizationClient],
  );

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

  if (loadingState === "opening-imodel") {
    return <LoadingScreen>Opening iModel...</LoadingScreen>;
  }

  if (loadingState === "opening-viewstate") {
    return <LoadingScreen>Opening ViewState...</LoadingScreen>;
  }

  if (loadingState === "creating-viewstate") {
    return <LoadingScreen>Creating ViewState...</LoadingScreen>;
  }

  if (!savedViews) {
    return <LoadingScreen>Loading saved views...</LoadingScreen>;
  }

  const groups = [...savedViews.groups.values()];
  const tags = [...savedViews.tags.values()];
  const tileOptions = createTileOptions({
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

  const handleCreateView = () => savedViews.actions.createSavedView(
    "0 Saved View Name",
    {
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
  );

  return (
    <PageLayout.Content
      style={{ display: "grid", grid: "auto minmax(0, 1fr) / 1fr", gap: "var(--iui-size-s)", height: "100%" }}
    >
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
      />
    </PageLayout.Content>
  );
}

export async function initializeITwinJsApp(_authorizationClient: AuthorizationClient): Promise<void> {
  if (IModelApp.initialized) {
    return;
  }

  const iModelsClient = new IModelsClient({ api: { baseUrl: applyUrlPrefix("https://api.bentley.com/imodels") } });
  await IModelApp.startup({
    localization: new ITwinLocalization({
      initOptions: { lng: "en" },
      urlTemplate: "/locales/{{lng}}/{{ns}}.json",
    }),
    notifications: new AppNotificationManager(),
    hubAccess: new FrontendIModelsAccess(iModelsClient),
    publicPath: "/",
  });
  const rpcParams: BentleyCloudRpcParams = {
    info: { title: "test-app-backend", version: "v1.0" },
    uriPrefix: "http://localhost:3002",
  };

  BentleyCloudRpcManager.initializeClient(rpcParams, [IModelReadRpcInterface, IModelTileRpcInterface]);
  await Promise.all([UiCore.initialize(IModelApp.localization), UiFramework.initialize(undefined)]);
}

function useIModel(
  iTwinId: string,
  iModelId: string,
  authorizationClient: AuthorizationClient,
): IModelConnection | undefined {
  const [iModel, setIModel] = useState<IModelConnection>();

  useEffect(
    () => {
      setIModel(undefined);
      IModelApp.authorizationClient = authorizationClient;

      let disposed = false;
      const iModelPromise = CheckpointConnection.openRemote(iTwinId, iModelId);
      void (async () => {
        try {
          const openedIModel = await iModelPromise;
          if (!disposed) {
            setIModel(openedIModel);
          }
        } catch (error) {
          displayIModelError(IModelApp.localization.getLocalizedString("App:error:imodel-open-remote"), error);
        }
      })();

      return () => {
        disposed = true;
        void (async () => {
          const openedIModel = await iModelPromise;
          try {
            await openedIModel.close();
          } catch (error) {
            displayIModelError(IModelApp.localization.getLocalizedString("App:error:imodel-close-remote"), error);
          }
        })();
      };
    },
    [authorizationClient, iModelId, iTwinId],
  );

  return iModel;
}

function displayIModelError(message: string, error: unknown): void {
  const errorMessage = (error && typeof error === "object") ? (error as { message: unknown; }).message : error;
  toaster.negative(<>{message}<br /> {errorMessage}</>);
}

async function getStoredViewState(iModel: IModelConnection): Promise<ViewState | undefined> {
  let viewId: string | undefined = await iModel.views.queryDefaultViewId();
  if (viewId === Id64.invalid) {
    const viewDefinitionProps = await iModel.views.queryProps({ wantPrivate: false, limit: 1 });
    viewId = viewDefinitionProps[0]?.id;
  }

  return viewId ? iModel.views.load(viewId) : undefined;
}
