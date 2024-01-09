/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import type { ReactNode } from "react";

export interface SavedView {
  id: string;
  displayName: string;
  groupId?: string | undefined;
  tagIds?: string[] | undefined;
  shared?: boolean | undefined;
  thumbnail?: ReactNode | string | undefined;
}

export interface SavedViewTag {
  id: string;
  displayName: string;
}

export interface SavedViewGroup {
  id: string;
  displayName: string;
  shared?: boolean | undefined;
}
