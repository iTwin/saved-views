/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

/** Wire format describing PlanProjectionSettings.
 */
export interface PlanProjectionSettingsProps {
  elevation?: number;
  transparency?: number;
  overlay?: boolean;
  /** If defined and true, subcategory display priority is used to specify the draw order of portions of the model. Geometry belonging to a subcategory with a higher priority
   * value is drawn on top of coincident geometry belonging to a subcategory with a lower priority value. The priorities can be modified at display time using
   * are drawn as part of the same layer.
   */
  enforceDisplayPriority?: boolean;
}
