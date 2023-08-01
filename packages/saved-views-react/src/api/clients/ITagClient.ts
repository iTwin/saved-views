// Copyright (c) Bentley Systems, Incorporated. All rights reserved.
import { type IModelConnection } from "@itwin/core-frontend";

import { type ReadOnlyTag, type Tag } from "../utilities/SavedViewTypes";

export const TagSettingsNames = "availableTags";

export abstract class AbstractTagClient {
  abstract getTagsOnModel(): Promise<Tag[]>;
  abstract updateTagsOnModel(
    iModelConnection: IModelConnection,
    currentTags: Tag[],
    newTags: Tag[]
  ): Promise<Tag[]>;
}

export interface ITagClient extends AbstractTagClient {
  deleteTag(tagId: string): Promise<void>;
  createTag(iModelConnection: IModelConnection, tag: Tag): Promise<ReadOnlyTag>;
  updateTag(tagId: string, updatedTag: Tag): Promise<Tag>;
  getTags(iModelConnection: IModelConnection): Promise<Tag[]>;
  getTag(tagId: string): Promise<Tag>;
}
