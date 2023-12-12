/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import type { CommonProps } from "@itwin/core-react";
import { Component } from "react";
import { connect, type ConnectedProps } from "react-redux";

import { SavedViewsManager } from "../../api/SavedViewsManager";
import type { LegacyGroup } from "../../api/utilities/SavedViewTypes";
import { SavedViewUtil } from "../../api/utilities/SavedViewUtil";
import { type SavedViewsState } from "../../store/SavedViewsStateReducer";
import type { SavedViewContextMenuItemProps } from "../viewlist/viewitem/SavedViewItemContextMenu";
import GroupItem from "./groupitem/GroupItem";
import type { GroupItemContextMenuItemProps } from "./groupitem/GroupItemContextMenu";

import "./GroupList.scss";

interface GroupListProps extends CommonProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  groupListContainerRef?: React.RefObject<any>;
  want2dViews?: boolean;
  additionalGroupContextMenuItems?: GroupItemContextMenuItemProps[];
  additionalSavedViewContextMenuItems?: SavedViewContextMenuItemProps[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapState = (rootState: any) => {
  const state: SavedViewsState =
    rootState[SavedViewsManager.savedViewsStateKey];

  const allViews = Object.values(state.savedViews).map((obj) => Object.values(obj));
  const allDesktopViews = state.desktopViews;
  const connection = state.iModel;
  const userId = SavedViewsManager.userId;
  const groups = state.groups;
  const thereIsASearchFilter =
    state.searchFilter.length > 0 || state.searchTags.length > 0;
  const searchFilter = state.searchFilter;

  let noResultsFromFiltering = false;

  // TODO: figure out a better way to determine if there are any results
  // from search or not. This current implementation might pose a performance risk
  if (thereIsASearchFilter) {
    const someSavedViewsMatchFilter = allViews.some(
      (s) => SavedViewUtil.getFilteredViews(s, state.searchFilter, state.searchTags).length !== 0,
    );
    const someDesktopViewsMatchFilter = allDesktopViews
      ? SavedViewUtil.getFilteredViews(allDesktopViews, state.searchFilter, state.searchTags).length !== 0
      : [];
    noResultsFromFiltering = !someDesktopViewsMatchFilter && !someSavedViewsMatchFilter;
  }

  return {
    searchFilter,
    noResultsFromFiltering,
    thereIsASearchFilter,
    userId,
    groups,
    connection,
  };
};

const connector = connect(mapState, {});

type PropsFromRedux = ConnectedProps<typeof connector>;
type Props = PropsFromRedux & GroupListProps;

class GroupList extends Component<Props> {
  constructor(props: Props) {
    super(props);
  }
  private mapGroupAndViewsToComponent(group: LegacyGroup) {
    return (
      <GroupItem
        group={group}
        key={group.id}
        groupListContainerRef={this.props.groupListContainerRef}
        want2dViews={this.props.want2dViews}
        additionalGroupContextMenuItems={
          this.props.additionalGroupContextMenuItems
        }
        additionalSavedViewContextMenuItems={
          this.props.additionalSavedViewContextMenuItems
        }
      />
    );
  }

  private getRenderableGroups() {
    return Object.values(this.props.groups).map(this.mapGroupAndViewsToComponent, this);
  }

  public override render(): React.ReactNode {
    const renderableGroups = this.getRenderableGroups();
    const noSearchResultsMessage =
      SavedViewsManager.translate("listTools.error_nosearchresults") +
      "'" +
      this.props.searchFilter +
      "'.";

    return (
      <>
        {!(
          !!this.props.thereIsASearchFilter && this.props.noResultsFromFiltering
        ) && renderableGroups}
        {!!this.props.thereIsASearchFilter &&
          this.props.noResultsFromFiltering && (
            <div className="itwin-saved-views-view-list-nosearchresults">
              {noSearchResultsMessage}
            </div>
          )}
      </>
    );
  }
}

export default connector(GroupList);
