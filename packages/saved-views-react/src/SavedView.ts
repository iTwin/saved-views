/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import type { ViewITwin3d, ViewITwinDrawing, ViewITwinSheet } from "@itwin/saved-views-client";

export interface SavedView {
  savedViewId: string;
  displayName: string;
  groupId?: string | undefined;
  creatorId?: string | undefined;
  tagIds?: string[] | undefined;
  shared?: boolean | undefined;
  creationTime?: Date | undefined;
  lastModified?: Date | undefined;
}

export interface SavedViewData {
  viewData: ViewData;
  extensions?: SavedViewExtension[] | undefined;
}

export type ViewData = ITwin3dViewData | ITwinDrawingdata | ITwinSheetData;

export interface ITwin3dViewData extends ViewITwin3d {
  type: "iTwin3d";
}

export interface ITwinDrawingdata extends ViewITwinDrawing {
  type: "iTwinDrawing";
}

export interface ITwinSheetData extends ViewITwinSheet {
  type: "iTwinSheet";
}

export interface SavedViewExtension {
  /** Extension identifier. Saved View cannot contain multiple extensions that share the same `extensionName`. */
  extensionName: string;

  /**
   * Serialized extension data.
   *
   * @example
   * const extension = {
   *   // Unique identifier makes extension data format portable between applications because it avoids collision
   *   // with different implementations
   *   extensionName: "CustomHighlight_$5be36494-ae03-4400-bb80-24ffd9db2a87",
   *   data: JSON.stringify({
   *     description: "For illustrative purposes only. We do not provide implementation for this extensionName."
   *     highlightColor: "#f05599",
   *     models: ["0x20000000006"],
   *   }),
   * };
   */
  data: string;
}

export interface SavedViewTag {
  tagId: string;
  displayName: string;
}

export interface SavedViewGroup {
  groupId: string;
  displayName: string;
  creatorId?: string | undefined;
  shared?: boolean | undefined;
}

export type WriteableSavedViewProperties = Pick<SavedView, "displayName" | "groupId" | "tagIds" | "shared">;
