/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { connect, type ConnectedProps } from "react-redux";

import { IModelConnectionCache } from "../../../api/caches/IModelConnectionCache";
import { SavedViewsManager } from "../../../api/SavedViewsManager";
import type { Group, LegacySavedViewBase, SavedViewBaseUpdate } from "../../../api/utilities/SavedViewTypes";
import { SavedViewUtil } from "../../../api/utilities/SavedViewUtil";
import { setGroupOpen, setRenaming, type SavedViewsState } from "../../../store/SavedViewsStateReducer";
import { createNewSavedView } from "../../createNewSavedView";
import { ContextMenu, ContextMenuProps } from "../../popupmenu/ContextMenu";
import type { MenuItem } from "../../popupmenu/PopupMenuItem";

import "./GroupItem.scss";

export interface GroupItemContextMenuItemProps extends MenuItem {
  onClick: (group: Group) => void;
}

/** GroupitemContextMenu widget props */
export interface GroupItemContextMenuProps extends ContextMenuProps {
  group: Group;
  handleRename: () => void;
  want2dViews?: boolean;
  additionalContextMenuItems?: GroupItemContextMenuItemProps[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapState = (rootState: any, props: GroupItemContextMenuProps) => {
  const state: SavedViewsState =
    rootState[SavedViewsManager.savedViewsStateKey];
  const connection = state.iModel;
  const userId = SavedViewsManager.userId;
  const savedViews = state.savedViews[props.group.id] || {};

  return {
    savedViews,
    userId,
    connection,
  };
};
const connector = connect(mapState, {
  setGroupOpen,
  setRenaming,
});

type PropsFromRedux = ConnectedProps<typeof connector>;

type Props = PropsFromRedux & GroupItemContextMenuProps;

/** Group Item Context Menu */
class GroupItemContextMenu extends ContextMenu<Props> {
  constructor(props: Props) {
    super(props);
  }

  private isCurrentUserCreator(): boolean {
    return this.props.userId === this.props.group.userId;
  }

  protected wantContextMenu(): boolean {
    return (
      (this.isCurrentUserCreator() || this.props.group.shared) &&
      this.props.group.id !== SavedViewsManager.desktopViewsGroupId
    );
  }

  private getContextMenuOptions(): MenuItem[] {
    const contextMenuItems: MenuItem[] = [];
    if (
      this.props.group.id === SavedViewsManager.desktopViewsGroupId ||
      this.props.group.id === SavedViewsManager.ungroupedId
    ) {
      return contextMenuItems;
    }
    if (
      this.props.group.shared &&
      this.props.group.userId !== this.props.userId &&
      SavedViewsManager.flags.savedViewsPublicShare
    ) {
      // Allow user to delete the group if they have imodel_manage (admin) permission
      if (SavedViewsManager.flags.allowSharedEdit) {
        contextMenuItems.push({
          iconSpec: "icon-delete",
          name: SavedViewsManager.translate("groups.ungroup"),
          onClick: this._handleUngroupGroup,
        });
      }

      contextMenuItems.push({
        iconSpec: "icon-camera",
        name: SavedViewsManager.translate("groups.newSavedView"),
        onClick: this._handleCreateNewView,
      });

      return contextMenuItems;
    } else {
      contextMenuItems.push({
        iconSpec: "icon-share",
        name: SavedViewsManager.translate("groups.shared"),
        onToggle: (state: boolean) => this._handleShareGroup(state),
        showToggle: true,
        toggleOn: this.props.group.shared,
      });

      contextMenuItems.push({
        iconSpec: "icon-delete",
        name: SavedViewsManager.translate("groups.ungroup"),
        onClick: this._handleUngroupGroup,
      });
      contextMenuItems.push({
        iconSpec: "icon-rename",
        name: SavedViewsManager.translate("groups.rename"),
        onClick: this.props.handleRename,
      });
      contextMenuItems.push({
        iconSpec: "icon-camera",
        name: SavedViewsManager.translate("groups.newSavedView"),
        onClick: this._handleCreateNewView,
      });

      return contextMenuItems;
    }
  }

  protected onGetContextMenuOptions(): MenuItem[] {
    const contextMenuItems: MenuItem[] = this.getContextMenuOptions();
    if (this.props.additionalContextMenuItems) {
      for (const contextMenuItem of this.props.additionalContextMenuItems) {
        contextMenuItems.push({
          ...contextMenuItem,
          onClick: () => contextMenuItem.onClick(this.props.group),
        });
      }
    }
    return contextMenuItems;
  }

  private _handleCreateNewView = () => {
    void createNewSavedView({
      iModel: this.props.connection ?? undefined,
      userId: this.props.userId ?? undefined,
      groupId: this.props.group.id,
      shared: this.props.group.shared,
      want2dViews: this.props.want2dViews,
      handleTooManyEmphasizedElements:
        SavedViewsManager.flags.handleTooManyEmphasizedElements,
      onSuccess: (savedViewData: LegacySavedViewBase) => {
        this.props.setGroupOpen({ groupId: this.props.group.id, opened: true });
        this.props.setRenaming({ id: savedViewData.id, renaming: true });
      },
      onError: (_savedViewData: LegacySavedViewBase, ex: Error) => {
        SavedViewUtil.showError(
          "GroupItemContextMenu",
          "listTools.error_createView_brief",
          "listTools.error_createView",
          ex,
        );
      },
      onTooLarge: (_savedViewData: LegacySavedViewBase) => {
        SavedViewUtil.showError("GroupItemContextMenu", "listTools.error_tooLarge_brief", "listTools.error_tooLarge");
      },
    });
  };

  private _handleShareGroup = (toShare: boolean) => {
    const iModelConnection = this.props.connection;
    if (!iModelConnection) {
      return;
    }

    const groupCache = IModelConnectionCache.getGroupCache(iModelConnection);
    const viewCache = IModelConnectionCache.getSavedViewCache(iModelConnection);

    if (!groupCache || !viewCache) {
      SavedViewUtil.showError("GroupItemContextMenu", "groups.error_shareGroup_brief", "groups.error_shareGroup");
      return;
    }

    const share = toShare;
    const views = Object.values(this.props.savedViews);

    const promises = views
      .map(async (v) => {
        if (v.shared === share) {
          return undefined;
        } else {
          return viewCache.shareView(iModelConnection, v, share);
        }
      })
      .filter((p) => p !== undefined);

    groupCache
      .shareGroup(iModelConnection, this.props.group, share)
      .catch(() => {
        SavedViewUtil.showError("GroupItemContextMenu", "groups.error_shareGroup_brief", "groups.error_shareGroup");
      });

    Promise.all(promises)
      .then(() => {
        return;
      })
      .catch((e) => {
        SavedViewUtil.showError("GroupItemContextMenu", "groups.error_shareGroup_brief", "groups.error_shareGroup", e);
      });
  };

  private _handleUngroupGroup = async () => {
    const iModelConnection = this.props.connection;
    if (!iModelConnection) {
      return;
    }

    const viewsCache = IModelConnectionCache.getSavedViewCache(iModelConnection);
    const viewsInDeletedGroup = await viewsCache.getSavedViewsForGroup(iModelConnection, this.props.group.id);
    const groupCache = IModelConnectionCache.getGroupCache(iModelConnection);

    const promises = viewsInDeletedGroup.map(async (v: LegacySavedViewBase) => {
      const updated: SavedViewBaseUpdate = {
        groupId: SavedViewsManager.ungroupedId,
        id: v.id,
      };
      return viewsCache.updateSavedView(iModelConnection, updated, v);
    });

    Promise.all(promises)
      .then(async () => {
        return groupCache.deleteGroup(iModelConnection, this.props.group);
      })
      .catch((e) => {
        SavedViewUtil.showError(
          "GroupItemContextMenu",
          "listTools.error_deleteGroup_brief",
          "listTools.error_deleteGroup",
          e,
        );
      })
      .catch(() => {
        SavedViewUtil.showError("GroupItemContextMenu", "groups.error_deleteGroup_brief", "groups.error_deleteGroup");
      });
  };

  public override render() {
    const wantContextMenu = this.wantContextMenu();
    if (wantContextMenu) {
      return <div className="group-item-more">{this.defaultPopupMenu}</div>;
    } else {
      return (
        <div className="group-item-more invisible">
          <span className="icon icon-more-2"></span>
        </div>
      );
    }
  }
}

export default connector(GroupItemContextMenu);
