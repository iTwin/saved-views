/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import {
  BentleyCloudRpcManager, BentleyCloudRpcParams, Cartographic, IModelReadRpcInterface, IModelTileRpcInterface,
  type AuthorizationClient,
} from "@itwin/core-common";
import {
  BlankConnection, CheckpointConnection, IModelApp, type IModelConnection, type Viewport, type ViewState,
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
import { ViewCreator } from "./ViewCreator.js";

import "./ITwinJsApp.css";

export interface ITwinJsAppProps {
  iTwinId: string;
  iModelId: string;
}

export function ITwinJsApp(props: ITwinJsAppProps): ReactElement | null {
  const { authorizationClient } = useAuthorization();
  const iModel = useIModel(props.iTwinId, props.iModelId, authorizationClient);
  const viewState = useDefaultView(iModel);
  const [viewport, setViewport] = useState<Viewport>();

  if (!iModel) {
    return <LoadingScreen>Opening iModel...</LoadingScreen>;
  }

  if (!viewState) {
    return <LoadingScreen>Opening View...</LoadingScreen>;
  }

  return (
    <PageLayout.Content>
      <Overlap style={{ height: "100%" }}>
        <ViewportComponent imodel={iModel} viewState={viewState} viewportRef={setViewport} />
        {
          viewport &&
          <SavedViewsWidget iTwinId={props.iTwinId} iModelId={props.iModelId} iModel={iModel} viewport={viewport} />
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
      const iModelPromise = iModelId === ""
        ? (
          Promise.resolve(
            BlankConnection.create({
              name: "saved-viws-test-app-blank-connection",
              location: Cartographic.createZero(),
              extents: { low: { x: 0.0, y: 0.0, z: 0.0 }, high: { x: 1.0, y: 1.0, z: 1.0 } },
            }),
          )
        )
        : CheckpointConnection.openRemote(iTwinId, iModelId);
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

function useDefaultView(iModel: IModelConnection | undefined) {
  const [viewState, setViewState] = useState<ViewState>();

  useEffect(
    () => {
      if (!iModel) {
        return;
      }

      let disposed = false;
      const unregister = IModelApp.viewManager.onViewOpen.addOnce(ViewCreator.onViewOpen);

      void (async () => {
        const viewState = await ViewCreator.create(iModel);
        if (!disposed) {
          setViewState(viewState);
        }
      })();

      return () => {
        unregister();
        disposed = true;
      };
    },
    [iModel],
  );

  return viewState;
}
