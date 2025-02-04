/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { SvgAdd, SvgBlank, SvgCheckmarkSmall, SvgRename, SvgShare } from "@itwin/itwinui-icons-react";
import { Input, MenuItem, Text } from "@itwin/itwinui-react";
import Fuse from "fuse.js";
import { useMemo, useState, type ChangeEvent, type ComponentProps, type ReactElement, type ReactNode } from "react";

import { LayeredMenuItem } from "../LayeredDropdownMenu/LayeredDropdownMenu.js";
import type { SavedViewGroup, SavedView, SavedViewTag } from "../SavedView.js";
import { useSavedViewsContext } from "../SavedViewsContext.js";
import { trimInputString } from "../utils.js";
import { useSavedViewTileContext } from "./SavedViewTileContext.js";

import "./SavedViewOptions.css";

/**
 * A collection of useful menu items for {@linkcode SavedViewTile}.
 *
 * @example
 * <SavedViewTile
 *   savedView={savedView}
 *   options={(close) => [<SavedViewOptions.Rename key="rename" icon={<SvgBlank />} onClick={close} />]}
 *   onRename={handleRename}
 * />
 */
export const SavedViewOptions = {
  /**
   * When activated, makes Saved View title enter editable state. Has no effect if the {@linkcode SavedViewTile} does
   * not receive `onRename` prop.
   *
   * @example
   * <SavedViewTile
   *   savedView={savedView}
   *   options={(close) => [<SavedViewOptions.Rename key="rename" icon={<SvgBlank />} onClick={close} />]}
   *   onRename={handleRename}
   * />
   */
  Rename,

  /**
   * Displays a control for moving Saved View to a group.
   *
   * @example
   * <SavedViewOptions.MoveToGroup
   *   groups={groups}
   *   moveToGroup={handleMoveToGroup}
   *   moveToNewGroup={handleMoveTo}
   *   icon={<SvgBlank />}
   * />
   */
  MoveToGroup,

  /**
   * Displays a control for managing Saved View tags.
   *
   * @example
   * <SavedViewOptions.ManageTags
   *   tags={tags}
   *   addTag={handleAddTag}
   *   addNewTag={handleAddNewTag}
   *   removeTag={handleRemoveTag}
   *   icon={<SvgBlank />}
   * />
   */
  ManageTags,

  /**
   * Displays option for Saved View deletion.
   *
   * @example
   * <SavedViewOptions.Delete
   *  icon={<SvgBlank />}
   *  deleteSavedView={handleDeleteSavedView}
   * />
   */
  Delete,
};

export interface CreateSavedViewOptionsParams {
  /** When `true`, the returned options contain a `Rename` entry. */
  renameSavedView?: boolean | undefined;

  /** When set, the returned options contain a `Move to group` entry. */
  groupActions?: OmitCommonOptionProps<ComponentProps<typeof SavedViewOptions.MoveToGroup>>;

  /** When set, the returned options contain a `Tags` entry. */
  tagActions?: OmitCommonOptionProps<ComponentProps<typeof SavedViewOptions.ManageTags>>;

  /** When set, the returned options contain a `Delete` entry. */
  deleteSavedView?: ComponentProps<typeof SavedViewOptions.Delete>["deleteSavedView"];
}

type OmitCommonOptionProps<T> = Omit<T, "icon">;

/**
 * Convenience function that returns an array populated with options to be used on {@linkcode SavedViewTile}. Available
 * options are determined by what data is present in the {@linkcode args} argument.
 *
 * @example
 * <SavedViewTile
 *   savedView={savedView}
 *   options={createSavedViewOptions({ tagActions, groupActions })}
 *   editable
 * />
 */
export function createSavedViewOptions(args: CreateSavedViewOptionsParams): (close: () => void) => ReactElement[] {
  return (close) => {
    const options: ReactElement[] = [];

    if (args.renameSavedView) {
      options.push(<SavedViewOptions.Rename key="rename" icon={<SvgRename />} onClick={close} />);
    }

    if (args.groupActions && args.groupActions) {
      options.push(
        <SavedViewOptions.MoveToGroup
          key="move"
          groups={args.groupActions.groups}
          moveToGroup={args.groupActions.moveToGroup}
          moveToNewGroup={args.groupActions.moveToNewGroup}
          icon={<SvgBlank />}
        />,
      );
    }

    if (args.tagActions && args.tagActions) {
      options.push(
        <SavedViewOptions.ManageTags
          key="tags"
          tags={args.tagActions.tags}
          addTag={args.tagActions.addTag}
          addNewTag={args.tagActions.addNewTag}
          removeTag={args.tagActions.removeTag}
          icon={<SvgBlank />}
        />,
      );
    }

    if (args.deleteSavedView) {
      options.push(<SavedViewOptions.Delete key="delete" icon={<SvgBlank />} deleteSavedView={args.deleteSavedView} />);
    }

    return options;
  };
}

