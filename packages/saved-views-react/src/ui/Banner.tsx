/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { UiFramework } from "@itwin/appui-react";
import { Guid, Logger } from "@itwin/core-bentley";
import { SvgCamera, SvgCloseSmall, SvgFolderAdd, SvgTag } from "@itwin/itwinui-icons-react";
import { ComboBox, IconButton } from "@itwin/itwinui-react";
import * as React from "react";
import { ReactElement, useEffect, useState } from "react";
import { connect, type ConnectedProps } from "react-redux";
import { animated, useSpring } from "react-spring";

import { IModelConnectionCache } from "../api/caches/IModelConnectionCache";
import { SavedViewsManager } from "../api/SavedViewsManager";
import { TagManager } from "../api/TagManager";
import type { LegacyGroup, LegacySavedViewBase, LegacyTag } from "../api/utilities/SavedViewTypes";
import { SavedViewUtil } from "../api/utilities/SavedViewUtil";
import { usePreferredViewport } from "../hooks/usePreferredViewport";
import {
  addSearchTag, removeSearchTag, setGroupOpen, setRenaming, setSearchFilter, type SavedViewsState,
} from "../store/SavedViewsStateReducer";
import BannerContextMenu from "./BannerContextMenu";
import { createNewSavedView } from "./createNewSavedView";
import MoveViewsDialog from "./grouplist/groupitem/MoveViewsDialog";
import type { MenuItem } from "./popupmenu/PopupMenuItem";

import "./Banner.scss";

interface BannerProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contextMenuViewportRef?: React.RefObject<any>;
  savedViewsApplyViewSettings?: boolean;
  want2dViews?: boolean;
  /** Flag for showing the "Show Everything" option in settings. If not provided default will be true and it will show this option */
  showShowEverythingOption?: boolean;
  additionalContextMenuItems?: MenuItem[];
  enableShowModelsCategoriesNotHiddenOption?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapState = (rootState: any) => {
  const state: SavedViewsState =
    rootState[SavedViewsManager.savedViewsStateKey];

  const thereAreSelectedViews = state.selectedViews.length > 0;
  const connection = state.iModel;
  const userId = SavedViewsManager.userId;
  const searchFilter = state.searchFilter;
  const searchTags = state.searchTags;

  return {
    searchFilter,
    thereAreSelectedViews,
    connection,
    userId,
    searchTags,
  };
};

const connector = connect(mapState, {
  setGroupOpen,
  setRenaming,
  setSearchFilter,
  removeSearchTag,
  addSearchTag,
});

type PropsFromRedux = ConnectedProps<typeof connector>;

type Props = PropsFromRedux & BannerProps;

const minSearchBarWidth = "0%";
const maxSearchBarWidth = "100%";

