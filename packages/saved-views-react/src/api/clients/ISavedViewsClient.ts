/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { type AccessToken } from "@itwin/core-bentley";
import { type IModelConnection } from "@itwin/core-frontend";

import {
  type SavedView, type SavedViewBase, type SavedViewBaseSetting, type SavedViewBaseUpdate,
} from "../utilities/SavedViewTypes";
import { CombinedId } from "./CombinedId";

/** Is a 3d saved view */
export function isSavedView3d(view: SavedViewBase | SavedViewBaseUpdate): view is SavedView {
  return !view.is2d;
}

/** Is a 3d spatial saved view */
export function isSpatialSavedView(view: SavedViewBase) {
  return (
    (view.is2d === undefined || !view.is2d) && "modelSelectorProps" in view
  );
}

/** Is a 2d drawing saved view */
export function isDrawingSavedView(view: SavedViewBase) {
  return view.is2d !== undefined && view.is2d && !("sheetProps" in view);
}

/** Is a 2d sheet saved view */
export function isSheetSavedView(view: SavedViewBase) {
  return view.is2d !== undefined && view.is2d && "sheetProps" in view;
}

/** Is id from a legacy comboId */
export function isLegacy(id: string): boolean {
  const sep = CombinedId.separate(id);
  return sep === undefined || sep.source !== 0;
}

/**
 * SavedViews Client Interface
 */
export interface ISavedViewsClient {
  /** Get view setting containing the saved view data */
  getViewSetting: (
    id: string,
    projectId: string,
    iModelId: string | undefined,
    namespace: string,
    applicationSpecific?: boolean,
    applicationIds?: string[]
  ) => Promise<SavedViewBaseSetting>;

  /** Get the full view object from the service by joining the two view setting and thumbnail into a single object */
  getView: (
    id: string,
    projectId: string,
    iModelId: string | undefined,
    savedViewNamespace: string,
    thumbnailNamespace?: string,
    applicationSpecific?: boolean,
    applicationIds?: string[]
  ) => Promise<SavedViewBase>;

  /**
   * Creates a saved view in the Product Settings
   * @param iModelConnection connnection to the iModel
   * @param savedView saved view
   * @param saveThumbnail true to save the thumbnail in Product Settings (at the thumbnailNamespace)
   * @param savedViewNamespace namespace for the saved view (defaults to "designreview-SavedViews")
   * @param thumbnailNamespace namespace for the thumbnail (defaults to "designreview-Thumbnails")
   * @returns The SavedView instance created
   */
  createSavedView: (
    iModelConnection: IModelConnection,
    savedView: SavedViewBase,
    saveThumbnail?: boolean,
    savedViewNamespace?: string,
    thumbnailNamespace?: string,
    applicationSpecific?: boolean
  ) => Promise<SavedViewBase>;

  /**
   * Creates a saved view in the Product Settings
   * @param projectId project Id
   * @param iModelId iModel Id
   * @param savedView saved view
   * @param saveThumbnail true to save the thumbnail in Product Settings (at the thumbnailNamespace)
   * @param savedViewNamespace namespace for the saved view (defaults to "designreview-SavedViews")
   * @param thumbnailNamespace namespace for the thumbnail (defaults to "designreview-Thumbnails")
   * @returns The SavedView instance created
   */
  createSavedViewByIds: (
    projectId: string,
    iModelId: string | undefined,
    savedView: SavedViewBase,
    saveThumbnail: boolean,
    savedViewNamespace?: string,
    thumbnailNamespace?: string,
    applicationSpecific?: boolean,
    applicationIds?: string[]
  ) => Promise<SavedViewBase>;

  /**
   * Updates the Saved View instance with the passed view state
   * Bumps the revision number in the groupLabel field, needed for Navigator Desktop's re-extraction logic
   * @param accessToken token to use
   * @param data updated SavedViewData
   * @param view SavedView "instance" to be updated
   * @returns Updated saved view
   */
  updateSavedView: (
    iModelConnection: IModelConnection,
    updatedView: SavedViewBaseUpdate,
    oldView: SavedViewBase
  ) => Promise<SavedViewBase>;

  /**
   * Delete a saved view in user or shared space depending on view.shared
   * @param iModelConnection connection to the imodel
   * @param view SavedView instance to delete
   */
  deleteSavedView: (
    iModelConnection: IModelConnection,
    view: SavedViewBase
  ) => Promise<void>;

  /**
   * Delete a saved view in user or shared space depending on view.shared
   * @param iModelConnection connection to the imodel
   * @param shared is the saved view shared
   * @param viewId view to delete
   * @param viewSettingsNamespace namespace of the view settings
   * @param thumbnailId thumbnail to delete (optional)
   * @param thumbnailNamespace namespace of the thumbnail settings
   */
  deleteSavedViewByIds: (
    iModelConnection: IModelConnection,
    shared: boolean,
    viewId: string,
    viewSettingsNamespace?: string,
    thumbnailId?: string,
    thumbnailNamespace?: string,
    applicationSpecific?: boolean,
    applicationIds?: string[]
  ) => Promise<void>;

  /**
   * Share a view definition with other users (simply sets a flag on the instance)
   * @param view Saved View instance will be shared/unshared
   * @param shared boolean determining if the view is shared or not
   * @return Updated saved view
   */
  shareView: (
    iModelConnection: IModelConnection,
    view: SavedViewBase,
    shared: boolean
  ) => Promise<SavedViewBase>;

  /**
   * Gets saved views that this user can access
   * These are the ones created by the current user and the shared views in the iModel
   * @param iModelConnection connnection to the iModel
   * @param savedViewNamespace namespace for the saved view (defaults to "designreview-SavedViews")
   * @param thumbnailNamespace namespace for the thumbnail (defaults to "designreview-Thumbnails")
   * @returns Array of SavedView objects
   */
  getSavedViews: (
    iModelConnection: IModelConnection,
    savedViewNamespace?: string,
    thumbnailNamespace?: string,
    applicationSpecific?: boolean,
    applicationIds?: string[]
  ) => Promise<SavedViewBase[]>;

  /**
   * Gets saved views that this user can access
   * These are the ones created by the current user and the shared views in the iModel
   * @param projectId project id of the iModel
   * @param imodelId id of the iModel
   * @param isBlank is iModel blank
   * @param savedViewNamespace namespace for the saved view (defaults to "designreview-SavedViews")
   * @param thumbnailNamespace namespace for the thumbnail (defaults to "designreview-Thumbnails")
   * @returns Array of SavedView objects
   */
  getSavedViewsFromIds: (
    projectId: string,
    iModelId?: string,
    isBlank?: boolean,
    savedViewNamespace?: string,
    thumbnailNamespace?: string,
    applicationSpecific?: boolean,
    applicationIds?: string[],
    getAccessToken?: () => Promise<AccessToken>
  ) => Promise<SavedViewBase[]>;
}