interface RenameProps extends CommonOptionProps {
  /** Invoked after triggering the rename action. Often used to close the tile dropdown menu. */
  onClick?: (() => void) | undefined;
}

function Rename(props: RenameProps): ReactElement {
  const { setEditingName } = useSavedViewTileContext();
  const { localization } = useSavedViewsContext();

  const handleClick = () => {
    setEditingName(true);
    props.onClick?.();
  };

  return (
    <MenuItem className={props.className} startIcon={props.icon} onClick={handleClick}>
      {localization.rename}
    </MenuItem>
  );
}

interface MoveToGroupProps extends CommonOptionProps {
  /** Available Saved View groups to choose from. */
  groups: SavedViewGroup[];

  /**
   * Invoked when user selects a group from the supplied {@linkcode groups} list.
   * @param savedViewId Id of the associated Saved View.
   * @param groupId Id of the user-selected group.
   */
  moveToGroup: (savedViewId: string, groupId: string) => void;

  /**
   * When set, allows creation of new Saved View groups. Invoked when user submits a name for the new group.
   * @param savedViewId Id of the associated Saved View.
   * @param groupName User-submitted string for the new Saved View group.
   */
  moveToNewGroup?: ((savedViewId: string, groupName: string) => void) | undefined;
}

function MoveToGroup(props: MoveToGroupProps): ReactElement {
  const { savedView } = useSavedViewTileContext();
  const { localization } = useSavedViewsContext();

  return (
    <LayeredMenuItem
      className={props.className}
      icon={<SvgBlank />}
      content={
        <MoveToGroupSubmenu
          key="move"
          savedView={savedView}
          groups={props.groups}
          moveToGroup={props.moveToGroup}
          moveToNewGroup={props.moveToNewGroup}
        />
      }
    >
      {localization.moveToGroupMenu.moveToGroup}
    </LayeredMenuItem>
  );
}

interface MoveToGroupSubmenuProps {
  savedView: SavedView;
  groups: SavedViewGroup[];
  moveToGroup: (savedViewId: string, groupId: string) => void;
  moveToNewGroup?: ((savedViewId: string, groupName: string) => void) | undefined;
}

function MoveToGroupSubmenu(props: MoveToGroupSubmenuProps): ReactElement {
  const { localization: { moveToGroupMenu } } = useSavedViewsContext();

  const handleMoveToGroup = (groupId: string) => {
    props.moveToGroup(props.savedView.savedViewId, groupId);
  };

  const { moveToNewGroup } = props;
  const handleCreate = moveToNewGroup && ((groupName: string) => {
    moveToNewGroup(props.savedView.savedViewId, groupName);
  });

  return (
    <SearchableSubmenu
      collection={props.groups}
      indexer="groupId"
      placeholder={props.moveToNewGroup ? moveToGroupMenu.findOrCreateGroup : moveToGroupMenu.findGroup}
      creationLabel={moveToGroupMenu.createGroup}
      onCreate={handleCreate}
    >
      {(searchResults) =>
        searchResults.map((group) => (
          <MenuItem
            key={group.groupId}
            className="svr-searchable-submenu-item"
            startIcon={group.shared ? <SvgShare /> : <SvgBlank />}
            onClick={() => handleMoveToGroup(group.groupId)}
            disabled={group.groupId === props.savedView.groupId}
          >
            {group.displayName}
            {
              group.groupId === props.savedView.groupId &&
              <Text style={{ marginLeft: "var(--iui-size-xs)" }} as="span">{moveToGroupMenu.current}</Text>
            }
          </MenuItem>
        ))
      }
    </SearchableSubmenu>
  );
}

interface ManageTagsProps extends CommonOptionProps {
  /** Available Saved View tags to choose from. */
  tags: SavedViewTag[];

  /**
   * Invoked when user selects a tag from the supplied {@linkcode tags} list.
   * @param savedViewId Id of the associated Saved View.
   * @param tagId Id of the user-selected tag.
   */
  addTag: (savedViewId: string, tagId: string) => void;

  /**
   * When set, allows creation of new Saved View tags. Invoked when user submits a name for the new tag.
   * @param savedViewId Id of the associated Saved View.
   * @param tagName User-submitted string for the new Saved View tag.
   */
  addNewTag?: ((savedViewId: string, tagName: string) => void) | undefined;

  /**
   * Invoked when user selects a tag from the supplied {@linkcode tags} list.
   * @param savedViewId Id of the associated Saved View.
   * @param tagId Id of the user-selected tag.
   */
  removeTag: (savedViewId: string, tagId: string) => void;
}

