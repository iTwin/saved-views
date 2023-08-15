// Copyright (c) Bentley Systems, Incorporated. All rights reserved.

import { ExtensionsUpdate, ExtensionResponse, ExtensionListResponse } from "@bentley/itwin-saved-views-utilities";
import { commonRequestArgs } from "./CommonClientInterfaces";

export interface commonExtensionArgs extends commonRequestArgs {
  /** savedViewId id to query after */
  savedViewId: string;
}

export interface createExtensionArgs extends commonExtensionArgs {
  /** extension to be created
   * Extensions allow a saved view to be enhanced with custom data. The extensions have to be defined in a proprietary .JSON schema file. For now, only three extensions are available:
   * 1. PerModelCategoryVisibility
   * 2. EmphasizeElements
   * 3. VisibilityOverride
  */
  extension: ExtensionsUpdate;
}

export interface singleExtensionArgs extends commonExtensionArgs {
  /** extension to name to query*/
  extensionName: string;
}

export interface ExtensionsClient {
  /** Creates an extension that contains custom data in a saved view.
   * @throws on non 2xx response
   */
  createExtension(args: createExtensionArgs): Promise<ExtensionResponse>;

  /** Gets extension
   * @throws on non 2xx response
   */
  getExtension(args: singleExtensionArgs): Promise<ExtensionResponse>;

  /** Gets all extensions
   * @throws on non 2xx response
  */
  getAllExtensions(args: commonExtensionArgs): Promise<ExtensionListResponse>;

  /**deletes extension
   * @throws on non 2xx response
  */
  deleteExtension(args: singleExtensionArgs): Promise<void>;
}
