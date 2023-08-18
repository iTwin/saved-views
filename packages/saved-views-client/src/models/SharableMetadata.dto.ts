// Copyright (c) Bentley Systems, Incorporated. All rights reserved.
import { CommonMetadata } from "./CommonMetadata.dto";

/**
 * Shared property, common to saved view and group.
 */
export interface SharableMetadata extends CommonMetadata {
  shared: boolean;
}
