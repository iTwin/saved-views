/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { DialogButtonStyle, DialogButtonType } from "@itwin/appui-abstract";
import { UiFramework } from "@itwin/appui-react";
import { type IModelConnection } from "@itwin/core-frontend";
import { Dialog } from "@itwin/core-react";
import { type SelectOption } from "@itwin/itwinui-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { connect } from "react-redux";
import { components, createFilter, type ActionMeta } from "react-select";

import { SavedViewsManager } from "../../api/SavedViewsManager";
import { IModelConnectionCache } from "../../api/caches/IModelConnectionCache";
import type { Tag } from "../../api/types";
import { isReadOnlyTag, type LegacySavedViewBase } from "../../api/utilities/SavedViewTypes";
import { type SavedViewsState } from "../../store/SavedViewsStateReducer";
import { CreatableTypeahead } from "./CreatableTypeahead";
import { Pill } from "./Pill";

import "./TagManagementDialog.scss";

interface TagManagementDialogProps {
  savedView: LegacySavedViewBase;
  isSavedViewOwner: boolean;
  userId: string;
  iModelConn: IModelConnection | undefined;
}

const mapStateToProps = (rootState: unknown) => {
  const state = (rootState as Record<string, unknown>)[SavedViewsManager.savedViewsStateKey] as SavedViewsState;
  return {
    iModelConn: state.iModel,
    userId: SavedViewsManager.userId,
  };
};

const maxTagLength = 24;

/**
 * Allows the user to add or remove tags from a saved view
 *
 */
