// Copyright (c) Bentley Systems, Incorporated. All rights reserved.
import { Group } from "./Group.dto";

/**
 * Group response model for restful get Group operations following APIM standards.
 */
export interface GroupResponse {
  group: Group;
}
