// Copyright (c) Bentley Systems, Incorporated. All rights reserved.
import {
  type ExtractionFunc,
  applyExtraction,
  extractArray,
  extractBoolean,
  extractColor,
  extractNumber,
  extractObject,
  extractSimpleArray,
  extractString,
  simpleTypeOf,
} from "./extractionUtilities";

// import { type ModelCategoryOverrideProviderProps } from "@bentley/itwin-tools";
import { type EmphasizeElementsProps } from "@itwin/core-common";

import { type PerModelCategoryVisibilityProps } from "../SavedViewTypes";
import { featureAppearanceMappings } from "./displayStyleExtractor";

/** Appearance Override type for EmphasizeElements */
const appearanceOverrideEmphElemMappings: ExtractionFunc<void, void>[] = [
  extractNumber("overrideType"), // an enum
  extractColor("color"),
  extractSimpleArray(simpleTypeOf("string"), "ids"),
];

// /** Appearance Override type for VisibilityOverrides (ie ModelCategoryOverrideProviderProps) */
// const appearanceOverrideVisibOvrMappings: ExtractionFunc<void, void>[] = [
//   extractSimpleArray(simpleTypeOf("string"), "ids"),
//   extractObject(featureAppearanceMappings, "app"),
// ];

const emphasizeElementsMapping: ExtractionFunc<void, void>[] = [
  extractSimpleArray(simpleTypeOf("string"), "neverDrawn"),
  extractSimpleArray(simpleTypeOf("string"), "alwaysDrawn"),
  extractBoolean("isAlwaysDrawnExclusive"),
  extractSimpleArray(simpleTypeOf("string"), "alwaysDrawnExclusiveEmphasized"),
  extractObject(featureAppearanceMappings, "defaultAppearance"),
  extractArray(appearanceOverrideEmphElemMappings, "appearanceOverride"),
  extractBoolean("wantEmphasis"),
  extractObject(featureAppearanceMappings, "unanimatedAppearance"),
];

const perModelCategoryVisibilityMapping: ExtractionFunc<void, void>[] = [
  extractString("modelId"),
  extractString("categoryId"),
  extractBoolean("visible"),
];

// const visibilityOverrideMapping: ExtractionFunc<void, void>[] = [
//   extractArray(appearanceOverrideVisibOvrMappings, "subCategoryOverrides"),
//   extractArray(appearanceOverrideVisibOvrMappings, "modelOverrides"),
//   extractObject(appearanceOverrideVisibOvrMappings, "catEmphasizeOverride"),
//   extractObject(appearanceOverrideVisibOvrMappings, "modelEmphasizeOverride"),
// ];

/**
 * Extracts the EmphasizeElementsProps from string data in an extension
 * @param extensionData
 */
export const extractEmphasizeElements = (
  extensionData: string
): EmphasizeElementsProps | undefined => {
  const dataObj = JSON.parse(extensionData);
  if (dataObj === undefined || dataObj.emphasizeElementsProps === undefined) {
    return undefined;
  }

  const output: EmphasizeElementsProps = {};
  applyExtraction(
    dataObj.emphasizeElementsProps,
    output,
    emphasizeElementsMapping
  );
  return output;
};

/**
 * Extracts array of PerModelCategoryVisibilityProps from string data in an extension
 * @param extensionData
 */
export const extractPerModelCategoryVisibility = (
  extensionData: string
): PerModelCategoryVisibilityProps[] => {
  const dataObjArray = JSON.parse(extensionData);
  if (
    dataObjArray === undefined ||
    dataObjArray.perModelCategoryVisibilityProps === undefined
  ) {
    return [];
  }

  const outputArray: PerModelCategoryVisibilityProps[] = [];
  for (const dataObj of dataObjArray.perModelCategoryVisibilityProps) {
    const output: any = {};
    applyExtraction(dataObj, output, perModelCategoryVisibilityMapping);
    outputArray.push(output);
  }
  return outputArray;
};

// /**
//  * Extracts the VisibilityOverrideProps (ie ModelCategoryOverrideProviderProps) from string data in an extension
//  * @param extensionData
//  */
// export const extractVisibilityOverride = (
//   extensionData: string
// ): ModelCategoryOverrideProviderProps | undefined => {
//   const dataObj = JSON.parse(extensionData);
//   if (dataObj === undefined || dataObj.visibilityOverrideProps === undefined) {
//     return undefined;
//   }

//   const output: ModelCategoryOverrideProviderProps = {};
//   applyExtraction(
//     dataObj.visibilityOverrideProps,
//     output,
//     visibilityOverrideMapping
//   );
//   return output;
// };
