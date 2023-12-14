/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { UiFramework } from "@itwin/appui-react";
import { IModelApp } from "@itwin/core-frontend";
import { SvgCrown } from "@itwin/itwinui-icons-react";
import { connect, type ConnectedProps } from "react-redux";

import { IModelConnectionCache } from "../../../api/caches/IModelConnectionCache";
import { SavedViewsManager } from "../../../api/SavedViewsManager";
import type { SavedView, SavedViewBase, SavedViewBaseUpdate } from "../../../api/utilities/SavedViewTypes";
import { SavedViewUtil } from "../../../api/utilities/SavedViewUtil";
import { setDefaultViewId, setViewSelected, type SavedViewsState } from "../../../store/SavedViewsStateReducer";
import MoveViewsDialog from "../../grouplist/groupitem/MoveViewsDialog";
import { ContextMenu, ContextMenuProps } from "../../popupmenu/ContextMenu";
import type { MenuItem } from "../../popupmenu/PopupMenuItem";
import TagManagementDialog from "../../Tags/TagManagementDialog";

import "./ViewItem.scss";

export interface SavedViewContextMenuItemProps extends MenuItem {
  onClick: (savedView: SavedViewBase) => void;
}

/** SavedViewitemContextMenu props */
export interface SavedViewItemContextMenuProps extends ContextMenuProps {
  savedView: SavedViewBase;
  handleRename: () => void;
  additionalContextMenuItems?: SavedViewContextMenuItemProps[];
  showSetDefaultView?: boolean;
  defaultViewToggleValue: boolean;
}

const mapState = (rootState: unknown, props: SavedViewItemContextMenuProps) => {
  const state = (rootState as Record<string, unknown>)[SavedViewsManager.savedViewsStateKey] as SavedViewsState;

  const connection = state.iModel;
  const groupIsShared = state.groups[props.savedView.groupId || "-1"].shared;
  const groups = state.groups;
  const showSetDefaultView = state.showDefaultView;

  return {
    groups,
    groupIsShared,
    connection,
    showSetDefaultView,
  };
};

const connector = connect(mapState, {
  setViewSelected,
  setDefaultViewId,
});

type PropsFromRedux = ConnectedProps<typeof connector>;
type Props = PropsFromRedux & SavedViewItemContextMenuProps;

/** SavedViewItemContextMenu */
class SavedViewItemContextMenu extends ContextMenu<Props> {
  constructor(props: Props) {
    super(props);
  }

  private isCurrentUserCreator(savedView: SavedViewBase): boolean {
    return SavedViewsManager.userId === savedView.userId;
  }

  /**
   * Returns true if the view is created by the user (want context menu items for share/sync/delete)
   * Or if the view is shared (want context menu item for sharing the view)
   * @param savedView Saved view to ask for need of context menu
   */
  protected wantContextMenu(): boolean {
    return (
      this.isCurrentUserCreator(this.props.savedView) ||
      (SavedViewsManager.flags.savedViewsPublicShare &&
        this.props.savedView.shared)
    );
  }

