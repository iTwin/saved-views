/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { IModelApp, type ScreenViewport } from "@itwin/core-frontend";

// specifies either the selected viewport or the first opened viewport as the target for a saved view
export type TargetViewport = "selected" | "first";

export function getTargetViewport(target: TargetViewport): ScreenViewport | undefined {
  switch (target) {
    case "selected":
      return IModelApp.viewManager.selectedView;
    case "first":
      return IModelApp.viewManager.getFirstOpenView();
    default:
      throw new Error();
  }
}