export function Banner(props: Props) {
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [creatingView, setCreatingView] = useState(false);
  const [searchString, setSearchString] = useState("");
  const [searchBarOpen, setSearchBarOpen] = useState(false);
  const [tagsOnModel, setTagsOnModel] = useState<LegacyTag[]>([]);

  const [searchBarSpringProps, updateSearchBarSpringProps] = useSpring(() => ({
    from: {
      width: minSearchBarWidth,
    },
    config: {
      tension: 250,
      clamp: true,
    },
  }));

  const vp = usePreferredViewport();

  const closeSearch = () => {
    updateSearchBarSpringProps({
      to: { width: minSearchBarWidth },
      onRest: () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((searchBarSpringProps as any).width.getValue() === minSearchBarWidth) {
          setSearchBarOpen(false);
        }
      },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  };

  const openSearch = () => {
    setSearchBarOpen(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateSearchBarSpringProps({ to: { width: maxSearchBarWidth } } as any);
  };

  useEffect(() => {
    const onTagsChangedListener = (tags: LegacyTag[]) => {
      setTagsOnModel(tags);
    };
    return TagManager.onTagsChanged.addListener(onTagsChangedListener);
  });

  useEffect(() => {
    const getAllTags = async () => {
      const allTags = await SavedViewsManager.tagClient.getTagsOnModel();
      setTagsOnModel(allTags);
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    getAllTags();
  }, []);

  const handleCreateView = async () => {
    setCreatingView(true);

    try {
      await createNewSavedView({
        iModel: props.connection ?? undefined,
        userId: props.userId ?? undefined,
        shared: false,
        vp,
        want2dViews: props.want2dViews,
        handleTooManyEmphasizedElements:
          SavedViewsManager.flags.handleTooManyEmphasizedElements,
        onSuccess: (savedViewData: LegacySavedViewBase) => {
          props.setGroupOpen({
            groupId: SavedViewsManager.ungroupedId,
            opened: true,
          });
          props.setRenaming({ id: savedViewData.id, renaming: true });
          setCreatingView(false);
        },
        onCancel: () => setCreatingView(false),
        onError: (_savedViewData: LegacySavedViewBase, _ex: Error) => {
          SavedViewUtil.showError("Banner", "listTools.error_createView_brief", "listTools.error_createView");
          setCreatingView(false);
        },
        onTooLarge: (_savedViewData: LegacySavedViewBase) => {
          SavedViewUtil.showError("Banner", "listTools.error_tooLarge_brief", "listTools.error_tooLarge");
          setCreatingView(false);
        },
      });

      SavedViewsManager.usageTracking?.trackCreateUsage?.();
    } catch (ex) {
      let error = "Unknown Error";
      if (ex instanceof Error) {
        error = ex.message;
      } else if (typeof ex === "string") {
        error = ex;
      }
      Logger.logError("ITwinSavedViews", error);
    }
  };

  const handleGroupAdd = () => {
    if (!props.connection) {
      throw new Error("iModelConnection is undefined");
    }

    const cache = IModelConnectionCache.getGroupCache(props.connection);
    const name = cache.getNewGroupName() ?? "";

    const group: LegacyGroup = {
      name,
      id: Guid.createValue(),
      shared: false,
      userId: props.userId,
    };

    setCreatingGroup(true);

    cache
      .createGroup(props.connection, group)
      .then((newGroup: LegacyGroup) => {
        props.setRenaming({ id: newGroup.id, renaming: true });
      })
      .catch((_error: Error) => {
        SavedViewUtil.showError("Banner", "groups.error_createGroup_brief", "groups.error_createGroup");
      })
      .then(() => {
        setCreatingGroup(false);
      })
      .catch((_error: Error) => {
        return;
      });
  };

  const handleViewMove = () => {
    UiFramework.dialogs.modal.open(<MoveViewsDialog />);
  };

  const handleTypeaheadKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.stopPropagation();
      props.setSearchFilter(e.currentTarget.value);

      // Selecting the tag is the default behavior of the typeahead so nothing to do here
      closeSearch();
    }
  };

  const createANewSavedView = SavedViewsManager.translate("groups.message_createASavedView");
  const moveViews = SavedViewsManager.translate("groups.moveViews");
  const createAGroup = SavedViewsManager.translate("groups.message_createAGroup");

  const newSavedViewButtonDisabled = creatingView || !!props.searchFilter;
  const createAGroupButtonDisabled = creatingGroup || !!props.searchFilter;
  const moveViewButtonDisabled =
    !props.thereAreSelectedViews || !!props.searchFilter;

  return (
    <div className="itwin-saved-views-banner">
      {/* Yellow "Results for:" banner */}
      {(props.searchTags.length > 0 || props.searchFilter) && (
        <div className="results-banner">
          <span className="results-banner-text">
            {SavedViewsManager.translate("groups.resultsFor")}
          </span>
          <span className="results-banner-tag-list">
            {props.searchTags.map((tag) => (
              <span key={tag} className="results-banner-tag">
                <span className="results-banner-tag-icon">
                  <SvgTag height="1em" />
                </span>
                <span className="results-banner-tag-text">{tag}</span>
                <span
                  className="results-banner-x-icon"
                  onClick={() => props.removeSearchTag(tag)}
                >
                  <SvgCloseSmall height="1em" />
                </span>
              </span>
            ))}
            {props.searchFilter && (
              <span className="results-banner-tag">
                <span className="results-banner-tag-text">
                  &apos;{props.searchFilter}&apos;
                </span>
                <span
                  className="results-banner-x-icon"
                  onClick={() => props.setSearchFilter("")}
                >
                  <SvgCloseSmall height="1em" />
                </span>
              </span>
            )}
          </span>
        </div>
      )}

      <div className="banner-container-1">
        {/* Typeahead search bar */}
        {searchBarOpen ? (
          <animated.div style={searchBarSpringProps}>
            <ComboBox
              dropdownMenuProps={{ appendTo: "parent" }}
              className="banner-typeahead"
              options={tagsOnModel
                .filter((t) => !props.searchTags.includes(t.name))
                .sort((a, b) => a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase()))
                .map((t) => {
                  return { label: t.name, value: t.name };
                })}
              filterFunction={(opts, value) => {
                const filteredOptions = opts.filter(
                  (option) =>
                    option.label.toLocaleLowerCase().includes(value.toLocaleLowerCase())
                    || option.value.toString().toLocaleLowerCase().includes(value.toLocaleLowerCase()),
                );
                return filteredOptions;
              }}
              onChange={(tag: string) => {
                if (tag) {
                  props.addSearchTag(tag);
                }
              }}
              inputProps={{
                placeholder: SavedViewsManager.translate("groups.search"),
                onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) =>
                  handleTypeaheadKeyDown(e),
                onInput: (e: React.FormEvent<HTMLInputElement>) => {
                  setSearchString(e.currentTarget.value);
                },
                value: searchString,
              }}
              emptyStateMessage={SavedViewsManager.translate("groups.noTags")}
            />
          </animated.div>
        ) : (
          <div className="banner-container-left">
            <IconButton
              size="small"
              styleType="borderless"
              disabled={creatingView || !!props.searchFilter}
              onClick={
                !newSavedViewButtonDisabled ? handleCreateView : undefined
              }
              title={createANewSavedView}
            >
              <SvgCamera />
            </IconButton>
            <IconButton
              size="small"
              styleType="borderless"
              disabled={createAGroupButtonDisabled}
              onClick={!createAGroupButtonDisabled ? handleGroupAdd : undefined}
              title={createAGroup}
            >
              <SvgFolderAdd />
            </IconButton>
            <IconButton
              size="small"
              styleType="borderless"
              disabled={moveViewButtonDisabled}
              onClick={moveViewButtonDisabled ? undefined : handleViewMove}
              title={moveViews}
            >
              <SvgSavedViewsMove />
            </IconButton>
          </div>
        )}

        <div className="banner-container-right">
          <div
            className="core-searchbox-button"
            onClick={() => {
              if (searchBarOpen) {
                closeSearch();
              } else {
                openSearch();
              }
            }}
            role="button"
            tabIndex={-1}
            title={SavedViewsManager.translate("groups.search")}
          >
            <span
              className={
                `core-searchbox-icon icon ${!searchBarOpen ? "icon-search" : ""} ${searchBarOpen ? "icon-close" : ""}`
              }
            />
          </div>

          <BannerContextMenu
            contextMenuViewportRef={props.contextMenuViewportRef}
            savedViewsApplyViewSettings={props.savedViewsApplyViewSettings}
            showShowEverythingOption={props.showShowEverythingOption}
            additionalContextMenuItems={props.additionalContextMenuItems}
            enableShowModelsCategoriesNotHiddenOption={
              props.enableShowModelsCategoriesNotHiddenOption
            }
          />
        </div>
      </div>
    </div>
  );
}

export default connector(Banner);

function SvgSavedViewsMove(): ReactElement {
  return (
    <svg viewBox="0 0 16 16">
      <path d="M3.667 5.625L2 7.875h3.333l-1.666-2.25zM6.201 7.875h3.81L7 3.375 5.043 6.311zM2 8.25h8.011l-.75.75H2.75z" />
      <path d="M6 11H3.75L1 8.25v-4.5L3.75 1h4.5L11 3.75v4.023l1 .711V.75a.75.75 0 00-.75-.75H.75A.75.75 0 000 .75v10.5a.75.75 0 00.75.75H6z" />
      <path d="M16 12.556L11 9v2H7v3h4v2z" />
    </svg>
  );
}
