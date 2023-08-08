/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { ContextMenuItem, Icon } from "@itwin/core-react";
import { Select, ToggleSwitch, type SelectOption } from "@itwin/itwinui-react";
import { Component, MouseEvent } from "react";

import { SavedViewsManager } from "../../api/SavedViewsManager";

import "./PopupMenuItem.scss";

/** Properties for [[PopupMenuItem]] component */
export interface MenuItem {
  /** Name of the context menu item */
  name?: string;
  /** Optional icon name for the Icon component */
  iconSpec?: string;
  /** Component to display as the icon. Overridden by iconSpec, if both are defined. */
  iconComponent?: React.ReactNode;
  /** Disabled */
  disabled?: boolean;
  /** Separator */
  isSeparator?: boolean;
  /** Called when the item is clicked */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClick?: (item?: any) => void;
  /** Show a toggle input after the name of this item */
  showToggle?: boolean;
  /** Is the toggle on? Only valid if 'showToggle' is set to true */
  toggleOn?: boolean;
  /** Handler for when the toggle is clicked. Only valid if 'showToggle' is set to true */
  onToggle?: (state: boolean) => void;
  /** Handler for when 'Filter Content' option is selected */
  onFilterContent?: (on: boolean) => void;
  /** Handler for when 'Apply Camera Only' option is selected */
  onApplyCameraOnly?: (on: boolean) => void;
  /** Handler for when 'Show Everything' option is selected */
  onTurnOnModelsCategories?: (on: boolean) => void;
  /** Handler for when 'Show Everything Not Hidden' option is selected */
  onTurnOnModelsCategoriesNotHidden?: (on: boolean) => void;
  /** Show select input */
  showSelect?: boolean;
  /** Default selected option is "Filtered Content" */
  selectedOption?: string;
  /** Options to show in the select */
  selectOptions?: SelectOption<string>[];
  /** Handler for when an item from the select is clicked */
  onSelect?: (state: boolean) => void;
  /** Pass in the JSX for a custom link, overrides other properties */
  customLinkContent?: React.ReactElement;
}

interface PopupMenuState {
  selectedOption: string;
}
/**
 * A context menu item to use on a popup.
 */
export class PopupMenuItem extends Component<MenuItem, PopupMenuState> {
  constructor(menuItem: MenuItem) {
    super(menuItem);
    this.state = {
      selectedOption: this.props.selectedOption ?? "filterContent",
    };
  }
  private _onClick = (event: MouseEvent<HTMLDivElement | HTMLLIElement>) => {
    event.stopPropagation();
    if (!this.props.disabled && !this.props.isSeparator && this.props.onClick) {
      this.props.onClick();
    }
  };

  private _onChange = (value: string) => {
    this.setState({ selectedOption: value });
    if (value === "filterContent" && this.props.onFilterContent) {
      this.props.onFilterContent(true);
    } else if (value === "applyCameraOnly" && this.props.onApplyCameraOnly) {
      this.props.onApplyCameraOnly(true);
    } else if (
      value === "showEverything" &&
      this.props.onTurnOnModelsCategories
    ) {
      this.props.onTurnOnModelsCategories(true);
    } else if (
      value === "showEverythingNotHidden" &&
      this.props.onTurnOnModelsCategoriesNotHidden
    ) {
      this.props.onTurnOnModelsCategoriesNotHidden(true);
    }
  };

  public override render() {
    const menuClassName = `itwin-saved-views-contextmenu-portal-item ${this.props.disabled ? "disabled" : ""} ${this.props.showToggle ? "has-select" : ""}`;

    return (
      <ContextMenuItem
        key={this.props.name}
        icon={this.props.iconSpec}
        hideIconContainer={true}
      >
        <>
          {this.props.isSeparator && (
            <div className="separator" onClick={this._onClick} />
          )}
          {this.props.showSelect &&
            this.props.selectOptions &&
            this.props.selectedOption && (
              <div>
                <li className={menuClassName}>
                  <div className="when-applying-label">
                    {SavedViewsManager.translate("listTools.whenApplying")}
                  </div>
                  <div className="popup-menu-select-wrapper">
                    <Select
                      options={this.props.selectOptions}
                      onChange={(value) => this._onChange(value)}
                      value={this.props.selectedOption}
                      popoverProps={{ appendTo: "parent" }}
                      className={"popup-menu-select"}
                    ></Select>
                  </div>
                </li>
                <div className="itwin-saved-views-contextmenu-divider"></div>
              </div>
            )}
          {!this.props.isSeparator && this.props.customLinkContent && (
            <li className={menuClassName}>
              <div className={"custom-link"}>
                {this.props.customLinkContent}
              </div>
            </li>
          )}

          {!this.props.isSeparator &&
            !this.props.customLinkContent &&
            !this.props.showSelect && (
              <li
                className={menuClassName}
                onClick={this.props.showToggle ? undefined : this._onClick}
              >
                <div className={"user-icon-name"}>
                  {this.props.iconSpec && (
                    <span className="user-icon">
                      <Icon iconSpec={this.props.iconSpec} />
                    </span>
                  )}
                  {this.props.iconComponent && (
                    <span className="component-icon">
                      {this.props.iconComponent}
                    </span>
                  )}
                  <span>{this.props.name}</span>
                </div>
                {this.props.showToggle && this.props.onToggle && (
                  <div className="toggle-div">
                    <ToggleSwitch
                      checked={this.props.toggleOn}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        this.props.onToggle && !this.props.disabled
                          ? this.props.onToggle(e.target.checked)
                          : undefined
                      }
                    />
                  </div>
                )}
              </li>
            )}
        </>
      </ContextMenuItem>
    );
  }
}
