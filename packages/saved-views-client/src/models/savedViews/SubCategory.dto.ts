// Copyright (c) Bentley Systems, Incorporated. All rights reserved.
import { RgbColorProps } from "./RgbColor.dto";
export interface SubCategoryAppearanceProps {
  color?: RgbColorProps;
  fill?: RgbColorProps;
  invisible?: boolean;
  weight?: number;
  style?: string;
  priority?: number;
  material?: string;
  // Original name: transp
  transparency?: number;
  // Original name: transpFill
  transparencyFill?: number;
}

/** Describes the SubCategoryOverrides applied to a SubCategory by a DisplayStyle.
 */
export interface DisplayStyleSubCategoryProps
  extends SubCategoryAppearanceProps {
  /** The Id of the SubCategory whose appearance is to be overridden. */
  subCategory?: string;
}
