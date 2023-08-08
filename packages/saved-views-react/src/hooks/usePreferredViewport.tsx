/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { type ScreenViewport } from "@itwin/core-frontend";

import { SavedViewsManager } from "../api/SavedViewsManager";
import { getTargetViewport } from "../api/TargetViewport";
import { useTargetViewport } from "./useTargetViewport";

export const usePreferredViewport = (): ScreenViewport | undefined => {
  const targetVp = useTargetViewport();
  if (SavedViewsManager.getViewport) {
    return SavedViewsManager.getViewport();
  }
  return getTargetViewport(targetVp);
};
