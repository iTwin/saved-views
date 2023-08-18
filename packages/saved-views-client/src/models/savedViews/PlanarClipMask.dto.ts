// Copyright (c) Bentley Systems, Incorporated. All rights reserved.

/** The different modes by which a PlanarClipMaskSettings collects the geometry used to mask a model.
 */
export enum PlanarClipMaskMode {
  /** No masking. */
  None = 0,
  /** Mask based on priority. Different types of models have different default priorities as enumerated by PlanarClipMaskPriority.
   * For example, background maps have the lowest priority, so they are masked by all other types, while design models have the highest priority and are therefore never masked.
   * The priority of a reality model can be overridden by PlanarClipMaskSettings.priority. This is useful to allow one reality model to mask another overlapping one.
   */
  Priority = 1,
  /** Indicates that masks should be produced from the geometry in a set of GeometricModel. */
  Models = 2,
  /** Indicates that masks should be produced from geometry belonging to a set of subcategories. */
  IncludeSubCategories = 3,
  /** Indicates that masks should be produced from the geometry of a set of GeometricElements. */
  IncludeElements = 4,
  /** Indicates that masks should be produced from the geometry of all GeometricElements in a view, **except** for a specified set of excluded elements. */
  ExcludeElements = 5,
}

/** The default priority values for a PlanarClipMaskSettings, based on model type. Models with a lower priority are masked by models with a higher priority.
 * The default can be overridden by PlanarClipMaskSettings.priority.
 */
export enum PlanarClipMaskPriority {
  /** Background map. */
  BackgroundMap = -2048,
  /** A reality model that spans the globe - e.g., OpenStreetMaps Buildings. */
  GlobalRealityModel = -1024,
  /** A reality model with a bounded range. */
  RealityModel = 0,
  /** A design model stored in the IModelDb. */
  DesignModel = 2048,
}

/** JSON representation of a PlanarClipMaskSettings.
 */
export interface PlanarClipMaskProps {
  /** Controls how the mask geometry is collected */
  mode: PlanarClipMaskMode;
  modelIds?: string;
  subCategoryOrElementIds?: string;
  priority?: PlanarClipMaskPriority;
  transparency?: number;
  invert?: boolean;
}

/** A PlanarClipMaskProps associated with a specific reality model.
 */
export interface DisplayStylePlanarClipMaskProps extends PlanarClipMaskProps {
  modelId?: string;
}
