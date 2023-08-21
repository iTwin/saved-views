/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
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
