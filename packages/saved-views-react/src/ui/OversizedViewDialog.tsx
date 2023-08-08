/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { DialogButtonType } from "@itwin/appui-abstract";
import { UiFramework } from "@itwin/appui-react";
import { Dialog } from "@itwin/core-react";
import * as React from "react";

import { SavedViewsManager } from "../api/SavedViewsManager";
import "./OversizedViewDialog.scss";

export interface OversizedViewDialogProps {
  onContinue: () => void;
  onCancel: () => void;
}

/** A dialogue used to prompt user when the saved view cannot be persisted due to too many emphasized elements */
class OversizedViewsDialog extends React.Component<OversizedViewDialogProps> {
  constructor(props: OversizedViewDialogProps) {
    super(props);
  }

  private _handleOk = async () => {
    this.props.onContinue();
    UiFramework.dialogs.modal.close();
  };

  private _handleCancel = () => {
    this.props.onCancel();
    UiFramework.dialogs.modal.close();
  };

  public override render() {
    return (
      <Dialog
        title={SavedViewsManager.translate("oversizedViewDialog.title")}
        opened={true}
        width="300px"
        onClose={this._handleCancel}
        buttonCluster={[
          {
            type: DialogButtonType.OK,
            label: SavedViewsManager.translate("oversizedViewDialog.continue"),
            onClick: this._handleOk,
          },
          { type: DialogButtonType.Cancel, onClick: this._handleCancel },
        ]}
        movable={true}
      >
        <div className="oversized-view-dialog-container">
          <div className="oversized-view-dialog-content">
            <div className="oversized-view-dialog-warning">
              {" "}
              <i className="icon icon-status-warning" />{" "}
            </div>
            <div className="oversized-view-dialog-description">
              <span>
                {SavedViewsManager.translate("oversizedViewDialog.description")}
              </span>
            </div>
          </div>
          <br />
          <p>
            {SavedViewsManager.translate("oversizedViewDialog.continueMessage")}
          </p>
        </div>
      </Dialog>
    );
  }
}

export default OversizedViewsDialog;
