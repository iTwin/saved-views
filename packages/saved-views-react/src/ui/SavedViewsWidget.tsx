/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { getClassName, type UiSyncEventArgs } from "@itwin/appui-abstract";
import {
  SessionStateActionId, StatusBar, StatusBarDialog, StatusBarLabelIndicator, StatusBarLabelSide, SyncUiEventDispatcher,
  UiFramework, ViewUtilities,
} from "@itwin/appui-react";
import { Logger } from "@itwin/core-bentley";
import type { ViewDefinitionProps } from "@itwin/core-common";
import { type IModelConnection } from "@itwin/core-frontend";
import { LoadingSpinner, type CommonProps } from "@itwin/core-react";
import { SvgPin, SvgPinHollow } from "@itwin/itwinui-icons-react";
import { IconButton } from "@itwin/itwinui-react";
import * as React from "react";

import { GroupCache, GroupCacheEventType, type GroupCacheEventArgs } from "../api/caches/GroupCache";
import { IModelConnectionCache } from "../api/caches/IModelConnectionCache";
import { SavedViewCacheEventType, SavedViewsCache, type SavedViewCacheEventArgs } from "../api/caches/SavedViewsCache";
import { SavedViewsManager } from "../api/SavedViewsManager";
import { type Group, type SavedView, type SavedViewBase } from "../api/utilities/SavedViewTypes";
import { SavedViewUtil } from "../api/utilities/SavedViewUtil";
import {
  clearSelectedViews, createGroup, deleteGroup, deleteView, setDefaultViewId, setDesktopViews, setDisplayErrors,
  setDisplaySuccess, setEnableApplyDefaultView, setIModel, setShowDefaultView, setShowThumbnails, updateGroup,
  updateView,
} from "../store/SavedViewsStateReducer";
import Banner from "./Banner";
import { type GroupItemContextMenuItemProps } from "./grouplist/groupitem/GroupItemContextMenu";
import GroupList from "./grouplist/GroupList";
import { type MenuItem } from "./popupmenu/PopupMenuItem";
import "./SavedViewsWidget.scss";
import { type SavedViewContextMenuItemProps } from "./viewlist/viewitem/SavedViewItemContextMenu";

function isSpatial(classname: string): boolean {
  return ViewUtilities.isSpatial(ViewUtilities.getBisBaseClass(classname));
}

function isSheet(classname: string): boolean {
  return ViewUtilities.isSheet(ViewUtilities.getBisBaseClass(classname));
}

function isDrawing(classname: string): boolean {
  return ViewUtilities.isDrawing(ViewUtilities.getBisBaseClass(classname));
}

/** Saved Views Status Field Props */
export interface SavedViewsWidgetProps {
  /** IModelConnection to use to query views. If not provided, it will attempt to grab the connection from UiFramework.getIModelConnection  */
  iModelConnection?: IModelConnection;
  /** Show thumbnails on the view items */
  showThumbnails?: boolean;
  /** Display errors when doing saved views operations that fail (e.g. creation of a saved view post fails to server). Uses the notification manager */
  displayErrors?: boolean;
  /** Display messages when saved views operations are successful. Uses the notification manager */
  displaySuccess?: boolean;
  /** Format string for the url generated by the widget */
  urlFormat?: string;
  /** Feature flag to suppport Saved Views in 2D frontstage */
  want2dViews?: boolean;
  /** Feature flag for showing the new apply view settings */
  savedViewsApplyViewSettings?: boolean;
  /** Flag for showing the "Show Everything" option in settings. If not provided default will be true and it will show this option */
  showShowEverythingOption?: boolean;

  additionalGroupContextMenuItems?: GroupItemContextMenuItemProps[];
  additionalSavedViewContextMenuItems?: SavedViewContextMenuItemProps[];
  additionalBannerContextMenuItems?: MenuItem[];

  /** Feature flag for applying default saved view and showing icon */
  enableApplyDefaultView?: boolean;

