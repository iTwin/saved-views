// Copyright (c) Bentley Systems, Incorporated. All rights reserved.
import { BeEvent } from "@itwin/core-bentley";

import { type Tag } from "./utilities/SavedViewTypes";

export class TagManager {
  public static readonly onTagsChanged = new BeEvent<(tags: Tag[]) => void>();
}
