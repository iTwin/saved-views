/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import type { ViewData } from "@itwin/saved-views-client";
import type { ReactNode } from "react";

export interface SavedView {
  id: string;
  displayName: string;
  viewData?: ViewData | undefined;
  groupId?: string | undefined;
  creatorId?: string | undefined;
  tagIds?: string[] | undefined;
  shared?: boolean | undefined;
  thumbnail?: ReactNode | string | undefined;
  extensions?: SavedViewExtension[] | undefined;
  /** Time the saved view was created as an ISO8601 string, `"YYYY-MM-DDTHH:mm:ss.sssZ"` */
  creationTime?: string | undefined;
  /** Time the saved view was last modified as an ISO8601 string, `"YYYY-MM-DDTHH:mm:ss.sssZ"` */
  lastModified?: string | undefined;
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
  id: string;
  displayName: string;
}

export interface SavedViewGroup {
  id: string;
  displayName: string;
  creatorId?: string | undefined;
  shared?: boolean | undefined;
}

export type WriteableSavedViewProperties = Omit<SavedView, "id" | "creatorId" | "creationTime" | "lastModified">;
