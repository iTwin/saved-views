/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import type { ReactNode } from "react";

export interface SavedView {
  id: string;
  displayName: string;
  groupId?: string | undefined;
  creatorId?: string | undefined;
  tagIds?: string[] | undefined;
  shared?: boolean | undefined;
  thumbnail?: ReactNode | string | undefined;
  /** `extensionName` and `data` pairs. */
  extensions?: Map<string, string> | undefined;
  /** Time the saved view was created as an ISO8601 string, `"YYYY-MM-DDTHH:mm:ss.sssZ"` */
  creationTime?: string;
  /** Time the saved view was last modified as an ISO8601 string, `"YYYY-MM-DDTHH:mm:ss.sssZ"` */
  lastModified?: string;
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
