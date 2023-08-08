/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

export interface IDefaultViewIdClient {
  get isSharedSetting(): boolean;
  getDefaultSavedViewId(
    contextId: string,
    iModelId: string
  ): Promise<string | undefined>;
  updateDefaultSavedViewId(
    contextId: string,
    iModelId: string,
    defaultViewId: string | undefined
  ): Promise<void>;
}
