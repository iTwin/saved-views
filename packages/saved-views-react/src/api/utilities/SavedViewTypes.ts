/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { type Id64Array } from "@itwin/core-bentley";
import type {
  AppearanceOverrideProps, CategorySelectorProps, DisplayStyle3dProps, DisplayStyleProps, EmphasizeElementsProps,
  FeatureAppearanceProps, ModelSelectorProps, SectionDrawingViewProps, SheetProps, SpatialViewDefinitionProps,
  ViewDefinition2dProps,
} from "@itwin/core-common";
import type { Range3dProps } from "@itwin/core-geometry";

import { ModelCategoryOverrideProviderProps } from "../../ui/viewlist/ModelCategoryOverrideProvider";

/** Per Model Category Visibility Props */
export interface PerModelCategoryVisibilityProps {
  modelId: string;
  categoryId: string;
  visible: boolean;
}

export interface LegacySavedViewBaseUpdate {
  id: string;
  name?: string;
  shared?: boolean;
  is2d?: boolean;
  groupId?: string;
  userId?: string;
  thumbnailId?: string;
  thumbnail?: string;
  categorySelectorProps?: CategorySelectorProps;
  emphasizeElementsProps?: EmphasizeElementsProps; // Treated as an extension in Saved Views public API
  visibilityOverrideProps?: ModelCategoryOverrideProviderProps; // Treated as an extension in Saved Views public API
  tags?: Tag[];
  hiddenCategories?: Id64Array;
  extensions?: Map<string, string>; // Map of extension data with key of the extensionName
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
  visibilityOverrideProps?: ModelCategoryOverrideProviderProps; // Treated as an extension in Saved Views public API
  tags?: Tag[];
  hiddenCategories?: Id64Array;
  extensions?: Map<string, string>; // Map of extension data with key of the extensionName
}

export interface LegacySavedView2d extends LegacySavedViewBase {
  viewDefinitionProps: ViewDefinition2dProps;
  displayStyleProps: DisplayStyleProps;
  sectionDrawing?: SectionDrawingViewProps;
  sheetProps?: SheetProps;
  sheetAttachments?: Id64Array;
}

/**
 * Format for a saved view setting instance in the service
 */
export interface LegacySavedView extends LegacySavedViewBase {
  displayStyleProps: DisplayStyle3dProps;
  modelSelectorProps: ModelSelectorProps;
  modelExtents?: Range3dProps;
  viewDefinitionProps: SpatialViewDefinitionProps;
  perModelCategoryVisibility?: PerModelCategoryVisibilityProps[];
  hiddenModels?: Id64Array;
}

/** Clean Emphasize Elements Props */
export interface CleanEmphasizeElementsProps {
  neverDrawn?: Id64Array;
  alwaysDrawn?: Id64Array;
  isAlwaysDrawnExclusive?: boolean;
  alwaysDrawnExclusiveEmphasized?: Id64Array;
  defaultAppearance?: FeatureAppearanceProps;
  appearanceOverride?: AppearanceOverrideProps[];
}

/**
 * Saved view base setting instance
 */
export interface LegacySavedViewBaseSetting {
  id: string;
  name: string;
  shared: boolean;
  is2d?: boolean;
  userId?: string;
  groupId?: string;
  thumbnailId: string;
  categorySelectorProps: CategorySelectorProps;
  emphasizeElementsProps?: CleanEmphasizeElementsProps;
  visibilityOverrideProps?: ModelCategoryOverrideProviderProps;
  tags?: Tag[];
}

export interface GroupUpdate {
  name?: string;
  shared?: boolean;
}

export interface LegacyGroup {
  id: string;
  name: string;
  shared: boolean;
  userId: string;
}

export interface Tag {
  name: string;
  createdByUserId: string;
}

export interface ReadOnlyTag extends Tag {
  id: string;
  links: TagLinks;
}

/** Tag links object. */
export type TagLinks = ResourceLinks;

export function isReadOnlyTag(tag: Tag): tag is ReadOnlyTag {
  return (
    (tag as ReadOnlyTag).id !== undefined &&
    (tag as ReadOnlyTag).links !== undefined
  );
}

/** Group links object. */
export interface GroupLinks extends ResourceLinks {
  savedViews: Link;
}

/** Resource links object. */
export interface ResourceLinks {
  iTwin?: Link;
  project?: Link;
  imodel?: Link;
  creator: Link;
}

/** Link properties. */
export interface Link {
  href: string;
}
