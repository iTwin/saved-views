/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

export type PartialExcept<T, K extends keyof T> = Partial<Omit<T, K>> & Pick<Required<T>, K>;

export function trimInputString(string: string): string {
  return string.replace(/\s+/g, " ");
}
