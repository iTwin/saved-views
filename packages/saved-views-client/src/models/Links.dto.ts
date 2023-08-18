// Copyright (c) Bentley Systems, Incorporated. All rights reserved.

/**
 * Link properties.
 */
export interface Link {
  href: string;
}

/**
 * Resource links object
 */
export interface ResourceLinks {
  iTwin?: Link;
  project?: Link;
  imodel?: Link;
  creator: Link;
}
