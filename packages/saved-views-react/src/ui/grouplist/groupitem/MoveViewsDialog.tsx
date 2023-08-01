// Copyright (c) Bentley Systems, Incorporated. All rights reserved.

import { DialogButtonType } from "@itwin/appui-abstract";
import { UiFramework } from "@itwin/appui-react";
import { Dialog } from "@itwin/core-react";
import { Select } from "@itwin/itwinui-react";
import * as React from "react";
import { type ConnectedProps, connect } from "react-redux";

import { IModelConnectionCache } from "../../../api/caches/IModelConnectionCache";
import { SavedViewsManager } from "../../../api/SavedViewsManager";
import { SavedViewUtil } from "../../../api/utilities/SavedViewUtil";
import {
  type SavedViewsState,
  clearSelectedViews,
} from "../../../store/SavedViewsStateReducer";
import "./MoveViewsDialog.scss";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapState = (rootState: any) => {
  const state: SavedViewsState =
    rootState[SavedViewsManager.savedViewsStateKey];

  const groups = state.groups;
  const connection = state.iModel;
  const views = state.selectedViews;
  const userId = SavedViewsManager.userId;

  return {
    userId,
    views,
    groups,
    connection,
  };
};

const connector = connect(mapState, {
  clearSelectedViews,
});

type PropsFromRedux = ConnectedProps<typeof connector>;

type Props = PropsFromRedux;

/** MoveViewsDialog State */
export interface MoveViewsDialogState {
  choice: string;
}

/** Used to create a saved view and let user name the view */
export class MoveViewsDialog extends React.Component<
  Props,
  MoveViewsDialogState
> {
  constructor(props: Props) {
    super(props);

    this.state = {
      choice: "",
    };
  }

  private _handleOk = async () => {
    if (!this.state.choice) {
      return;
    }

    const showError = (e: Error) => {
      if (e.message.includes("Could not move saved view: Cannot move new view into legacy group")) {
        SavedViewUtil.showError(
          "MoveViewsDialog",
          "groups.error_moveViews_brief",
          "groups.error_moveViews_nonLegacyView",
          e,
        );
        return;
      } else if (e.message.includes("Could not move saved view: Cannot move legacy view into new group")) {
        SavedViewUtil.showError(
          "MoveViewsDialog",
          "groups.error_moveViews_brief",
          "groups.error_moveViews_legacyView",
          e,
        );
        return;
      }
      SavedViewUtil.showError("MoveViewsDialog", "groups.error_moveViews_brief", "groups.error_moveViews", e);
    };

    const iModelConnection = this.props.connection;

    const imodelCache = IModelConnectionCache.getSavedViewCache(iModelConnection!);

    const promises = this.props.views.map((s) =>
      imodelCache!.updateSavedView(iModelConnection!, { groupId: this.state.choice!, id: s.id }, s),
    );

    Promise.all(promises).catch((e) => {
      showError(e);
    });

    this.props.clearSelectedViews();
    UiFramework.dialogs.modal.close();
  };

  private _handleCancel = () => {
    this.props.clearSelectedViews();
    UiFramework.dialogs.modal.close();
  };

  private _handleChange = async (selectedOption: string) => {
    this.setState({
      choice: selectedOption,
    });
  };

  public override render() {
    const groupOptions: { [key: string]: string; } = {
      invalid: SavedViewsManager.translate("groups.select"),
    };

    const allSavedViewsGroupIds = this.props.views.map((s) => s.groupId || SavedViewsManager.ungroupedId);
    const filtered = Object.values(this.props.groups).filter((g) => {
      const isNotDesktopGroup = g.id !== SavedViewsManager.desktopViewsGroupId;
      const isOwnedByUserAndIsValid =
        g.userId === this.props.userId && !allSavedViewsGroupIds.includes(g.id);

      const isNotOwnedAndIsShared =
        g.userId !== this.props.userId && g.shared === true;
      const isUngroupedGroup = g.id === SavedViewsManager.ungroupedId;

      return (
        isNotDesktopGroup &&
        (isOwnedByUserAndIsValid || isUngroupedGroup || isNotOwnedAndIsShared)
      );
    });
    const sorted = filtered.sort((a, b) => a.name.localeCompare(b.name));
    sorted.forEach((g) => (groupOptions[g.id] = g.name));

    return (
      <Dialog
        title={
          SavedViewsManager.translate("groups.move") +
          " " +
          this.props.views.length +
          " " +
          SavedViewsManager.translate("groups.view_views")
        }
        opened={true}
        width="300px"
        onClose={this._handleCancel}
        buttonCluster={[
          {
            type: DialogButtonType.OK,
            label: SavedViewsManager.translate("groups.move"),
            onClick: this._handleOk,
            disabled: !this.state.choice,
          },
          { type: DialogButtonType.Cancel, onClick: this._handleCancel },
        ]}
        movable={true}
      >
        <div className="move-view-dialog">
          <div className="move-view-dialog-row">
            <Select
              onChange={(selectedOption: string) =>
                this._handleChange(selectedOption)
              }
              options={sorted.map((group) => ({
                value: group.id,
                label: group.name,
              }))}
              value={this.state.choice}
              className={"move-view-dialog-select"}
              placeholder={SavedViewsManager.translate("groups.select")}
              popoverProps={{ appendTo: "parent" }}
            ></Select>
          </div>
        </div>
      </Dialog>
    );
  }
}

export default connector(MoveViewsDialog);
