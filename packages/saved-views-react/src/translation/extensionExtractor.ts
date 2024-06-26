/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { type EmphasizeElementsProps } from "@itwin/core-common";

import type { PerModelCategoryVisibilityProps } from "./SavedViewTypes.js";
import { featureAppearanceMappings } from "./displayStyleExtractor.js";
import {
  applyExtraction, extractArray, extractBoolean, extractColor, extractNumber, extractObject, extractSimpleArray,
  extractString, simpleTypeOf, type ExtractionFunc,
} from "./extractionUtilities.js";

/** Appearance Override type for EmphasizeElements */
const appearanceOverrideEmphElemMappings: ExtractionFunc<void, void>[] = [
  extractNumber("overrideType"), // an enum
  extractColor("color"),
  extractSimpleArray(simpleTypeOf("string"), "ids"),
];

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

/**
 * Extracts the EmphasizeElementsProps from string data in an extension
 * @param extensionData
 */
export const extractEmphasizeElements = (
  extensionData: string,
): EmphasizeElementsProps | undefined => {
  const dataObj = JSON.parse(extensionData);
  if (dataObj === undefined || dataObj.emphasizeElementsProps === undefined) {
    return undefined;
  }

  const output: EmphasizeElementsProps = {};
  applyExtraction(
    dataObj.emphasizeElementsProps,
    output,
    emphasizeElementsMapping,
  );
  return output;
};

/**
 * Extracts array of PerModelCategoryVisibilityProps from string data in an extension
 * @param extensionData
 */
export const extractPerModelCategoryVisibility = (
  extensionData: string,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const output: any = {};
    applyExtraction(dataObj, output, perModelCategoryVisibilityMapping);
    outputArray.push(output);
  }
  return outputArray;
};
