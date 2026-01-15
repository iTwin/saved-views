/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import type { Id64Array } from "@itwin/core-bentley";
import type {
  CategorySelectorProps,
  DisplayStyle3dProps,
  DisplayStyleProps,
  EmphasizeElementsProps,
  ModelSelectorProps,
  SectionDrawingViewProps,
  SheetProps,
  SpatialViewDefinitionProps,
  ViewDefinition2dProps,
  ViewDetails3dProps,
  ViewDetailsProps,
} from "@itwin/core-common";
import type { Range3dProps } from "@itwin/core-geometry";

export interface LegacySavedView3d extends LegacySavedViewBase {
  displayStyleProps: DisplayStyle3dProps;
  modelSelectorProps: ModelSelectorProps;
  viewDefinitionProps: SpatialViewDefinitionProps;
  perModelCategoryVisibility?: PerModelCategoryVisibilityProps[];
  hiddenModels?: Id64Array;
  viewDetails?: ViewDetails3dProps;
}

export interface PerModelCategoryVisibilityProps {
  modelId: string;
  categoryId: string;
  visible: boolean;
}

export interface LegacySavedView2d extends LegacySavedViewBase {
  viewDefinitionProps: ViewDefinition2dProps;
  displayStyleProps: DisplayStyleProps;
  sectionDrawing?: SectionDrawingViewProps;
  sheetProps?: SheetProps;
  sheetAttachments?: Id64Array;
  modelExtents?: Range3dProps;
  viewDetails?: ViewDetailsProps;
}

export interface LegacySavedViewBase {
  id: string;
  name: string;
  shared: boolean;
  is2d?: boolean;
  groupId?: string;
  userId?: string;
  thumbnailId?: string;
  thumbnail?: string;
  categorySelectorProps: CategorySelectorProps;
  emphasizeElementsProps?: EmphasizeElementsProps; // Treated as an extension in Saved Views public API
  tags?: LegacyTag[];
  hiddenCategories?: Id64Array;
  extensions?: Map<string, string>; // Map of extension data with key of the extensionName
}

export interface LegacyTag {
  name: string;
  createdByUserId: string;
}
