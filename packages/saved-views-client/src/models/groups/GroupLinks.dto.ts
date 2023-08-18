// Copyright (c) Bentley Systems, Incorporated. All rights reserved.
import { Link, ResourceLinks } from "../Links.dto";

/**
 * Group links object
 */
export interface GroupLinks extends ResourceLinks {
  savedViews: Link;
}

/**
 * Group list links object
 */
export interface GroupListLinks {
  self: Link;
}
