// Copyright (c) Bentley Systems, Incorporated. All rights reserved.
import { ExtensionListItem } from "./ExtensionListItem.dto";

/**
 * Extension list response model for restful get all Extensions operations.
 */
export interface ExtensionListResponse {
  extensions: ExtensionListItem[];
}
