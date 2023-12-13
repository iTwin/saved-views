/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Guid } from "@itwin/core-bentley";
import type { ViewDefinitionProps } from "@itwin/core-common";
import { type IModelConnection } from "@itwin/core-frontend";
import type { CommonProps } from "@itwin/core-react";
import * as React from "react";
import { connect, type ConnectedProps } from "react-redux";
import AutoSizer, { type Size } from "react-virtualized-auto-sizer";
import { FixedSizeList, type ListChildComponentProps } from "react-window";

import { IModelConnectionCache } from "../../api/caches/IModelConnectionCache";
import { SavedViewsManager } from "../../api/SavedViewsManager";
import { type TargetViewport } from "../../api/TargetViewport";
import { type LegacySavedView, type LegacySavedViewBase } from "../../api/utilities/SavedViewTypes";
import { SavedViewUtil } from "../../api/utilities/SavedViewUtil";
import { type SavedViewsState } from "../../store/SavedViewsStateReducer";
import { processViewStateSelected } from "./ProcessViewState";
import { default as SavedViewItem, type SavedViewItemProps } from "./viewitem/SavedViewItem";
import type { SavedViewContextMenuItemProps } from "./viewitem/SavedViewItemContextMenu";
import ViewItem, { type ViewItemProps } from "./viewitem/ViewItem";

import "./ViewsList.scss";

function RenderRow({ index, style, data }: ListChildComponentProps) {
  const width = data.width;
  const listGridWidth = data.listGridWidth;
  const views = data.views;

  if (listGridWidth) {
    // create views for the row
    const numViewed = Math.floor(width / listGridWidth);
    const start = index * numViewed;
    const returnedRowViews = [];
    for (let i = start; i < start + numViewed && i < views.length; ++i) {
      returnedRowViews.push(views[i]);
    }
    // Not sure what this code achieves. Just goitng to leave it here for now.
    if (returnedRowViews.length === 1) {
      returnedRowViews.push(<div key={-1} className="itwin-saved-views-view-list-item-thumbnail-empty" />);
    }

    return (
      <div style={style} className="itwin-saved-views-views-grid-row">
        {returnedRowViews}
      </div>
    );
  } else {
    return <div style={style}>{views[index]}</div>;
  }
}

/** ViewList properties  */
export interface ViewsListProps extends CommonProps {
  views: Array<LegacySavedView | ViewDefinitionProps>;
  listGridHeight?: number;
  /** Width of a grid item */
  listGridWidth?: number;
  thumbnailClassName?: string;
  /** Show hover indicator in thumbnail view */
  showHoverIndicator?: boolean;
  /** Optional content when no views are found */
  noViewsContent?: React.ReactNode;
  onListHeightDetermined?: (height: number) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contextMenuViewportRef?: React.RefObject<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  groupListRef?: React.RefObject<any>;
  viewListRef?: React.RefObject<HTMLDivElement>;
  want2dViews?: boolean;
  additionalContextMenuItems?: SavedViewContextMenuItemProps[];
  isDesktopView?: boolean;
  targetViewport: TargetViewport;
  iModel?: IModelConnection;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapState = (rootState: any) => {
  const state: SavedViewsState =
    rootState[SavedViewsManager.savedViewsStateKey];

  const iModel = state.iModel;
  const applyCameraOnly = state.applyCameraOnly;
  const turnOnModelsCategories = state.turnOnModelsCategories;
  const turnOnModelsCategoriesNotHidden = state.turnOnModelsCategoriesNotHidden;
  const targetViewport = state.targetViewport;

  return {
    iModel,
    applyCameraOnly,
    turnOnModelsCategories,
    turnOnModelsCategoriesNotHidden,
    targetViewport,
  };
};

const connector = connect(mapState, {});

type PropsFromRedux = ConnectedProps<typeof connector>;
type Props = PropsFromRedux & ViewsListProps;

interface ViewsListState {
  selected: LegacySavedViewBase | ViewDefinitionProps | null;
}

/** View List Component with functionality to show thumbnails, handle saved view functionality */
class ViewsList extends React.PureComponent<Props, ViewsListState> {
  /** Sets up initial state and creates a SavedViewsClient if necessary */
  constructor(props: Props) {
    super(props);

    this.state = {
      selected: null,
    };
  }

  /** Caches for model ids and category ids for turning on functionality */
  private _allModelIds = new Set<string>();
  private _allCategoryIds = new Set<string>();

