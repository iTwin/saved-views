/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

export interface CommonRequestParams {
  signal?: AbortSignal;
  headers?: Record<string, string>;
  body?: object;
}
