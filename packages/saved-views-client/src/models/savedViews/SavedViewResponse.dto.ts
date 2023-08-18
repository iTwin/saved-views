// Copyright (c) Bentley Systems, Incorporated. All rights reserved.
import { SavedViewWithData } from "./SavedViewWithData.dto";

/**
 * Saved view response model following APIM structure.
 */
export interface SavedViewResponse {
  savedView: SavedViewWithData;
}
