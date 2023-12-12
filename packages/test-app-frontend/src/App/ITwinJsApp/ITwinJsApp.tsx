/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { AppNotificationManager, UiFramework } from "@itwin/appui-react";
import { Id64 } from "@itwin/core-bentley";
import {
  AuthorizationClient, BentleyCloudRpcManager, BentleyCloudRpcParams, IModelReadRpcInterface, IModelTileRpcInterface,
} from "@itwin/core-common";
import { CheckpointConnection, IModelApp, IModelConnection, ScreenViewport, ViewCreator3d, ViewState } from "@itwin/core-frontend";
import { ITwinLocalization } from "@itwin/core-i18n";
import { UiCore } from "@itwin/core-react";
import { FrontendIModelsAccess } from "@itwin/imodels-access-frontend";
import { IModelsClient } from "@itwin/imodels-client-management";
import { PageLayout } from "@itwin/itwinui-layouts-react";
import { Button, MenuItem, toaster } from "@itwin/itwinui-react";
import {
  ITwinSavedViewsClient, SavedViewOptions, SavedViewsFolderWidget, applyExtensionsToViewport, useSavedViews,
  translateLegacySavedViewToITwinJsViewState, translateSavedViewResponseToLegacySavedViewResponse,
} from "@itwin/saved-views-react";
import { ReactElement, useEffect, useMemo, useState } from "react";

import { applyUrlPrefix } from "../../environment";
import { LoadingScreen } from "../common/LoadingScreen";
import { ViewportComponent } from "@itwin/imodel-components-react";
import { SavedViewWithDataRepresentation } from "@itwin/saved-views-client";

import "./ITwinJsApp.css";

export interface ITwinJsAppProps {
  iTwinId: string;
  iModelId: string;
  authorizationClient: AuthorizationClient;
}

export function ITwinJsApp(props: ITwinJsAppProps): ReactElement | null {
  type LoadingState = "opening-imodel" | "opening-viewstate" | "creating-viewstate" | "loaded" | "rendering-imodel" | "rendered";
  const [loadingState, setLoadingState] = useState<LoadingState>("opening-imodel");
  const [selectedViewState, setSelectedViewState] = useState<ViewState>();
  const [selectedSavedView, setSelectedSavedView] = useState<SavedViewWithDataRepresentation>();
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
  const savedViews = useSavedViews({ iTwinId: props.iTwinId, iModelId: props.iModelId, client });

  /*
    * This function converts a saved view from the Saved View API into a legacy view,
    * then converts the legacy view into an iTwin.js-style ViewState.
    *
    * Once legacy views are officially retired, a straight translation from Saved View to ViewState can be done instead
    * (but code has not been created for that yet).
    */
  const handleTileClick = async (savedViewId: string) => {
    if (!iModel) {
      return;
    }
    setLoadingState("rendering-imodel");

    const savedViewResponse = await client.getSingularSavedView({savedViewId});

    const legacySavedViewResponse = await translateSavedViewResponseToLegacySavedViewResponse(savedViewResponse, iModel);
    setSelectedSavedView(legacySavedViewResponse);

    const viewState = await translateLegacySavedViewToITwinJsViewState(legacySavedViewResponse, iModel);
    setLoadingState("rendered");
    setSelectedViewState(viewState);
  };

  /*
   * Apply extension data onto the viewport.
   * Extension data from a saved view cannot be applied until after the viewport is created
   * since it is applied to the viewport and not the viewstate.
   */
  const handleViewportCreated = async (viewport: ScreenViewport) => {
    await applyExtensionsToViewport(viewport, selectedSavedView);
    iModel?.selectionSet.emptyAll(); // Clear selected element
  };

  const handleBackClick = () => {
    setSelectedSavedView(undefined);
    setSelectedViewState(undefined);
    setLoadingState("loaded");
  };

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

  if (selectedViewState && iModel) {
    return (
      <PageLayout.Content>
        <Button onClick={handleBackClick} className="viewport-back-button">Back</Button>
        <ViewportComponent
          imodel={iModel}
          viewState={selectedViewState}
          viewportRef={(viewport) => handleViewportCreated(viewport)}
        />
      </PageLayout.Content>
    )
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
        onTileClick={handleTileClick}
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