  /**
   *
   * @param savedView Saved View to get context menu options for
   */
  protected onGetContextMenuOptions(): MenuItem[] {
    const contextMenuItems: MenuItem[] = [];

    // Views can be edited if any of the following is true:
    // 1. they are not shared
    // 2. the user is the creator and it has not been set as the default saved view OR default saved views are not saved as shared settings.
    // 3. the flag for allowing any user with access to edit shared views is on
    const canEdit =
      !this.props.savedView.shared ||
      (this.props.savedView.userId === SavedViewsManager.userId &&
        (!this.props.defaultViewToggleValue ||
          !SavedViewsManager.defaultSavedViewIdClient.isSharedSetting)) ||
      SavedViewsManager.flags.allowSharedEdit;

    const addMoveEntryIfAllowed = () => {
      if (canEdit) {
        contextMenuItems.push({
          iconSpec: "icon-saved-views-move",
          name: SavedViewsManager.translate("groups.move"),
          onClick: this._handleMove,
        });
      }
    };

    if (!canEdit && SavedViewsManager.flags.savedViewsPublicShare) {
      // Add Copy Link context menu entry for public views that aren't user created
      if (SavedViewsManager.flags.copyLinkEnabled) {
        contextMenuItems.push({
          iconSpec: "icon-link",
          name: SavedViewsManager.translate("listTools.copyLink"),
          onClick: this._handleCopyLink,
        });
      }

      addMoveEntryIfAllowed();
    } else {
      // We cannot unshare another user's view due to access to their user settings in legacy storage
      if (this.props.savedView.userId === SavedViewsManager.userId) {
        contextMenuItems.push({
          iconSpec: "icon-share",
          name: SavedViewsManager.translate("groups.shared"),
          onToggle: (state: boolean) => this._handleShare(state),
          showToggle: true,
          toggleOn: this.props.savedView.shared,
        });
      }

      if (this.props.showSetDefaultView) {
        contextMenuItems.push({
          iconComponent: <SvgCrown />,
          name: SavedViewsManager.translate("groups.setDefaultView"),
          onToggle: (state: boolean) => this._handleSetDefaultView(state),
          showToggle: true,
          disabled: !this.props.savedView.shared,
          toggleOn: this.props.defaultViewToggleValue,
        });
      }

      if (
        SavedViewsManager.flags.copyLinkEnabled &&
        SavedViewsManager.flags.savedViewsPublicShare
      ) {
        contextMenuItems.push({
          iconSpec: "icon-link",
          name: SavedViewsManager.translate("listTools.copyLink"),
          disabled: SavedViewsManager.defaultSavedViewIdClient.isSharedSetting
            ? !this.props.savedView.shared
            : false,
          onClick: this._handleCopyLink,
        });
      }

      contextMenuItems.push({
        iconSpec: "icon-delete",
        name: SavedViewsManager.translate("groups.delete"),
        onClick: this._handleDelete,
      });
      contextMenuItems.push({
        iconSpec: "icon-rename",
        name: SavedViewsManager.translate("groups.rename"),
        onClick: this.props.handleRename,
      });
      contextMenuItems.push({
        iconSpec: "icon-camera",
        name: SavedViewsManager.translate("groups.retake"),
        onClick: this._handleRetake,
      });

      addMoveEntryIfAllowed();
    }

    const optionName = canEdit
      ? SavedViewsManager.translate("groups.manageTags")
      : SavedViewsManager.translate("groups.viewTags");
    contextMenuItems.push({
      iconSpec: "icon-tag-2",
      name: optionName,
      onClick: this._handleManageTags,
    });

    if (this.props.additionalContextMenuItems) {
      for (const contextMenuItem of this.props.additionalContextMenuItems) {
        contextMenuItems.push({
          ...contextMenuItem,
          onClick: () => contextMenuItem.onClick(this.props.savedView),
        });
      }
    }

    return contextMenuItems;
  }

  private _handleSetDefaultView = async (state: boolean) => {
    try {
      const viewId = state === true ? this.props.savedView.id : undefined;
      if (!this.props.connection) {
        throw new Error("Could not set default saved view: Invalid iModelConnection");
      }
      const { iTwinId, iModelId } = this.props.connection;
      if (!iModelId || !iTwinId) {
        throw new Error("Could not set default saved view: iModelId/iTwinId not defined");
      }
      await SavedViewsManager.defaultSavedViewIdClient.updateDefaultSavedViewId(iTwinId, iModelId, viewId);
      this.props.setDefaultViewId(viewId ?? "");
    } catch (error) {
      SavedViewUtil.showError(
        "ViewItemContextMenu",
        "listTools.error_updateDefaultView_brief",
        "listTools.error_updateDefaultView",
      );
    }
  };

  private _handleMove = () => {
    this.props.setViewSelected({
      view: this.props.savedView as SavedView,
      selected: true,
    });
    UiFramework.dialogs.modal.open(<MoveViewsDialog />);

    this.setState({
      opened: false,
    });
  };

  private _handleRetake = async () => {
    const vp = IModelApp.viewManager.selectedView;
    const iModelConnection = this.props.connection;
    const showError = () => {
      SavedViewUtil.showError("ViewItemContextMenu", "listTools.error_updateView_brief", "listTools.error_updateView");
    };

    if (!iModelConnection) {
      throw new Error("Invalid iModelConnection in _handleRetake");
    }

    if (vp) {
      const updatedData: SavedViewBaseUpdate =
        await SavedViewUtil.createSavedViewObject(
          vp,
          this.props.savedView.name,
          this.props.savedView.userId,
          this.props.savedView.shared,
        );

      if (SavedViewsManager.flags.usePublicReadWriteClient) {
        updatedData.groupId = undefined;
        updatedData.name = undefined;
        updatedData.shared = undefined;
        updatedData.tags = undefined;
        updatedData.id = this.props.savedView.id;
      } else {
        updatedData.groupId = this.props.savedView.groupId;
      }

      const cache = IModelConnectionCache.getSavedViewCache(iModelConnection);
      cache
        .updateSavedView(iModelConnection, updatedData, this.props.savedView)
        .catch(() => {
          showError();
        });
    } else {
      showError();
    }
  };

