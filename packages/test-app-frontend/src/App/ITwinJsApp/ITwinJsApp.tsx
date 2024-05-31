/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Id64 } from "@itwin/core-bentley";
import {
  BentleyCloudRpcManager, BentleyCloudRpcParams, IModelReadRpcInterface, IModelTileRpcInterface,
  type AuthorizationClient,
} from "@itwin/core-common";
import {
  CheckpointConnection, IModelApp, ViewCreator3d, type IModelConnection, type ViewState, type Viewport,
} from "@itwin/core-frontend";
import { ITwinLocalization } from "@itwin/core-i18n";
import { UiCore } from "@itwin/core-react";
import { ViewportComponent } from "@itwin/imodel-components-react";
import { FrontendIModelsAccess } from "@itwin/imodels-access-frontend";
import { IModelsClient } from "@itwin/imodels-client-management";
import { PageLayout } from "@itwin/itwinui-layouts-react";
import { useToaster } from "@itwin/itwinui-react";
import { useEffect, useState, type ReactElement } from "react";

import { applyUrlPrefix } from "../../environment.js";
import { useAuthorization } from "../Authorization.js";
import { LoadingScreen } from "../common/LoadingScreen.js";
import { Overlap } from "../common/Overlap.js";
import { SavedViewsWidget } from "./SavedViewsWidget.js";

import "./ITwinJsApp.css";

export interface ITwinJsAppProps {
  iTwinId: string;
  iModelId: string;
}

export function ITwinJsApp(props: ITwinJsAppProps): ReactElement | null {
  const { authorizationClient } = useAuthorization();

  type LoadingState = "opening-imodel" | "opening-viewstate" | "creating-viewstate" | "loaded" | "rendering-imodel"
    | "rendered";
  const [loadingState, setLoadingState] = useState<LoadingState>("opening-imodel");
  const [viewState, setViewState] = useState<ViewState>();
  const iModel = useIModel(props.iTwinId, props.iModelId, authorizationClient);

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
          setViewState(viewState);
        }
      })();
      return () => { disposed = true; };
    },
    [iModel],
  );

  const [viewport, setViewport] = useState<Viewport>();

  if (loadingState === "rendering-imodel") {
    return <LoadingScreen>Opening View...</LoadingScreen>;
  }

  if (!iModel) {
    return <LoadingScreen>Opening iModel...</LoadingScreen>;
  }

  if (loadingState === "opening-viewstate") {
    return <LoadingScreen>Opening ViewState...</LoadingScreen>;
  }

  if (loadingState === "creating-viewstate") {
    return <LoadingScreen>Creating ViewState...</LoadingScreen>;
  }

  return (
    <PageLayout.Content>
      <Overlap style={{ height: "100%" }}>
        <ViewportComponent
          imodel={iModel}
          viewState={viewState}
          viewportRef={setViewport}
        />
        {
          viewport &&
          <SavedViewsWidget
            iTwinId={props.iTwinId}
            iModelId={props.iModelId}
            iModel={iModel}
            viewport={viewport}
          />
        }
      </Overlap>
    </PageLayout.Content>
  );
}

export async function initializeITwinJsApp(): Promise<void> {
  if (IModelApp.initialized) {
    return;
  }

  const iModelsClient = new IModelsClient({ api: { baseUrl: applyUrlPrefix("https://api.bentley.com/imodels") } });
  await IModelApp.startup({
    localization: new ITwinLocalization({
      initOptions: { lng: "en" },
      urlTemplate: "/locales/{{lng}}/{{ns}}.json",
    }),
    hubAccess: new FrontendIModelsAccess(iModelsClient),
    publicPath: "/",
  });
  const rpcParams: BentleyCloudRpcParams = {
    info: { title: "test-app-backend", version: "v1.0" },
    uriPrefix: "http://localhost:3002",
  };

  BentleyCloudRpcManager.initializeClient(rpcParams, [IModelReadRpcInterface, IModelTileRpcInterface]);
  await Promise.all([UiCore.initialize(IModelApp.localization)]);
}

function useIModel(
  iTwinId: string,
  iModelId: string,
  authorizationClient: AuthorizationClient,
): IModelConnection | undefined {
  const [iModel, setIModel] = useState<IModelConnection>();
  const toaster = useToaster();

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
          displayIModelError(toaster, IModelApp.localization.getLocalizedString("App:error:imodel-open-remote"), error);
        }
      })();

      return () => {
        disposed = true;
        void (async () => {
          const openedIModel = await iModelPromise;
          try {
            await openedIModel.close();
          } catch (error) {
            displayIModelError(
              toaster,
              IModelApp.localization.getLocalizedString("App:error:imodel-close-remote"),
              error,
            );
          }
        })();
      };
    },
    [authorizationClient, iModelId, iTwinId, toaster],
  );

  return iModel;
}

function displayIModelError(toaster: ReturnType<typeof useToaster>, message: string, error: unknown): void {
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
