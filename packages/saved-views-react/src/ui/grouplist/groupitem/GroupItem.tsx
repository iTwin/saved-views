// Copyright (c) Bentley Systems, Incorporated. All rights reserved.
import { Icon, type CommonProps } from "@itwin/core-react";
import { Input } from "@itwin/itwinui-react";
import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { connect, type ConnectedProps } from "react-redux";

import { IModelConnectionCache } from "../../../api/caches/IModelConnectionCache";
import { SavedViewsManager } from "../../../api/SavedViewsManager";
import type { Group, GroupUpdate } from "../../../api/utilities/SavedViewTypes";
import { SavedViewUtil } from "../../../api/utilities/SavedViewUtil";
import {
  selectShouldGroupRenderSelector,
  selectViews,
} from "../../../store/SavedViewsGroupItemStateSelectors";
import {
  setGroupOpen,
  setRenaming,
  type SavedViewsState,
} from "../../../store/SavedViewsStateReducer";
import type { SavedViewContextMenuItemProps } from "../../viewlist/viewitem/SavedViewItemContextMenu";
import ViewsList from "../../viewlist/ViewsList";
import "./GroupItem.scss";
import GroupItemContextMenu, {
  type GroupItemContextMenuItemProps,
} from "./GroupItemContextMenu";

/** GroupItem widget props */
export interface GroupItemProps extends CommonProps {
  group: Group;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  groupListContainerRef?: React.RefObject<any>;
  want2dViews?: boolean;
  additionalGroupContextMenuItems?: GroupItemContextMenuItemProps[];
  additionalSavedViewContextMenuItems?: SavedViewContextMenuItemProps[];
}

// redux setup
const mapState = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (rootState: any, props: GroupItemProps) => {
    const state: SavedViewsState =
      rootState[SavedViewsManager.savedViewsStateKey];
    const searchFilterExists =
      state.searchFilter.length > 0 || state.searchTags.length > 0;
    const connection = state.iModel;
    const renaming = !!state.renamedViews[props.group.id];
    const views = selectViews(state, props);
    const shouldRenderGroup =
      selectShouldGroupRenderSelector(state, props) &&
      !(searchFilterExists && views.length === 0);
    const isGroupOpen = searchFilterExists
      ? true
      : !!state.openedGroups[props.group.id];

    const userId = SavedViewsManager.userId;

    return {
      userId,
      renaming,
      views,
      shouldRenderGroup,
      connection,
      searchFilterExists,
      isGroupOpen,
    };
  };
};

const reduxConnector = connect(mapState, {
  setGroupOpen,
  setRenaming,
});

type PropsFromRedux = ConnectedProps<typeof reduxConnector>;
type Props = PropsFromRedux & GroupItemProps;