  /** Feature flag for enabling set saved view as default view */
  showSetDefaultView?: boolean;

  /* Feature flag for enabling responsive, larger widget pop-up */
  useLargePopup?: boolean;
}

export type SavedViewsStatusBarProps = SavedViewsWidgetProps & CommonProps;

interface SavedViewsWidgetState {
  opened: boolean;
  target: HTMLElement | null;
  groupsInitialized: boolean;
  viewsInitialized: boolean;
  isPinned: boolean;
  imodel: IModelConnection | undefined;
}

/** View List Component with functionality to show thumbnails, handle saved view functionality */
export class SavedViewsWidget extends React.Component<
  SavedViewsStatusBarProps,
  SavedViewsWidgetState
> {
  private _groupListContainerRef = React.createRef<HTMLDivElement>();
  private _dialogContainer: HTMLDivElement | null = null;
  private _indicatorContainer: HTMLDivElement | null = null;

  private _ungroupGroup: Group = {
    id: SavedViewsManager.ungroupedId,
    name: SavedViewsManager.defaultUngroupedGroupName,
    userId: "",
    shared: false,
  };

  private _desktopViewsGroup: Group = {
    id: SavedViewsManager.desktopViewsGroupId,
    name: SavedViewsManager.defaultDesktopViewGroupName,
    userId: "",
    shared: true,
  };

  private _useLargePopup;

  /** Sets up initial state and creates a SavedViewsClient if necessary */
  constructor(props: SavedViewsStatusBarProps) {
    super(props);
    const iModelConnect = props.iModelConnection
      ? props.iModelConnection
      : UiFramework.getIModelConnection();

    if (undefined === iModelConnect) {
      // eslint-disable-next-line no-console
      console.error("The iModelConnection must be defined, its value is: ", iModelConnect);
    }

    this._useLargePopup =
      this.props.useLargePopup === undefined ? false : this.props.useLargePopup;

    this.state = {
      opened: false,
      target: null,
      groupsInitialized: false,
      viewsInitialized: false,
      isPinned: false,
      imodel: iModelConnect,
    };

    if (props.urlFormat) {
      SavedViewUtil.setUrlTemplate(props.urlFormat);
    }
  }

  public override async componentDidMount() {
    const displayErrors =
      this.props.displayErrors === undefined ? true : this.props.displayErrors;
    const displaySuccess =
      this.props.displaySuccess === undefined
        ? true
        : this.props.displaySuccess;
    const showThumbnail =
      this.props.showThumbnails === undefined
        ? true
        : this.props.showThumbnails;
    const showDefaultView =
      this.props.showSetDefaultView === undefined
        ? false
        : this.props.showSetDefaultView;
    const enableApplyDefaultView =
      this.props.enableApplyDefaultView === undefined
        ? false
        : this.props.enableApplyDefaultView;

    SavedViewsManager.dispatchActiontoStore(setShowThumbnails(showThumbnail));
    SavedViewsManager.dispatchActiontoStore(setDisplayErrors(displayErrors));
    SavedViewsManager.dispatchActiontoStore(setDisplaySuccess(displaySuccess));
    SavedViewsManager.dispatchActiontoStore(setShowDefaultView(showDefaultView));
    SavedViewsManager.dispatchActiontoStore(setEnableApplyDefaultView(enableApplyDefaultView));

    if (this.state.imodel) {
      SavedViewsManager.dispatchActiontoStore(setIModel(this.state.imodel));

      GroupCache.ON_CACHE_EVENT.addListener(this.onGroupCacheChanged, this);
      await this.loadGroups();

      SavedViewsCache.ON_CACHE_EVENT.addListener(this.onSavedViewCacheChanged, this);
      await this.loadViews();
      this.resolveInvalidGroupIds();
    }

    SyncUiEventDispatcher.onSyncUiEvent.addListener(this.handleIModelConnectionChanged);
    if (!this.state.imodel) {
      throw new Error("iModelConnection is undefined");
    }

    const { iTwinId, iModelId } = this.state.imodel;

    if (
      (enableApplyDefaultView === true || showDefaultView === true) &&
      iTwinId !== undefined &&
      iModelId !== undefined
    ) {
      const viewId = (await SavedViewsManager.defaultSavedViewIdClient.getDefaultSavedViewId(iTwinId, iModelId)) ?? "";
      SavedViewsManager.dispatchActiontoStore(setDefaultViewId(viewId));
    }
  }

  private handleIModelConnectionChanged = (args: UiSyncEventArgs) => {
    if (args.eventIds.has(SessionStateActionId.SetIModelConnection)) {
      this.setState({
        imodel: UiFramework.getIModelConnection(),
      });
    }
  };

  private async onSavedViewCacheChanged(args: SavedViewCacheEventArgs) {
    switch (args.eventType) {
      case SavedViewCacheEventType.CacheSync:
        await this.loadViews(true);
        break;
      case SavedViewCacheEventType.SavedViewAdded:
      case SavedViewCacheEventType.SavedViewShared:
        SavedViewsManager.dispatchActiontoStore(
          updateView({
            groupId: args.savedView?.groupId ?? SavedViewsManager.ungroupedId,
            id: args.savedView?.id,
            newView: args.savedView as SavedView,
          }),
        );
        break;
      case SavedViewCacheEventType.SavedViewUpdated:
        SavedViewsManager.dispatchActiontoStore(
          deleteView({
            groupId: args.savedView?.groupId ?? SavedViewsManager.ungroupedId,
            id: args.savedView?.id,
          }),
        );
        SavedViewsManager.dispatchActiontoStore(
          updateView({
            groupId: args.updatedView?.groupId ?? SavedViewsManager.ungroupedId,
            id: args.updatedView?.id,
            newView: args.updatedView as SavedView,
          }),
        );

        break;
      case SavedViewCacheEventType.SavedViewRemoved:
        SavedViewsManager.dispatchActiontoStore(
          deleteView({
            groupId: args.savedView?.groupId ?? SavedViewsManager.ungroupedId,
            id: args.savedView?.id,
          }),
        );
        break;
    }

    this.resolveInvalidGroupIds();
  }

  private async onGroupCacheChanged(args: GroupCacheEventArgs) {
    switch (args.eventType) {
      case GroupCacheEventType.CacheSync:
        await this.loadGroups(true);
        break;
      case GroupCacheEventType.GroupAdded:
        SavedViewsManager.dispatchActiontoStore(createGroup({ newGroup: args.group }));
        await this.loadGroups(true);
        break;
      case GroupCacheEventType.GroupShared:
      case GroupCacheEventType.GroupUpdated:
        SavedViewsManager.dispatchActiontoStore(updateGroup({ id: args.group?.id, newGroup: args.group }));
        break;
      case GroupCacheEventType.GroupRemoved:
        SavedViewsManager.dispatchActiontoStore(deleteGroup({ id: args.group?.id }));
        break;
    }
  }

  public override async componentDidUpdate(_prevProps: SavedViewsWidgetProps) {
    if (
      this.state.imodel &&
      this.props.iModelConnection &&
      (this.props.iModelConnection.iModelId !== this.state.imodel.iModelId ||
        this.props.iModelConnection.changeset.id !==
        this.state.imodel.changeset.id)
    ) {
      SavedViewsManager.dispatchActiontoStore(setIModel(this.props.iModelConnection));
      await this.loadViews(true);
      await this.loadGroups(true);

      this.setState({
        imodel: this.props.iModelConnection,
      });
    }
  }

  public override componentWillUnmount() {
    GroupCache.ON_CACHE_EVENT.removeListener(this.onGroupCacheChanged, this);
    SavedViewsCache.ON_CACHE_EVENT.removeListener(this.onSavedViewCacheChanged, this);
    SyncUiEventDispatcher.onSyncUiEvent.removeListener(this.handleIModelConnectionChanged);
  }

  private async loadGroups(refresh?: boolean) {
    if (!this.state.imodel) {
      throw new Error("iModelConnection is undefined");
    }

    const groups = await IModelConnectionCache
      .getGroupCache(this.state.imodel)
      .getGroups(this.state.imodel, refresh);

    // Blank iModelConnection will never have desktop view group
    if ((this.state.imodel && !this.state.imodel.isBlank)) {
      groups.push(this._desktopViewsGroup);
    }

    groups.sort((a: Group, b: Group) => {
      if (
        b.id === SavedViewsManager.ungroupedId ||
        a.id === SavedViewsManager.desktopViewsGroupId
      ) {
        return 1;
      } else if (
        b.id === SavedViewsManager.desktopViewsGroupId ||
        a.id === SavedViewsManager.ungroupedId
      ) {
        return -1;
      } else {
        return a.name.localeCompare(b.name);
      }
    });

    groups.unshift(this._ungroupGroup);

    if (!SavedViewsManager.state) {
      throw new Error();
    }

    const currentGroups = SavedViewsManager.state.groups;

    for (const groupId in currentGroups) {
      if (Object.prototype.hasOwnProperty.call(currentGroups, groupId)) {
        const group = currentGroups[groupId];
        if (!groups.find((g) => g.id === group.id)) {
          SavedViewsManager.dispatchActiontoStore(deleteGroup(group));
        }
      }
    }

    groups.forEach((g) => SavedViewsManager.dispatchActiontoStore(updateGroup({ id: g.id, newGroup: g })));

    if (!this.state.groupsInitialized) {
      this.setState({
        groupsInitialized: true,
      });
    }
  }

  private _handleClose = () => {
    this.setState({ opened: false });
  };

  private _handleIndicatorClick = () => {
    const opened = !this.state.opened;

    SavedViewsManager.dispatchActiontoStore(clearSelectedViews());

    this.setState({ opened });
  };

  /**
   * Checks if a click event's coordinates are inside a DOM element
   * @param clickEvent The click event
   * @param rect The DOM rect of the element to check
   * @returns true if the click is within the bounds of the DOM rect
   */
  private _isClickInside = (clickEvent: MouseEvent, rect: DOMRect) => {
    const { x, y, width, height } = rect;

    return (
      clickEvent.clientX > x &&
      clickEvent.clientX < x + width &&
      clickEvent.clientY > y &&
      clickEvent.clientY < y + height
    );
  };

  /** Handle closing the dialog */
  private _handleOutsideClick = (e: MouseEvent) => {
    // Ignore clicks inside the widget - this prevents the widget from closing when clicking in the tag search bar
    if (
      this._dialogContainer !== null &&
      this._isClickInside(e, this._dialogContainer.getBoundingClientRect())
    ) {
      return;
    }

    // Ignore clicks on the indicator icon - these will get handled by _handleIndicatorClick
    if (
      this._indicatorContainer !== null &&
      this._isClickInside(e, this._indicatorContainer.getBoundingClientRect())
    ) {
      return;
    }

    if (UiFramework.dialogs.modal.count === 0) {
      SavedViewsManager.dispatchActiontoStore(clearSelectedViews());

      this.setState({ opened: false });
    }
  };

  /**
   * Loads the view UI items
   * @param refresh Force refresh (e.g. query all views in the file and in BIM Review Share)
   */
  public async loadViews(refresh?: boolean) {
    const iModel = this.state.imodel;
    if (!iModel) {
      throw new Error("IModel undefined! Cannot load views!");
    }
    const { want2dViews } = this.props;

    const desktopViews =
      (await IModelConnectionCache.getDesktopViewsCache(iModel)?.load()) ?? [];
    const includedDesktopViews = desktopViews.filter(
      (viewProp: ViewDefinitionProps) => {
        if (want2dViews) {
          if (
            isSheet(viewProp.classFullName) ||
            isDrawing(viewProp.classFullName)
          ) {
            return true;
          }
        } else {
          if (isSpatial(viewProp.classFullName)) {
            return true;
          }
        }
        return false;
      },
    );

    SavedViewsManager.dispatchActiontoStore(setDesktopViews(includedDesktopViews));

    const client = IModelConnectionCache.getSavedViewCache(iModel);
    if (!client) {
      throw new Error("Saved Views Client undefined! Cannot load views!");
    }

    const views = await client.getSavedViews(iModel, refresh);
    const namedViews = views.filter((view: SavedViewBase) => {
      return view.name !== undefined;
    });
    const savedViews = namedViews.filter((view: SavedViewBase) => {
      if (want2dViews) {
        return !!view.is2d;
      } else {
        return !view.is2d;
      }
    });
    savedViews.sort((a: SavedViewBase, b: SavedViewBase) => {
      return a.name.localeCompare(b.name);
    });

    Logger.logInfo(SavedViewsManager.loggerCategory(getClassName(this)), "ViewsList Initialized");

    const currentSavedViews = SavedViewsManager.state?.savedViews;
    const viewsByObject = currentSavedViews
      ? Object.values(currentSavedViews)
      : [];

    for (const o of viewsByObject) {
      for (const savedView of Object.values(o)) {
        const newVersionOfView = savedViews.find((view) => view.id === savedView.id);
        if (
          !newVersionOfView ||
          newVersionOfView.groupId !== savedView.groupId
        ) {
          const groupId = savedView.groupId ?? SavedViewsManager.ungroupedId;
          SavedViewsManager.dispatchActiontoStore(deleteView({ groupId, id: savedView.id }));
        }
      }
    }

    savedViews.forEach((savedView) => {
      const groupId = savedView.groupId ?? SavedViewsManager.ungroupedId;
      SavedViewsManager.dispatchActiontoStore(
        updateView({
          groupId,
          id: savedView.id,
          newView: savedView as SavedView,
        }),
      );
    });

    if (!this.state.viewsInitialized) {
      this.setState({
        viewsInitialized: true,
      });
    }
  }

  private renderLoading() {
    return (
      <div
        className={
          `itwin-saved-views-view-loading ${this._useLargePopup ? "itwin-saved-views-responsive" : ""} ${!this._useLargePopup ? "itwin-saved-views-static" : ""}`
        }
      >
        <LoadingSpinner />
      </div>
    );
  }

  private resolveInvalidGroupIds() {
    if (!SavedViewsManager.state) {
      throw new Error();
    }

    const views = SavedViewsManager.state.savedViews;

    const viewsByObject = Object.values(views);

    // Handling some corner cases here

    // If a shared view was moved to an unshared group by a nonowner and then
    // the view was unshared by the owner that view should return to the owner's "Ungrouped" group

    // If a view exists in a group that no longer exists that view should be put in the "Ungrouped group"

    for (const o of viewsByObject) {
      for (const s of Object.values(o)) {
        if (s.groupId === SavedViewsManager.ungroupedId) {
          continue;
        }

        if (s.groupId && SavedViewsManager.state.groups[s.groupId] === undefined) {
          SavedViewsManager.dispatchActiontoStore(
            updateView({
              groupId: SavedViewsManager.ungroupedId,
              id: s.id,
              newView: {
                ...s,
                groupId: SavedViewsManager.ungroupedId,
              },
            }),
          );
        } else if (
          s.groupId &&
          SavedViewsManager.state.groups[s.groupId] &&
          SavedViewsManager.state.groups[s.groupId].userId !== s.userId &&
          SavedViewsManager.state.groups[s.groupId].shared === false &&
          s.shared === false
        ) {
          SavedViewsManager.dispatchActiontoStore(
            updateView({
              groupId: SavedViewsManager.ungroupedId,
              id: s.id,
              newView: {
                ...s,
                groupId: SavedViewsManager.ungroupedId,
              },
            }),
          );

          SavedViewsManager.dispatchActiontoStore(deleteView({ groupId: s.groupId, id: s.id }));
        }
      }
    }
  }

  private renderGroupList() {
    return (
      <div
        ref={this._groupListContainerRef}
        className={
          `itwin-saved-views-group-content ${this._useLargePopup ? "itwin-saved-views-responsive" : ""} ${!this._useLargePopup ? "itwin-saved-views-static" : ""}`
        }
      >
        <Banner
          contextMenuViewportRef={this._groupListContainerRef}
          savedViewsApplyViewSettings={this.props.savedViewsApplyViewSettings}
          showShowEverythingOption={this.props.showShowEverythingOption}
          want2dViews={this.props.want2dViews}
          additionalContextMenuItems={
            this.props.additionalBannerContextMenuItems
          }
          enableShowModelsCategoriesNotHiddenOption={
            SavedViewsManager.flags.supportHiddenModelsAndCategories &&
            SavedViewsManager.flags.enableHiddenModelsAndCategoriesApplyOption
          }
        />
        <GroupList
          groupListContainerRef={this._groupListContainerRef}
          want2dViews={this.props.want2dViews}
          additionalGroupContextMenuItems={
            this.props.additionalGroupContextMenuItems
          }
          additionalSavedViewContextMenuItems={
            this.props.additionalSavedViewContextMenuItems
          }
        />
      </div>
    );
  }

  /** Renders the contents of the popup that opens from the footer */
  public renderDialogContent(): React.ReactNode {
    return (
      <div>
        {(!this.state.groupsInitialized || !this.state.viewsInitialized) &&
          this.renderLoading()}
        {this.state.groupsInitialized &&
          this.state.viewsInitialized &&
          this.renderGroupList()}
      </div>
    );
  }

  private _handleTargetRef = (target: HTMLElement | null) => {
    this.setState({ target });
  };

  private _pinDialog = () => {
    const isPinned = !this.state.isPinned;
    this.setState({
      isPinned,
    });
  };

  /** Render the indicator that shows in the footer and opens up the dialog/content */
  public override render() {
    return (
      <div
        className="itwin-saved-views-view-list-div"
        ref={this._handleTargetRef}
        title={SavedViewsManager.translate("listTools.savedViews")}
      >
        <style></style>
        <div
          ref={(r) => {
            this._indicatorContainer = r;
          }}
        >
          <StatusBarLabelIndicator
            iconSpec="icon-saved-view"
            className="itwin-saved-views-view-list-contained"
            onClick={this._handleIndicatorClick}
            labelSide={StatusBarLabelSide.Right}
            label={SavedViewsManager.translate("listTools.views")}
          ></StatusBarLabelIndicator>
        </div>
        <StatusBar.Popup
          className={this.props.className}
          isPinned={this.state.isPinned}
          target={this.state.target}
          onClose={this._handleClose}
          closeOnWheel={false}
          closeOnEnter={false}
          onOutsideClick={this._handleOutsideClick}
          isOpen={this.state.opened}
        >
          <div
            ref={(r) => {
              this._dialogContainer = r;
            }}
          >
            <StatusBarDialog
              titleBar={
                <StatusBarDialog.TitleBar
                  title={SavedViewsManager.translate("listTools.savedViews")}
                >
                  <IconButton
                    size="small"
                    styleType="borderless"
                    onClick={this._pinDialog}
                    title={
                      this.state.isPinned
                        ? SavedViewsManager.translate("listTools.unpinWidget")
                        : SavedViewsManager.translate("listTools.pinWidget")
                    }
                  >
                    {this.state.isPinned ? <SvgPin /> : <SvgPinHollow />}
                  </IconButton>
                </StatusBarDialog.TitleBar>
              }
            >
              {this.renderDialogContent()}
              <div className="itwin-saved-views-gradient-overlay"></div>
            </StatusBarDialog>
          </div>
        </StatusBar.Popup>
      </div>
    );
  }
}
