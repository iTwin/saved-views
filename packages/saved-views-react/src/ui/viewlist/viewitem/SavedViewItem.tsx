/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { IModelApp, NotifyMessageDetails, OutputMessagePriority } from "@itwin/core-frontend";
// TODO: Use Icon from @itwin/itwinui-react
import { Icon, LoadingSpinner, type CommonProps } from "@itwin/core-react";
import { SvgCrown } from "@itwin/itwinui-icons-react";
import { Checkbox, Input } from "@itwin/itwinui-react";
import { isURL } from "class-validator";
import React, { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { connect, type ConnectedProps } from "react-redux";

import { IModelConnectionCache } from "../../../api/caches/IModelConnectionCache";
import { SavedViewsManager } from "../../../api/SavedViewsManager";
import type { LegacySavedView, LegacySavedViewBase, LegacySavedViewBaseUpdate } from "../../../api/utilities/SavedViewTypes";
import { SavedViewUtil } from "../../../api/utilities/SavedViewUtil";
import { setRenaming, setViewSelected, type SavedViewsState } from "../../../store/SavedViewsStateReducer";
import SavedViewItemContextMenu, { type SavedViewContextMenuItemProps } from "./SavedViewItemContextMenu";

import "./ViewItem.scss";

/** Saved View Item Props */
export interface SavedViewItemProps extends CommonProps {
  /** Saved view definition */
  savedView: LegacySavedViewBase;
  draggableIndex: number;
  /** Called when the view is clicked */
  onClick: (savedView: LegacySavedViewBase) => Promise<void>;
  viewlistRef?: React.RefObject<HTMLDivElement>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  groupListRef?: React.RefObject<any>;
  additionalContextMenuItems?: SavedViewContextMenuItemProps[];
  enableApplyDefaultView?: boolean;
  defaultViewId?: string;
}

// redux setup
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapState = (rootState: any, props: SavedViewItemProps) => {
  const state: SavedViewsState =
    rootState[SavedViewsManager.savedViewsStateKey];

  const connection = state.iModel;
  const isSelected = !!state.selectedViews.find((s) => s.id === props.savedView.id);
  const renaming = state.renamedViews[props.savedView.id];
  const showThumbnails = state.showThumbnails;
  const enableApplyDefaultView = state.enableApplyDefaultView;
  const defaultViewId = state.defaultViewId;

  return {
    showThumbnails,
    renaming,
    connection,
    isSelected,
    enableApplyDefaultView,
    defaultViewId,
  };
};

const reduxConnector = connect(mapState, {
  setRenaming,
  setViewSelected,
});

type PropsFromRedux = ConnectedProps<typeof reduxConnector>;
type Props = PropsFromRedux & SavedViewItemProps;

/** Saved View Item */
function SavedViewItem({
  savedView,
  onClick,
  viewlistRef,
  groupListRef,
  connection,
  renaming,
  setRenaming,
  isSelected,
  setViewSelected,
  className,
  style,
  additionalContextMenuItems,
  enableApplyDefaultView,
  defaultViewId,
}: Props) {
  const [name, setName] = useState(savedView.name);
  const [showSpinner, setShowSpinner] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [thumbnail, setThumbnail] = useState<any>("");

  const viewRef = useRef<HTMLDivElement | null>(null);
  const unmountedRef = useRef<boolean>(false);
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      unmountedRef.current = true;
    };
  }, []);

  useEffect(() => {
    setName(savedView.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedView.id]);

  const isDefaultView = useMemo(() => {
    return defaultViewId === savedView.id;
  }, [defaultViewId, savedView]);

  useEffect(() => {
    if (!savedView.thumbnail) {
      return;
    }

    const fetchThumbnail = async (thumbnailUrl: string) => {
      if (
        SavedViewsManager.flags.usePublicReadWriteClient &&
        isURL(thumbnailUrl)
      ) {
        setThumbnail(thumbnailUrl);
        return;
      }
      const response = await fetch(thumbnailUrl);
      const blob = await response.blob();
      if (!unmountedRef.current) {
        setThumbnail(URL.createObjectURL(blob));
      }
    };

    // eslint-disable-next-line no-console
    fetchThumbnail(savedView.thumbnail).catch((error) => console.error(error));
  }, [savedView, setThumbnail]);

  const onTitleClicked = useCallback(() => {
    if (savedView.userId !== SavedViewsManager.userId && !SavedViewsManager.flags.allowSharedEdit) {
      return;
    }

    setRenaming({ id: savedView.id, renaming: true });

    const groupList = groupListRef?.current;
    const groupListRect = groupList.getBoundingClientRect();
    const viewItemRect = viewRef.current?.getBoundingClientRect();

    if (viewItemRect !== undefined) {
      groupList.animate({ scrollTop: viewItemRect.top - groupListRect.top }, 500);
    }
  }, [groupListRef, savedView.id, savedView.userId, setRenaming]);

  useEffect(() => {
    if (renaming) {
      onTitleClicked();

      const handleClickOutside = (event: MouseEvent) => {
        if (
          labelRef.current &&
          !labelRef.current.contains(event.target as Node) &&
          (event.target as Element).id !==
          "itwin-saved-views-view-item-label-name-field"
        ) {
          setRenaming({ id: savedView.id, renaming: false });
        }
      };

      document.body.addEventListener("click", handleClickOutside);

      return () => {
        document.body.removeEventListener("click", handleClickOutside);
      };
    }

    return;
  }, [renaming, savedView, setRenaming, labelRef, onTitleClicked]);

  const isCached = (savedView: LegacySavedViewBase) => {
    if (connection) {
      const cache = IModelConnectionCache.getSavedViewCache(connection);
      if (!cache) {
        return false;
      }
      return cache.isViewCached(savedView);
    } else {
      return false;
    }
  };

  const performRename = async () => {
    if (!connection) {
      return;
    }

    if (name === savedView.name) {
      return;
    }

    const cache = IModelConnectionCache.getSavedViewCache(connection);
    if (!cache) {
      return;
    }

    const views = await cache.getSavedViews(connection);
    for (const v of views) {
      if (name === v.name) {
        const brief = SavedViewsManager.translate("listTools.error_namedViewAlreadyExists_brief");
        const detailed
          = `${SavedViewsManager.translate("listTools.error_namedViewAlreadyExists_part1")} "${name}" ${SavedViewsManager.translate("listTools.error_namedViewAlreadyExists_part2")}`;
        IModelApp.notifications.outputMessage(new NotifyMessageDetails(OutputMessagePriority.Error, brief, detailed));
        setRenaming({ id: savedView.id, renaming: false });
        return;
      }
    }

    const oldSavedViewName = savedView.name;
    setRenaming({ id: savedView.id, renaming: false });

    const viewUpdate: LegacySavedViewBaseUpdate = { name, id: savedView.id };
    if (cache) {
      cache
        .updateSavedView(connection, viewUpdate, savedView)
        .then(() => { })
        .catch((e) => {
          SavedViewUtil.showError("GroupItem", "groups.error_viewRename_brief", "groups.error_viewRename", e);
          savedView.name = oldSavedViewName;
        });
    }
  };

  const isValidName = () => {
    return name !== null && name.match(/^ *$/) === null;
  };

  const handleChangeInRenameInput = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  /** Handle pressing enter */
  const handleKeyDownInRenameInput = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      if (isValidName()) {
        await performRename();
      }
    }

    return false;
  };

  const onThumbnailClick = async () => {
    if (isCached(savedView)) {
      await onClick(savedView);
    } else {
      // Show loading spinner while we process the saved view
      if (!unmountedRef.current) {
        setShowSpinner(true);
      }
      try {
        await onClick(savedView);
      } catch (e) {
        SavedViewUtil.showError(
          "SavedViewItem",
          "viewListComponent.error_invalidView",
          "viewListComponent.error_invalidView_detailed",
        );
      }

      // There's a possibility we will change frontstages before setting this state, avoid that
      if (!unmountedRef.current) {
        setShowSpinner(false);
      }
    }
  };

  const onCheckboxChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    setViewSelected({
      view: savedView as LegacySavedView,
      selected: e.target.checked,
    });
  };

  const onCheckboxClicked = (e: React.MouseEvent<Element>) => {
    e.stopPropagation();
  };

  const onBlur = async () => {
    if (isValidName()) {
      await performRename();
    }
  };

  const renderThumbnail = () => {
    const sharedTooltip = SavedViewsManager.translate("viewListComponent.public_tooltip");

    if (thumbnail === undefined || thumbnail === "") {
      return (
        <>
          <svg
            className="no-thumbnail"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            enableBackground="new 0 0 16 16"
          >
            <g>
              <path d="M10.3 5.9 7.7 9.3 6 7.6 3 11 13 11z" />
              <circle cx="4.4" cy="5.9" r="1.3" />
              <path d="M0,2v12h16V2H0z M14,12H2V4h12V12z" />
            </g>
          </svg>
          {savedView.shared && (
            <span
              className="icon icon-share saved-view-icon"
              title={sharedTooltip}
            />
          )}
        </>
      );
    } else {
      return (
        <>
          <img src={thumbnail} />
          {savedView.userId === SavedViewsManager.userId && (
            <Checkbox
              className={`toggle ${isSelected ? "checked" : ""}`}
              checked={isSelected}
              onChange={onCheckboxChanged}
              onClick={onCheckboxClicked}
            ></Checkbox>
          )}
          {savedView.shared && (
            <span
              className="icon icon-share saved-view-icon"
              title={sharedTooltip}
            />
          )}
          {showSpinner && (
            <div className="itwin-saved-views-spinner-overlay">
              <LoadingSpinner />
            </div>
          )}
        </>
      );
    }
  };

  const onContextMenuOpen = () => {
    if (viewlistRef && viewlistRef.current) {
      viewlistRef.current.style.zIndex = "10000";
    }
  };

  const onContextMenuClose = () => {
    if (viewlistRef && viewlistRef.current) {
      viewlistRef.current.style.zIndex = "auto";
    }
  };

  const defaultSaveViewTooltip = SavedViewsManager.translate("viewListComponent.defaultSavedView_tooltip");

  return (
    <div
      ref={viewRef}
      className={
        `itwin-saved-views-view-list-item-thumbnail ${isSelected ? "itwin-saved-views-view-list-item-highlight" : ""} ${className}`
      }
      style={style}
    >
      <div
        className="itwin-saved-views-view-item-thumbnail-container"
        onClick={onThumbnailClick}
      >
        {renderThumbnail()}
      </div>
      <div className="itwin-saved-views-view-item-label-thumbnail">
        {!renaming && (
          <>
            {enableApplyDefaultView && isDefaultView && (
              <div
                className="itwin-saved-views-default-icon"
                title={defaultSaveViewTooltip}
              >
                <Icon iconSpec={<SvgCrown />} />
              </div>
            )}
            <span
              className="label"
              id="itwin-saved-views-view-item-label-name-field"
              title={name}
              onClick={onTitleClicked}
            >
              {name}
            </span>
          </>
        )}
        {renaming && (
          <div className="group-name-edit-field" ref={labelRef}>
            <Input
              autoFocus={true}
              onChange={handleChangeInRenameInput}
              onKeyDownCapture={handleKeyDownInRenameInput}
              onFocus={(event) => event.target.select()}
              onBlur={onBlur}
              value={name}
            />
          </div>
        )}
        {!renaming && (
          <SavedViewItemContextMenu
            contextMenuViewportRef={groupListRef}
            savedView={savedView}
            onOpen={onContextMenuOpen}
            onClose={onContextMenuClose}
            handleRename={onTitleClicked}
            additionalContextMenuItems={additionalContextMenuItems}
            defaultViewToggleValue={isDefaultView}
          />
        )}
      </div>
    </div>
  );
}

export default reduxConnector(SavedViewItem);
