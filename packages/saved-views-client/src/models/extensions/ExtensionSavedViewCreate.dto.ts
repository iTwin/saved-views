// Copyright (c) Bentley Systems, Incorporated. All rights reserved.
import { ExtensionBase } from "./Extension.dto";

/**
 * Extension data for savedViewCreate
 */
export interface ExtensionSavedViewCreate extends ExtensionBase {
  markdownUrl?: string;
  schemaUrl?: string;
  data: string;
}
