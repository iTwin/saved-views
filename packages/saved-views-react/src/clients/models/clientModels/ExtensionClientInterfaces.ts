// Copyright (c) Bentley Systems, Incorporated. All rights reserved.

import { ExtensionsUpdate, ExtensionResponse, ExtensionListResponse } from "@itwin/itwin-saved-views-types";
import { CommonRequestArgs } from "./CommonClientInterfaces";

export interface CommonExtensionArgs extends CommonRequestArgs {
  /** savedViewId id to query after */
  savedViewId: string;
}

export interface CreateExtensionArgs extends CommonExtensionArgs {
  /** extension to be created
   * Extensions allow a saved view to be enhanced with custom data. The extensions have to be defined in a proprietary .JSON schema file. For now, only three extensions are available:
   * 1. PerModelCategoryVisibility
   * 2. EmphasizeElements
   * 3. VisibilityOverride
  */
  extension: ExtensionsUpdate;
}

export interface SingleExtensionArgs extends CommonExtensionArgs {
  /** extension to name to query*/
  extensionName: string;
}

export interface ExtensionsClient {
  /** Creates an extension that contains custom data in a saved view.
   * @throws on non 2xx response
   */
  createExtension(args: CreateExtensionArgs): Promise<ExtensionResponse>;

  /** Gets extension
   * @throws on non 2xx response
   */
  getExtension(args: SingleExtensionArgs): Promise<ExtensionResponse>;

  /** Gets all extensions
   * @throws on non 2xx response
  */
  getAllExtensions(args: CommonExtensionArgs): Promise<ExtensionListResponse>;

  /**deletes extension
   * @throws on non 2xx response
  */
  deleteExtension(args: SingleExtensionArgs): Promise<void>;
}