function ManageTags(props: ManageTagsProps): ReactElement {
  const { savedView } = useSavedViewTileContext();
  const { localization } = useSavedViewsContext();

  return (
    <LayeredMenuItem
      className={props.className}
      icon={props.icon}
      content={
        <ManageTagsSubmenu
          key="tags"
          savedView={savedView}
          tags={props.tags}
          addTag={props.addTag}
          addNewTag={props.addNewTag}
          removeTag={props.removeTag}
        />
      }
    >
      {localization.tagsMenu.tags}
    </LayeredMenuItem>
  );
}

interface ManageTagsSubmenuProps {
  savedView: SavedView;
  tags: SavedViewTag[];
  addTag: (savedViewId: string, tagId: string) => void;
  addNewTag?: ((savedViewId: string, tagName: string) => void) | undefined;
  removeTag: (savedViewId: string, tagId: string) => void;
}

function ManageTagsSubmenu(props: ManageTagsSubmenuProps): ReactElement {
  const { localization } = useSavedViewsContext();

  const handleTagClick = (tagId: string) => {
    if (props.savedView.tagIds?.includes(tagId)) {
      props.removeTag(props.savedView.savedViewId, tagId);
    } else {
      props.addTag(props.savedView.savedViewId, tagId);
    }
  };

  const { addNewTag } = props;
  const handleCreate = addNewTag && ((tagName: string) => {
    addNewTag(props.savedView.savedViewId, tagName);
  });

  return (
    <SearchableSubmenu
      collection={props.tags}
      indexer="tagId"
      placeholder={props.addNewTag ? localization.tagsMenu.findOrCreateTag : localization.tagsMenu.findTag}
      creationLabel={localization.tagsMenu.createTag}
      onCreate={handleCreate}
    >
      {(searchResults) =>
        searchResults.map((tag) => (
          <MenuItem
            key={tag.tagId}
            className="svr-searchable-submenu-item"
            startIcon={props.savedView.tagIds?.includes(tag.tagId) ? <SvgCheckmarkSmall /> : <SvgBlank />}
            onClick={() => handleTagClick(tag.tagId)}
          >
            {tag.displayName}
          </MenuItem>
        ))
      }
    </SearchableSubmenu>
  );
}

interface SearchableSubmenuProps<T extends string, U> {
  collection: U[];
  indexer: T;
  placeholder: string;
  creationLabel: string;
  onCreate?: ((value: string) => void) | undefined;
  children: (searchResult: U[]) => ReactNode[];
}

type Indexable<T extends string> = { [K in T]: string; } & { displayName: string; };

function SearchableSubmenu<Indexer extends string, Collection extends Indexable<Indexer>>(
  props: SearchableSubmenuProps<Indexer, Collection>,
): ReactElement {
  const { localization } = useSavedViewsContext();

  const fuse = useMemo(
    () => new Fuse(props.collection, { keys: [props.indexer], threshold: 0.5 }),
    [props.collection, props.indexer],
  );

  const [inputValue, setInputValue] = useState("");
  const searchResults = useMemo(
    () => inputValue.length === 0 ? props.collection : fuse.search(inputValue, { limit: 6 }).map(({ item }) => item),
    [inputValue, props.collection, fuse],
  );

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const { onCreate } = props;
  const trimmedValue = trimInputString(inputValue);
  const offerCreate = onCreate && trimmedValue && !searchResults.find((result) => result.displayName === trimmedValue);
  const handleCreate = onCreate && (() => {
    setInputValue("");
    onCreate(trimmedValue);
  });

  return (
    <div className="svr-searchable-submenu">
      <Input
        className="svr-searchable-submenu-item"
        placeholder={props.placeholder}
        value={inputValue}
        onChange={handleSearchChange}
      />
      <div>
        {
          offerCreate &&
          <MenuItem className="svr-searchable-submenu-item" startIcon={<SvgAdd />} onClick={handleCreate}>
            {props.creationLabel}&nbsp;
            <Text className="svr-semibold" as="span">{trimmedValue}</Text>
          </MenuItem>
        }
        {props.children(searchResults)}
        {
          searchResults.length === 0 &&
          <MenuItem sublabel={localization.searchableMenu.noSearchResults} size="default" disabled />
        }
      </div>
    </div>
  );
}

interface DeleteProps extends CommonOptionProps {
  deleteSavedView: (savedViewId: string) => void;
}

function Delete(props: DeleteProps): ReactElement {
  const { savedView } = useSavedViewTileContext();
  const { localization } = useSavedViewsContext();

  return (
    <MenuItem
      className={props.className}
      startIcon={props.icon}
      onClick={() => props.deleteSavedView(savedView.savedViewId)}
    >
      {localization.delete}
    </MenuItem>
  );
}

interface CommonOptionProps {
  /** Icon to the left of this menu item. */
  icon?: ReactElement | undefined;

  /** Forwarded to the wrapping component. */
  className?: string | undefined;
}
