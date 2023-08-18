// Copyright (c) Bentley Systems, Incorporated. All rights reserved.
import { Link } from "../Links.dto";

/**
 * Saved view metadata model for restful get saved view operations following Apim standards.
 */
export interface ExtensionListItem extends Link {
  extensionName: string;
}
