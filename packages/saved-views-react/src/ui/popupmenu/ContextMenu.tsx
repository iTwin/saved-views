/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { RelativePosition as Position } from "@itwin/appui-abstract";
import { PopupContextMenu } from "@itwin/core-react";
import { Component, MouseEvent } from "react";

import { SavedViewsManager } from "../../api/SavedViewsManager";
import { PopupMenuItem, type MenuItem } from "./PopupMenuItem";

import "../viewlist/viewitem/ViewItem.scss";

export interface ContextMenuProps {
  onOpen?: () => void;
  onClose?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contextMenuViewportRef?: React.RefObject<any>;
}

export interface ContextMenuState {
  opened: boolean;
  selectedOption: string;
}

export abstract class ContextMenu<P extends ContextMenuProps> extends Component<P, ContextMenuState> {
  private _unmounted = false;
  private _target: HTMLElement | null = null;

  constructor(props: ContextMenuProps & P) {
    super(props);

    this.state = {
      opened: false,
      selectedOption: SavedViewsManager.translate("listTools.filterContent"),
    };
  }

  public override componentWillUnmount() {
    this._unmounted = true;
  }

  protected abstract wantContextMenu(): boolean;

  protected abstract onGetContextMenuOptions(): MenuItem[];

  protected onMenuItemClick(menuItem: MenuItem) {
    this.onCloseContextMenu();
    if (menuItem.onClick) {
      menuItem.onClick();
    }
  }

  protected onShowOptions = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!this._unmounted) {
      const opened = !this.state.opened;
      this.setState({ opened });
    }
    if (this.props.onOpen) {
      this.props.onOpen();
    }
  };

  protected onCloseContextMenu = () => {
    if (!this._unmounted) {
      this.setState({ opened: false });
    }
    if (this.props.onClose) {
      this.props.onClose();
    }
  };

  public get defaultPopupMenu() {
    const props = this.onGetContextMenuOptions();

    if (!props.length) {
      return null;
    }

    return (
      <>
        <div
          className="icon icon-more-2"
          onClick={this.onShowOptions}
          ref={(element) => {
            this._target = element;
          }}
        ></div>
        <PopupContextMenu
          onOutsideClick={this.onCloseContextMenu}
          onClose={this.onCloseContextMenu}
          isOpen={this.state.opened}
          autoflip={false}
          position={Position.TopRight}
          target={this._target}
        >
          <>
            {props &&
              this.state.opened &&
              props.map((menuItem: MenuItem, index: number) => (
                <PopupMenuItem
                  key={index}
                  name={menuItem.name}
                  iconSpec={menuItem.iconSpec}
                  iconComponent={menuItem.iconComponent}
                  onClick={() => this.onMenuItemClick(menuItem)}
                  showToggle={menuItem.showToggle}
                  onToggle={menuItem.onToggle}
                  toggleOn={menuItem.toggleOn}
                  disabled={menuItem.disabled}
                  showSelect={menuItem.showSelect}
                  selectedOption={menuItem.selectedOption}
                  selectOptions={menuItem.selectOptions}
                  onFilterContent={menuItem.onFilterContent}
                  onApplyCameraOnly={menuItem.onApplyCameraOnly}
                  onTurnOnModelsCategories={menuItem.onTurnOnModelsCategories}
                  onTurnOnModelsCategoriesNotHidden={
                    menuItem.onTurnOnModelsCategoriesNotHidden
                  }
                  customLinkContent={menuItem.customLinkContent}
                />
              ))}
          </>
        </PopupContextMenu>
      </>
    );
  }
}