  /**
   * Deletes the saved view
   */
  private _handleDelete = async () => {
    const iModelConnection = this.props.connection;
    const showError = () => {
      SavedViewUtil.showError("ViewItemContextMenu", "listTools.error_deleteView_brief", "listTools.error_deleteView");
    };

    if (!iModelConnection) {
      throw new Error("Invalid iModelConnection in _handleDelete");
    }
    // Clear default saved view id (if set)
    if (this.props.showSetDefaultView) {
      const { iTwinId, iModelId } = iModelConnection;
      if (!iModelId || !iTwinId) {
        throw new Error("iModelId/iTwinId not defined in _handleDelete");
      }
      try {
        const viewId = await SavedViewsManager.defaultSavedViewIdClient.getDefaultSavedViewId(iTwinId, iModelId);
        if (viewId === this.props.savedView.id) {
          await SavedViewsManager.defaultSavedViewIdClient.updateDefaultSavedViewId(iTwinId, iModelId, undefined);
          this.props.setDefaultViewId("");
        }
      } catch (error) {
        SavedViewUtil.showError(
          "ViewItemContextMenu",
          "listTools.error_updateDefaultView_brief",
          "listTools.error_updateDefaultView",
        );
      }
    }
    const cache = IModelConnectionCache.getSavedViewCache(iModelConnection);
    cache.deleteSavedView(iModelConnection, this.props.savedView).catch(() => {
      showError();
    });
    SavedViewsManager.usageTracking?.trackDeleteUsage?.();
  };

  /** Handles sharing the view by opening the ShareViewDialog */
  private _handleShare = async (toShare: boolean) => {
    const iModelConnection = this.props.connection;
    if (!iModelConnection) {
      throw new Error("Invalid iModelConnection in _handleShare");
    }

    const share = toShare;

    const showError = () => {
      SavedViewUtil.showError("ViewItemContextMenu", "listTools.error_shareView_brief", "listTools.error_shareView");
    };

    const iModelCache =
      IModelConnectionCache.getSavedViewCache(iModelConnection);
    const groupsCache = IModelConnectionCache.getGroupCache(iModelConnection);

    if (!iModelCache || !groupsCache) {
      showError();
      return;
    }

    // If this saved view is no longer shared, then clear the default saved view id (if set)
    if (
      !share &&
      this.props.showSetDefaultView &&
      SavedViewsManager.defaultSavedViewIdClient.isSharedSetting
    ) {
      const { iTwinId, iModelId } = iModelConnection;
      if (!iModelId || !iTwinId) {
        throw new Error("iModelId/iTwinId not defined in _handleShare");
      }
      try {
        const viewId =
          await SavedViewsManager.defaultSavedViewIdClient.getDefaultSavedViewId(iTwinId, iModelId);
        if (viewId === this.props.savedView.id) {
          await SavedViewsManager.defaultSavedViewIdClient.updateDefaultSavedViewId(iTwinId, iModelId, undefined);
          this.props.setDefaultViewId("");
        }
      } catch (error) {
        SavedViewUtil.showError(
          "ViewItemContextMenu",
          "listTools.error_updateDefaultView_brief",
          "listTools.error_updateDefaultView",
        );
      }
    }

    iModelCache
      .shareView(iModelConnection, this.props.savedView, share)
      .catch(() => {
        showError();
      });
    if (toShare) {
      SavedViewsManager.usageTracking?.trackShareUsage?.();
    }
  };

  private _handleCopyLink = () => {
    SavedViewUtil.generateAndCopyUrl(this.props.savedView);
  };

  private _handleManageTags = () => {
    const isSavedViewOwner =
      this.props.savedView.userId === SavedViewsManager.userId ||
      !!SavedViewsManager.flags.allowSharedEdit;
    UiFramework.dialogs.modal.open(
      <TagManagementDialog savedView={this.props.savedView} isSavedViewOwner={isSavedViewOwner} />,
    );
    SavedViewsManager.usageTracking?.trackManageTagsUsage?.();
  };

  public override render() {
    const wantContextMenu = this.wantContextMenu();
    if (wantContextMenu) {
      return (
        <div className={"itwin-saved-views-view-item-more"}>
          {this.defaultPopupMenu}
        </div>
      );
    } else {
      return null;
    }
  }
}

export default connector(SavedViewItemContextMenu);
