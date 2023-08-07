/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Logger } from "@itwin/core-bentley";

import type { SavedViewBase } from "./SavedViewTypes";

const MAX_SAVED_VIEW_SIZE = 990000;

// solution from: https://stackoverflow.com/questions/1248302/how-to-get-the-size-of-a-javascript-object
// used to find an estimated size of an object
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function roughSizeOfObject(obj: any) {
  const objectList = [];
  const stack = [obj];
  let bytes = 0;

  while (stack.length) {
    const value = stack.pop();

    if (typeof value === "boolean") {
      bytes += 4;
    } else if (typeof value === "string") {
      bytes += value.length * 2;
    } else if (typeof value === "number") {
      bytes += 8;
    } else if (typeof value === "object" && objectList.indexOf(value) === -1) {
      objectList.push(value);

      for (const i in value) {
        stack.push(value[i]);
      }
    }
  }
  return bytes;
}

export const sizeOfSavedView = (savedView: SavedViewBase): number => {
  const size = roughSizeOfObject(savedView);
  Logger.logTrace("ITwinSavedViews.ViewSize", `View named: ${savedView.name} has an estimated size of: ${size}`);
  return size;
};

export const isSavedViewTooLarge = (savedView: SavedViewBase): boolean => {
  return roughSizeOfObject(savedView) > MAX_SAVED_VIEW_SIZE;
};

export const isTooManyEmphasizedElements = (savedView: SavedViewBase): boolean => {
  if (savedView.emphasizeElementsProps) {
    const savedViewSize = sizeOfSavedView(savedView);
    if (savedViewSize > MAX_SAVED_VIEW_SIZE) {
      const emphasizedElementsSize = roughSizeOfObject(savedView.emphasizeElementsProps);
      Logger.logTrace(
        "ITwinSavedViews.ViewSize",
        `View named: ${savedView.name} has emphasized elements with an estimated size of: ${emphasizedElementsSize}`,
      );
      // if the emphasized element size subtracted from the total view size is under the maximum, we consider this view to have too many emphasized elements
      if (savedViewSize - emphasizedElementsSize < MAX_SAVED_VIEW_SIZE) {
        return true;
      }
    }
  }
  return false;
};
