// Copyright (c) Bentley Systems, Incorporated. All rights reserved.
import { Link, ResourceLinks } from "../Links.dto";

/**
 * Saved view links object
 */
export interface SavedViewLinks extends ResourceLinks {
  group?: Link;
  image: Link;
  thumbnail: Link;
}

/**
 * Saved view list links object
 */
export interface SavedViewListLinks {
  self: Link;
  prev?: Link;
  next?: Link;
}
