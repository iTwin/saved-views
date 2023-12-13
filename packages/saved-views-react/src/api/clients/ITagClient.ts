/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { type IModelConnection } from "@itwin/core-frontend";

import { type ReadOnlyTag, type LegacyTag } from "../utilities/SavedViewTypes";

export abstract class AbstractTagClient {
  abstract getTagsOnModel(): Promise<LegacyTag[]>;
  abstract updateTagsOnModel(
    iModelConnection: IModelConnection,
    currentTags: LegacyTag[],
    newTags: LegacyTag[]
  ): Promise<LegacyTag[]>;
}

export interface ITagClient extends AbstractTagClient {
  deleteTag(tagId: string): Promise<void>;
  createTag(iModelConnection: IModelConnection, tag: LegacyTag): Promise<ReadOnlyTag>;
  updateTag(tagId: string, updatedTag: LegacyTag): Promise<LegacyTag>;
  getTags(iModelConnection: IModelConnection): Promise<LegacyTag[]>;
  getTag(tagId: string): Promise<LegacyTag>;
}