/** Saved view group */
function GroupItem({
  group,
  isGroupOpen,
  renaming,
  searchFilterExists,
  setGroupOpen,
  userId,
  groupListContainerRef,
  setRenaming,
  connection,
  shouldRenderGroup,
  style,
  views,
  want2dViews,
  additionalSavedViewContextMenuItems,
  additionalGroupContextMenuItems,
}: Props) {
  const [name, setName] = useState(group.name);

  const groupHeaderRef = useRef<HTMLDivElement>(null);
  const groupAndViewsRef = useRef<HTMLDivElement>(null);
  const editFieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (renaming) {
      const groupItem = groupHeaderRef.current;
      const groupItemContainer = groupListContainerRef?.current;

      const scrollTop = groupItemContainer.scrollTop;

      if (groupItem !== null) {
        groupItemContainer.animate({ scrollTop: groupItem.offsetTop + scrollTop }, 500);
      }

      const handleClickOutside = (event: MouseEvent) => {
        if (
          editFieldRef.current &&
          !editFieldRef.current.contains(event.target as Node)
        ) {
          setRenaming({ id: group.id, renaming: false });
        }
      }

      document.body.addEventListener("click", handleClickOutside);

      return () => {
        document.body.removeEventListener("click", handleClickOutside);
      };
    }

    return;
  }, [group.id, groupListContainerRef, renaming, setRenaming]);

  const onListHeightDetermined = (height: number) => {
    if (
      !groupAndViewsRef ||
      !groupHeaderRef ||
      !groupHeaderRef.current ||
      !groupAndViewsRef.current
    ) {
      return;
    }

    const groupAndViewsContainerElement = groupAndViewsRef.current;
    const groupHeaderContainerElement = groupHeaderRef.current;

    if (isGroupOpen) {
      const groupHeaderContainerHeight =
        groupHeaderContainerElement.offsetHeight || 0;
      const adjustedHeight = height + groupHeaderContainerHeight;
      groupAndViewsContainerElement.style.height = adjustedHeight + "px";
    }
  };

  const onChevronClick = async () => {
    if (!searchFilterExists) {
      setGroupOpen({ groupId: group.id, opened: !isGroupOpen });
    }
  };

  const onTitleClicked = () => {
    if (
      group.id !== SavedViewsManager.ungroupedId &&
      group.id !== SavedViewsManager.desktopViewsGroupId &&
      group.userId === userId
    ) {
      setRenaming({ id: group.id, renaming: true });
    }
  };

  const handleRenameInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  /** Handle pressing enter */
  const handleKeyDownInRenameInput = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      setRenaming({ id: group.id, renaming: false });
      await performRename();
    }

    return false;
  };

  const performRename = async () => {
    if (isNameValid(name) && name !== group.name && connection) {
      const iModelConnection = connection;

      const cache = IModelConnectionCache.getGroupCache(iModelConnection);

      if (cache) {
        const groups = await cache.getGroups(iModelConnection);
        for (const g of groups) {
          if (name === g.name) {
            SavedViewUtil.showError(
              "GroupItem",
              "groups.error_namedGroupAlreadyExists_brief",
              "groups.error_namedGroupAlreadyExists",
            );
            setName(group.name);
            return;
          }
        }

        const updatedGroup: GroupUpdate = { name };

        cache
          .updateGroup(iModelConnection, updatedGroup, group)
          .catch((e) => {
            SavedViewUtil.showError(
              "GroupItem",
              "groups.error_groupRename_brief",
              "groups.error_groupRename",
              e,
            );

            setName(group.name);
          });
      }
    }
  };

  const publicGroupTitle = SavedViewsManager.translate("groups.message_publicGroup");

  return !shouldRenderGroup ? null : (
    <div
      ref={groupAndViewsRef}
      style={style}
      className={`group-and-views-container        ${isGroupOpen ? "fullsized" : ""}`}
    >
      <div className="group-header-container" ref={groupHeaderRef}>
        <div className="direction-icon" onClick={onChevronClick}>
          <Icon
            iconSpec={isGroupOpen ? "icon-chevron-down" : "icon-chevron-right"}
          ></Icon>
        </div>

        {renaming ? (
          <div className="group-name-edit-field" ref={editFieldRef}>
            <Input
              autoFocus={true}
              onChange={handleRenameInputChange}
              onKeyDownCapture={handleKeyDownInRenameInput}
              onFocus={(event) => event.target.select()}
              onBlur={performRename}
              value={name}
            />
          </div>
        ) : (
          <div className="group-name-and-total-views" onClick={onTitleClicked}>
            {group.name} {"(" + views.length + ")"}
          </div>
        )}

        <div
          className={`share-icon ${!group.shared ? "invisible" : ""}`}
          onClick={onChevronClick}
          title={publicGroupTitle}
        >
          <Icon iconSpec="icon icon-share"></Icon>
        </div>
        <GroupItemContextMenu
          group={group}
          handleRename={onTitleClicked}
          contextMenuViewportRef={groupListContainerRef}
          want2dViews={want2dViews}
          additionalContextMenuItems={additionalGroupContextMenuItems}
        />
      </div>
      {isGroupOpen && (
        <ViewsList
          listGridWidth={130}
          listGridHeight={130}
          groupListRef={groupListContainerRef}
          viewListRef={groupAndViewsRef}
          views={views}
          onListHeightDetermined={onListHeightDetermined}
          noViewsContent={
            <div className="noviews">
              <p>
                {SavedViewsManager.translate("groups.message_selectSavedViews")}
              </p>
            </div>
          }
          want2dViews={want2dViews}
          additionalContextMenuItems={additionalSavedViewContextMenuItems}
          isDesktopView={group.id === SavedViewsManager.desktopViewsGroupId}
        />
      )}
    </div>
  );
}

const isNameValid = (name: string) => {
  return name !== null && name.match(/^ *$/) === null;
};

export default reduxConnector(GroupItem);