function TagManagementDialog({
  savedView,
  isSavedViewOwner,
  userId,
  iModelConn,
}: TagManagementDialogProps) {
  const [tagsOnModel, setTagsOnModel] = useState<Tag[]>([]);
  const [newTagsOnModel, setNewTagsOnModel] = useState<Tag[]>([]);
  const [tagsOnSV, setTagsOnSV] = useState<Tag[]>(savedView.tags ?? []);
  const typeaheadRef = useRef<HTMLElement>(null);
  const [inputValue, setInputValue] = useState<string | null>(null);

  if (!iModelConn) {
    throw new Error("iModelConnection is undefined");
  }

  const iModelConnCache = IModelConnectionCache.getSavedViewCache(iModelConn);

  useEffect(() => {
    const getAllTags = async () => {
      const allTags = await SavedViewsManager.tagClient.getTagsOnModel();
      setTagsOnModel(allTags);
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    getAllTags();
  }, []);

  const options = useMemo(
    () =>
      [...tagsOnModel, ...newTagsOnModel]
        .filter((modelTags) => tagsOnSV.findIndex((svTags) => svTags.name === modelTags.name) === -1)
        .sort((a, b) => a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase()))
        .map((t) => {
          return { label: t.name, value: t };
        }),
    [tagsOnModel, newTagsOnModel, tagsOnSV],
  );

  const clearSearch = () => {
    setInputValue(null);
    if (typeaheadRef.current) {
      typeaheadRef.current.blur();
      typeaheadRef.current.focus();
    }
  };

  const isOptionSelected = (option: SelectOption<Tag>) =>
    tagsOnSV.some((t) => t === option.value);

  const onChange = (option: SelectOption<Tag>, action: ActionMeta<SelectOption<Tag>>) => {
    switch (action.action) {
      case "set-value":
      case "select-option":
        if (!isSavedViewOwner) {
          return;
        }
        // Workaround for a bug with react-select 3.1.0: https://github.com/JedWatson/react-select/issues/4244
        if (typeof option.value === "string") {
          onCreateOption(option.value);
          return;
        }

        setTagsOnSV([...tagsOnSV, option.value]);
        break;
      case "remove-value":
      case "clear":
        clearSearch();
        break;
      default:
        break;
    }
  };

  const onInputChange = (input: string) => {
    if (input.length > maxTagLength) {
      setInputValue(input.substring(0, maxTagLength + 1));
    } else {
      setInputValue(input);
    }
  };

  const removeTagFromSV = (tagText: string) => {
    const updatedTagsOnSV = tagsOnSV.filter((tag: Tag) => tag.name !== tagText);
    const updatedNewTagsOnModel = newTagsOnModel.filter((tag: Tag) => tag.name !== tagText);
    setNewTagsOnModel(updatedNewTagsOnModel);
    setTagsOnSV(updatedTagsOnSV);
  };

  const removeAllTagFromSV = () => {
    setNewTagsOnModel([]);
    setTagsOnSV([]);
  };

  const onCreateOption = (newTagName: string) => {
    if ([...tagsOnModel, ...newTagsOnModel].some((t) => t.name === newTagName)) {
      return;
    }

    const newTag = {
      name: newTagName,
      createdByUserId: userId,
    };

    const updatedNewTagsOnModel = [...newTagsOnModel, newTag];
    const updatedTagsOnSV = [...tagsOnSV, newTag];
    setNewTagsOnModel(updatedNewTagsOnModel);
    setTagsOnSV(updatedTagsOnSV);
  };

  const handleSave = async () => {
    if (iModelConn) {
      const allTags = await SavedViewsManager.tagClient.updateTagsOnModel(iModelConn, tagsOnModel, newTagsOnModel);
      let updatedTagsOnSV = tagsOnSV;
      if (SavedViewsManager.flags.usePublicReadWriteClient) {
        // Update tagsOnSV to be ReadonlyTag type
        updatedTagsOnSV = tagsOnSV.map((tag) => {
          if (isReadOnlyTag(tag)) {
            return tag;
          }
          return allTags.find((roTag) => roTag.name === tag.name) ?? tag;
        });
        setTagsOnSV(updatedTagsOnSV);
      }
      await iModelConnCache?.updateSavedView(iModelConn, { tags: updatedTagsOnSV, id: savedView.id }, savedView);
    }
    UiFramework.dialogs.modal.close();
  };

  const handleClose = () => {
    UiFramework.dialogs.modal.close();
  };

  return (
    <Dialog
      title={
        isSavedViewOwner
          ? SavedViewsManager.translate("tagManagement.manageTags")
          : SavedViewsManager.translate("tagManagement.viewTags")
      }
      width={"500px"}
      height={"400px"}
      minHeight={"300px"}
      opened={true}
      movable={true}
      resizable={true}
      onClose={handleClose}
      buttonCluster={
        isSavedViewOwner
          ? [
            {
              type: DialogButtonType.OK,
              buttonStyle: DialogButtonStyle.Blue,
              onClick: handleSave,
              label: SavedViewsManager.translate("tagManagement.save"),
            },
            {
              type: DialogButtonType.Cancel,
              buttonStyle: DialogButtonStyle.Hollow,
              onClick: handleClose,
              label: SavedViewsManager.translate("tagManagement.cancel"),
            },
          ]
          : []
      }
    >
      <div className="saved-view-tags-container">
        <div className="saved-view-tags-header">
          <img src={savedView.thumbnail} />
          <span>{savedView.name}</span>
        </div>
        {isSavedViewOwner && (
          <div className="saved-view-tags-add">
            <CreatableTypeahead
              className="saved-view-tags-typeahead"
              filterOption={createFilter({
                stringify: (option) => `${option.label}`,
              })}
              options={options}
              ref={typeaheadRef}
              value={inputValue}
              inputValue={inputValue ?? undefined}
              components={{
                OptionComponent,
                NoOptionsMessage,
              }}
              placeholder={SavedViewsManager.translate("tagManagement.newTag")}
              hideSelectedOptions={true}
              isOptionSelected={isOptionSelected}
              onChange={onChange}
              onCreateOption={onCreateOption}
              onInputChange={onInputChange}
              isDisabled={!isSavedViewOwner}
            />
          </div>
        )}
        {tagsOnSV.length ? (
          <div className="saved-view-tags-list">
            {tagsOnSV.map((tag, index) => (
              <span key={index}>
                <Pill
                  text={tag.name}
                  rightIconSpec={isSavedViewOwner ? "icon-close" : undefined}
                  onRightIconClick={removeTagFromSV}
                />
              </span>
            ))}
            {isSavedViewOwner && (
              <span
                onClick={removeAllTagFromSV}
                className="saved-view-tags-remove-all"
              >
                {SavedViewsManager.translate("tagManagement.removeAll")}
              </span>
            )}
          </div>
        ) : (
          <div className="saved-view-tags-none">
            {SavedViewsManager.translate("tagManagement.noTags")}
          </div>
        )}
      </div>
    </Dialog>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function OptionComponent(props: any) {
  const { innerProps, innerRef } = props;
  return (
    <components.Option className="typeaheadUserOption" {...props}>
      <div {...innerProps} ref={innerRef}>
        {props.value}
      </div>
    </components.Option>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function NoOptionsMessage(props: any) {
  return (
    <components.NoOptionsMessage {...props}>
      {SavedViewsManager.translate("tagManagement.noResults")}
    </components.NoOptionsMessage>
  );
}

export default connect(mapStateToProps)(TagManagementDialog);
