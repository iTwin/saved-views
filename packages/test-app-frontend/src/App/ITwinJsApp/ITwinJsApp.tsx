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
import { Button, MenuItem, toaster } from "@itwin/itwinui-react";
import {
  ITwinSavedViewsClient, SavedViewOptions, SavedViewsFolderWidget, useSavedViews,
} from "@itwin/saved-views-react";
import { ReactElement, useEffect, useMemo, useState } from "react";

import { applyUrlPrefix } from "../../environment";
import { LoadingScreen } from "../common/LoadingScreen";
import { useNavigate } from "react-router-dom";

export interface ITwinJsAppProps {
  iTwinId: string;
  iModelId: string;
  authorizationClient: AuthorizationClient;
}

export function ITwinJsApp(props: ITwinJsAppProps): ReactElement | null {
  type LoadingState = "opening-imodel" | "opening-viewstate" | "creating-viewstate" | "loaded" | "rendering-imodel" | "rendered";
  const [loadingState, setLoadingState] = useState<LoadingState>("opening-imodel");
  // const [selectedViewState, setSelectedViewState] = useState<ViewState>();
  const [selectedViewId, setSelectedViewId] = useState<string>();
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

  useEffect(
    () => {
      if (!iModel) {
        return;
      }

      // if (selectedViewState) {
      if (selectedViewId && selectedViewId !== "") {
        setLoadingState("rendering-imodel");
        // renderSavedView(iModel, selectedViewState, props.iTwinId, props.iModelId);
        renderSavedView(iModel, selectedViewId, props.iTwinId, props.iModelId);
      }
    },
    // [selectedViewState],
    [selectedViewId],
  );

  const client = useMemo(
    () => new ITwinSavedViewsClient({
      getAccessToken: () => props.authorizationClient.getAccessToken(),
      baseUrl: "https://qa-api.bentley.com/savedviews",
    }),
    [props.authorizationClient],
  );
  const savedViews = useSavedViews({ iTwinId: props.iTwinId, iModelId: props.iModelId, client });

  if (loadingState === "rendering-imodel") {
    return <LoadingScreen>Opening View...</LoadingScreen>;
  }

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

  return (
    <PageLayout.Content>
      <Button onClick={() => savedViews.createSavedView("0 Saved View Name")}>Create saved view</Button>
      <Button onClick={() => savedViews.createGroup("0 Group")}>Create group</Button>
      <SavedViewsFolderWidget
        savedViews={savedViews.savedViews}
        groups={savedViews.groups}
        tags={savedViews.tags}
        actions={{
          renameSavedView: savedViews.renameSavedView,
          renameGroup: savedViews.renameGroup,
          deleteGroup: savedViews.deleteGroup,
        }}
        onRenderSelectedView={setSelectedViewId}
        options={(savedView) => [
          <SavedViewOptions.MoveToGroup
            key="move"
            groups={groups}
            moveToGroup={savedViews.moveToGroup}
            moveToNewGroup={savedViews.moveToNewGroup}
          />,
          <SavedViewOptions.ManageTags
            key="tags"
            tags={tags}
            addTag={savedViews.addTag}
            addNewTag={savedViews.addNewTag}
            removeTag={savedViews.removeTag}
          />,
          <MenuItem key="delete" onClick={() => savedViews.deleteSavedView(savedView.id)}>Delete</MenuItem>,
        ]}
      />
    </PageLayout.Content >
  );
}

async function renderSavedView(iModel: IModelConnection, savedViewId: string, iTwinId: string, iModelId: string) {
// function renderSavedView(iModel: IModelConnection, selectedViewState: string, iTwinId: string, iModelId: string) {

  const viewState = await iModel.views.load(savedViewId);

  const navigate = useNavigate();
  // return navigate(`/itwinjs/open-imodel/${iTwinId}/${iModelId}/view`, {state: {iModel: iModel, savedViewId: savedViewId}})
  return navigate(`/itwinjs/open-imodel/${iTwinId}/${iModelId}/view`, {state: {iModel: iModel, viewState: viewState}})
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
