/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { BeEvent } from "@itwin/core-bentley";

import { type LegacyTag } from "./utilities/SavedViewTypes";

export class TagManager {
  public static readonly onTagsChanged = new BeEvent<(tags: LegacyTag[]) => void>();
}
