/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { HalLinks } from "./Links.js";

export interface Group {
  id: string;
  displayName: string;
  shared: boolean;
  _links: HalLinks<["savedViews", "iTwin"?, "project"?, "iModel"?, "creator"?]>;
}
