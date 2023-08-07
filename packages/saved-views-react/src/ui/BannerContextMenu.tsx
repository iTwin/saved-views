/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { SvgDownload } from "@itwin/itwinui-icons-react";
import { type SelectOption } from "@itwin/itwinui-react";
import { connect, type ConnectedProps } from "react-redux";

import { SavedViewsManager } from "../api/SavedViewsManager";
import {
  setApplyCameraOnly, setFilterContent, setTurnOnModelsCategories, setTurnOnModelsCategoriesNotHidden,
  type SavedViewsState,
} from "../store/SavedViewsStateReducer";
import { DownloadViewportLink } from "./DownloadViewportLink";
import { ContextMenu, ContextMenuProps } from "./popupmenu/ContextMenu";
import type { MenuItem } from "./popupmenu/PopupMenuItem";

import "./BannerContextMenu.scss";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapState = (rootState: any) => {
  const state: SavedViewsState =
    rootState[SavedViewsManager.savedViewsStateKey];

  const {
    filterContent,
    applyCameraOnly,
    turnOnModelsCategories,
    turnOnModelsCategoriesNotHidden,
  } = state;

  return {
    filterContent,
    applyCameraOnly,
    turnOnModelsCategories,
    turnOnModelsCategoriesNotHidden,
  };
};

const connector = connect(mapState, {
  setApplyCameraOnly,
  setTurnOnModelsCategoriesNotHidden,
  setTurnOnModelsCategories,
  setFilterContent,
});

type PropsFromRedux = ConnectedProps<typeof connector>;
type Props = PropsFromRedux;

interface BannerContextMenuProps extends ContextMenuProps {
  savedViewsApplyViewSettings?: boolean;
  /** Flag for showing the "Show Everything" option in settings. If not provided default will be true and it will show this option */
  showShowEverythingOption?: boolean;
  additionalContextMenuItems?: MenuItem[];
  enableShowModelsCategoriesNotHiddenOption?: boolean;
}

class BannerContextMenu extends ContextMenu<Props & BannerContextMenuProps> {
  constructor(props: Props & BannerContextMenuProps) {
    super(props);

    // Get the selectedOption for filter from redux store
    let selectedOptionRedux =
      SavedViewsManager.enableHiddenModelsAndCategoriesApplyOptionAsDefault
        ? "showEverythingNotHidden"
        : "filterContent";
    if (this.props.turnOnModelsCategoriesNotHidden) {
      selectedOptionRedux = "showEverythingNotHidden";
    } else if (this.props.filterContent) {
      selectedOptionRedux = "filterContent";
    } else if (this.props.applyCameraOnly) {
      selectedOptionRedux = "applyCameraOnly";
    } else if (this.props.turnOnModelsCategories) {
      selectedOptionRedux = "showEverything";
    }

    this.state = {
      opened: false,
      selectedOption: selectedOptionRedux,
    };
  }

  protected wantContextMenu(): boolean {
    return true;
  }

  protected onGetContextMenuOptions(): MenuItem[] {
    const contextMenuItems: MenuItem[] = [];

    if (this.props.savedViewsApplyViewSettings) {
      const menuOptions: SelectOption<string>[] = [];
      menuOptions.push({
        value: "filterContent",
        label: SavedViewsManager.translate("listTools.filterContent"),
      });
      menuOptions.push({
        value: "applyCameraOnly",
        label: SavedViewsManager.translate("listTools.applyCameraOnly"),
      });
      // showShowEverythingOption default is true when undefined
      if (
        this.props.showShowEverythingOption === undefined ||
        this.props.showShowEverythingOption
      ) {
        menuOptions.push({
          value: "showEverything",
          label: SavedViewsManager.translate("listTools.turnOnModelsCategories"),
        });
      }

      if (this.props.enableShowModelsCategoriesNotHiddenOption) {
        menuOptions.push({
          value: "showEverythingNotHidden",
          label: SavedViewsManager.translate("listTools.turnOnModelsCategoriesNotHidden"),
        });
      }

      contextMenuItems.push({
        selectOptions: menuOptions,
        selectedOption: this.state.selectedOption,
        showSelect: true,
        onFilterContent: this._handleFilterContent,
        onApplyCameraOnly: this._handleApplyCameraOnly,
        onTurnOnModelsCategories: this._handleTurnOnModelsCategories,
        onTurnOnModelsCategoriesNotHidden:
          this._handleTurnOnModelsCategoriesNotHidden,
      });
    }

    contextMenuItems.push({
      customLinkContent: (
        <div className="dv-link-wrapper">
          <DownloadViewportLink className="dv-link">
            <SvgDownload />
            <span>
              {SavedViewsManager.translate("listTools.downloadViewport")}
            </span>
          </DownloadViewportLink>
        </div>
      ),
    });

    if (!this.props.savedViewsApplyViewSettings) {
      contextMenuItems.push({
        name: SavedViewsManager.translate("listTools.applyCameraOnly"),
        onToggle: (state: boolean) => this._handleApplyCameraOnly(state),
        showToggle: true,
        toggleOn: this.props.applyCameraOnly,
      });
      if (
        this.props.showShowEverythingOption === undefined ||
        this.props.showShowEverythingOption
      ) {
        contextMenuItems.push({
          name: SavedViewsManager.translate("listTools.turnOnModelsCategories"),
          onToggle: (state: boolean) =>
            this._handleTurnOnModelsCategories(state),
          showToggle: true,
          toggleOn: this.props.turnOnModelsCategories,
        });
      }
    }

    if (this.props.additionalContextMenuItems) {
      for (const contextMenuItem of this.props.additionalContextMenuItems) {
        contextMenuItems.push(contextMenuItem);
      }
    }

    return contextMenuItems;
  }

  private _handleFilterContent = (on: boolean) => {
    this.props.setApplyCameraOnly(!on);
    this.props.setTurnOnModelsCategoriesNotHidden(!on);
    this.props.setTurnOnModelsCategories(!on);
    this.props.setFilterContent(on);
    this.setState({
      selectedOption: "filterContent",
    });
  };

  private _handleApplyCameraOnly = (on: boolean) => {
    this.props.setTurnOnModelsCategories(!on);
    this.props.setTurnOnModelsCategoriesNotHidden(!on);
    this.props.setFilterContent(!on);
    this.props.setApplyCameraOnly(on);
    this.setState({
      selectedOption: "applyCameraOnly",
    });
  };

  private _handleTurnOnModelsCategories = (on: boolean) => {
    this.props.setApplyCameraOnly(!on);
    this.props.setTurnOnModelsCategoriesNotHidden(!on);
    this.props.setFilterContent(!on);
    this.props.setTurnOnModelsCategories(on);
    this.setState({
      selectedOption: "showEverything",
    });
  };

  private _handleTurnOnModelsCategoriesNotHidden = (on: boolean) => {
    this.props.setApplyCameraOnly(!on);
    this.props.setTurnOnModelsCategories(!on);
    this.props.setFilterContent(!on);
    this.props.setTurnOnModelsCategoriesNotHidden(on);
    this.setState({
      selectedOption: "showEverythingNotHidden",
    });
  };

  public override render() {
    if (this.wantContextMenu()) {
      return (
        <div className="itwin-saved-views-view-item-more">
          {this.defaultPopupMenu}
        </div>
      );
    } else {
      return null;
    }
  }
}

export default connector(BannerContextMenu);
