// Copyright (c) Bentley Systems, Incorporated. All rights reserved.
import { Link } from "../Links.dto";

/**
 * Extension links object
 */
export interface ExtensionLinks {
  iTwin?: Link;
  project?: Link;
  imodel?: Link;
  savedView: Link;
  self?: Link;
}
