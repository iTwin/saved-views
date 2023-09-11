/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { AppNotificationManager, ConfigurableUiContent, UiFramework } from "@itwin/appui-react";
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
import { toaster } from "@itwin/itwinui-react";
import { ReactElement, useEffect, useState } from "react";
import { AbstractTagClient, Group, GroupUpdate, IGroupClient, ISavedViewsClient, ITagClient, ReadOnlyTag, SavedViewBase, SavedViewBaseSetting, SavedViewBaseUpdate, SavedViewsManager, SavedViewsWidget, Tag } from "@itwin/saved-views-react";

import { applyUrlPrefix } from "../../environment";
import { LoadingScreen } from "../common/LoadingScreen";
import { UIFramework } from "./AppUI/UiFramework";

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

  if (loadingState === "opening-imodel") {
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
      <UIFramework>
        <SavedViewsWidget iModelConnection={iModel} />
        <ConfigurableUiContent />
      </UIFramework>
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

  await SavedViewsManager.initialize(
    IModelApp.localization as ITwinLocalization,
    {
      userId: "userId",
      groupClient: new MockGroupClient(),
      savedViewsClient: new MockSavedViewsClient(),
      tagClient: new MockTagClient(),
    },
  );
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

class MockGroupClient implements IGroupClient {
  public async createGroup(_iModelConnection: IModelConnection, group: Group): Promise<Group> {
    return group;
  }

  public async updateGroup(_: IModelConnection, updatedGroup: GroupUpdate, oldGroup: Group): Promise<Group> {
    return { ...oldGroup, name: updatedGroup.name ?? oldGroup.name };
  }

  public async deleteGroup(): Promise<void> { }

  public async shareGroup(_iModelConnection: IModelConnection, group: Group): Promise<Group> {
    return group;
  }

  public async getGroups(): Promise<Group[]> {
    return [];
  }

  public async getGroup(id: string): Promise<Group> {
    return { id, name: "group", shared: false, userId: "userId" };
  }
}

const categorySelectorProps = { classFullName: "", model: "", code: { spec: "", scope: "" }, categories: [] };

class MockSavedViewsClient implements ISavedViewsClient {
  public async getViewSetting(id: string): Promise<SavedViewBaseSetting> {
    return { id, name: "savedView", shared: false, thumbnailId: "thumbnailId", categorySelectorProps };
  }

  public async getView(id: string): Promise<SavedViewBase> {
    return { id, name: "savedView", shared: false, categorySelectorProps };
  }

  public async createSavedView(_iModelConnection: IModelConnection, savedView: SavedViewBase): Promise<SavedViewBase> {
    return savedView;
  }

  public async createSavedViewByIds(
    _projectId: string,
    _iModelId: string | undefined,
    savedView: SavedViewBase,
  ): Promise<SavedViewBase> {
    return savedView;
  }

  public async updateSavedView(
    _iModelConnection: IModelConnection,
    updatedView: SavedViewBaseUpdate,
    oldView: SavedViewBase,
  ): Promise<SavedViewBase> {
    return { ...oldView, ...updatedView };
  }

  public async deleteSavedView(): Promise<void> { }

  public async deleteSavedViewByIds(): Promise<void> { }

  public async shareView(_iModelConnection: IModelConnection, view: SavedViewBase): Promise<SavedViewBase> {
    return view;
  }

  public async getSavedViews(): Promise<SavedViewBase[]> {
    return [];
  }

  public async getSavedViewsFromIds(): Promise<SavedViewBase[]> {
    return [];
  }
}

class MockTagClient extends AbstractTagClient implements ITagClient {
  public override async getTagsOnModel(): Promise<Tag[]> {
    return [];
  }

  public override async updateTagsOnModel(
    _iModelConnection: IModelConnection,
    _currentTags: Tag[],
    newTags: Tag[],
  ): Promise<Tag[]> {
    return newTags;
  }

  public async deleteTag(): Promise<void> { }

  public async createTag(_iModelConnection: IModelConnection, tag: Tag): Promise<ReadOnlyTag> {
    return { ...tag, id: "tagId", links: { creator: { href: "" } } };
  }

  public async updateTag(_tagId: string, updatedTag: Tag): Promise<Tag> {
    return updatedTag;
  }

  public async getTags(): Promise<Tag[]> {
    return [];
  }

  public async getTag(tagId: string): Promise<Tag> {
    return { name: tagId, createdByUserId: "userId" };
  }
}