  /** Handles opening a saved view */
  private async handleSavedViewSelected(view: LegacySavedViewBase) {
    this.setState({ selected: view });

    const iModelConnection = this.props.iModel;
    if (!iModelConnection) {
      throw new Error("iModelConnection is undefined");
    }

    const client = IModelConnectionCache.getSavedViewCache(iModelConnection);
    if (client) {
      const viewState = await client.getViewState(
        iModelConnection,
        view,
        SavedViewsManager.onViewSourceNotFound,
        this.props.turnOnModelsCategoriesNotHidden,
        SavedViewsManager.onHiddenModelsAndCategoriesNotSupported,
      );
      if (viewState) {
        await processViewStateSelected(
          iModelConnection,
          viewState,
          this.props.want2dViews ?? false,
          this.props.applyCameraOnly,
          this.props.turnOnModelsCategories,
          view,
          this._allModelIds,
          this._allCategoryIds,
          this.props.isDesktopView,
          this.props.targetViewport,
        );

        if (!this.props.iModel) {
          throw new Error("Invalid iModelConnection in ViewsStatusField");
        }

        // #121440: Clear selection when applying saved views
        this.props.iModel.selectionSet.emptyAll();
      }
    }
    SavedViewsManager.usageTracking?.trackApplyUsage?.();
  }

  /** Handle selecting views by changing it in the selected viewport */
  private async handleViewSelected(view: ViewDefinitionProps) {
    if (!view.id) {
      return;
    }

    this.setState({ selected: view });

    const iModelConnection = this.props.iModel;
    if (!iModelConnection) {
      throw new Error("iModelConnection is undefined");
    }

    const viewState = await iModelConnection.views.load(view.id);
    await processViewStateSelected(
      iModelConnection,
      viewState,
      this.props.want2dViews ?? false,
      this.props.applyCameraOnly,
      this.props.turnOnModelsCategories,
      undefined,
      this._allModelIds,
      this._allCategoryIds,
      this.props.isDesktopView,
      this.props.targetViewport,
    );
  }

  /** Create props for the view item from our properties */
  private createViewItemProps(viewProps: ViewDefinitionProps) {
    const props: ViewItemProps = {
      viewProps,
      showHoverIndicator: this.props.showHoverIndicator,
      onClick: this.handleViewSelected.bind(this),
      className: this.props.thumbnailClassName,
    };
    return props;
  }

  /** Create props for the saved view item from our props */
  private createSavedViewItemProps(savedView: LegacySavedView, index: number) {
    const props: SavedViewItemProps = {
      draggableIndex: index,
      savedView,
      onClick: this.handleSavedViewSelected.bind(this),
      className: this.props.thumbnailClassName,
      viewlistRef: this.props.viewListRef,
      groupListRef: this.props.groupListRef,
      additionalContextMenuItems: this.props.additionalContextMenuItems,
    };

    return props;
  }

  // Generates safe names to use in the set by appending a GUID to names already present in the map
  private getSortingName(nameToViewItem: Map<string, React.ReactElement>, name: string): string {
    if (!nameToViewItem.has(name)) {
      return name;
    }

    // Keeps adding a character so that names do not override each other
    return name + "_" + Guid.createValue();
  }

  /** Render the view defs and/or the saved views */
  private renderViews() {
    const views: React.ReactElement[] = [];
    let index = 0;

    const nameToViewItem = new Map<string, React.ReactElement>();

    this.props.views.forEach((view: LegacySavedView | ViewDefinitionProps) => {
      if (SavedViewUtil.isSavedView(view)) {
        const savedView = view as LegacySavedView;
        const props = this.createSavedViewItemProps(savedView, index);
        nameToViewItem.set(
          this.getSortingName(nameToViewItem, savedView.name),
          <SavedViewItem {...props} key={index++} />,
        );
      } else {
        const viewProp = view as ViewDefinitionProps;
        const name = viewProp.userLabel ?? viewProp.code?.value ?? "NoName";
        const props = this.createViewItemProps(viewProp);
        nameToViewItem.set(
          this.getSortingName(nameToViewItem, name),
          <ViewItem {...props} key={index++} />,
        );
      }
    });

    // Sort them by name
    const names = [...nameToViewItem.keys()].sort((a, b) => a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase()));

    for (const name of names) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      views.push(nameToViewItem.get(name)!);
    }

    if (views.length === 0) {
      return (
        <>
          {this.props.noViewsContent && (
            <div className="noviews-container">{this.props.noViewsContent}</div>
          )}
          {!this.props.noViewsContent && (
            <div>
              <span className="default-prompt">
                {SavedViewsManager.translate("listTools.error_noviews")}
              </span>
            </div>
          )}
        </>
      );
    }

    const renderList = (size: Size) => {
      const itemCount = this.props.listGridWidth
        ? Math.ceil(views.length / Math.floor(size.width / this.props.listGridWidth))
        : views.length;

      const itemSize = this.props.listGridHeight
        ? this.props.listGridHeight
        : 125;

      if (this.props.onListHeightDetermined) {
        this.props.onListHeightDetermined(itemCount * itemSize);
      }

      return (
        <FixedSizeList
          height={size.height}
          itemCount={itemCount}
          itemSize={itemSize}
          itemData={{
            width: size.width,
            listGridWidth: this.props.listGridWidth,
            views,
          }}
          width={size.width}
        >
          {RenderRow}
        </FixedSizeList>
      );
    };

    return <AutoSizer>{renderList}</AutoSizer>;
  }

  /** Render list of views */
  public override render() {
    const className = `itwin-saved-views-views-content ${this.props.className}`;
    return <div className={className}>{this.renderViews()}</div>;
  }
}

export default connector(ViewsList);
