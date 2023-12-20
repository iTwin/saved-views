/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import type { LegacySavedView, LegacySavedViewBase } from "../utilities/SavedViewTypes";

/** Is a 3d saved view */
export function isSavedView3d(view: LegacySavedViewBase): view is LegacySavedView {
  return !view.is2d;
}

/** Is a 3d spatial saved view */
export function isSpatialSavedView(view: LegacySavedViewBase) {
  return (
    (view.is2d === undefined || !view.is2d) && "modelSelectorProps" in view
  );
}

/** Is a 2d drawing saved view */
export function isDrawingSavedView(view: LegacySavedViewBase) {
  return view.is2d !== undefined && view.is2d && !("sheetProps" in view);
}

/** Is a 2d sheet saved view */
export function isSheetSavedView(view: LegacySavedViewBase) {
  return view.is2d !== undefined && view.is2d && "sheetProps" in view;
}
