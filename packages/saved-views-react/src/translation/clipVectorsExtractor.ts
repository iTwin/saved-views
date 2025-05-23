/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import {
  applyExtraction, extractArray2d, extractArrayConditionally, extractBoolean, extractNumber, extractObject,
  extractSimpleArray, simpleTypeOf, type ExtractionFunc,
} from "./extractionUtilities.js";

const isPoint = (val: unknown): val is [number, number, number] =>
  Array.isArray(val) &&
  val.length === 3 &&
  val.every((num: unknown) => typeof num === "number");

const isTransformRow = (
  value: unknown,
): value is [number, number, number, number] =>
  Array.isArray(value) &&
  value.length === 4 &&
  value.every((num: unknown) => typeof num === "number");

const clipPrimitiveShapeMappings: ExtractionFunc<void, void>[] = [
  extractObject(
    [
      extractSimpleArray(isPoint, "points"),
      extractSimpleArray(isTransformRow, "transform", "trans"),
      extractNumber("zLow", "zlow"),
      extractNumber("zHigh", "zhigh"),
      extractBoolean("mask"),
      extractBoolean("invisible"),
    ],
    "shape",
  ),
];

const clipPlaneMappings: ExtractionFunc<void, void>[] = [
  extractSimpleArray(simpleTypeOf("number"), "normal"),
  extractNumber("distance", "dist"),
  extractBoolean("invisible"),
  extractBoolean("interior"),
];

const clipPrimitivePlaneMappings: ExtractionFunc<void, void>[] = [
  extractObject(
    [extractArray2d(clipPlaneMappings, "clips"), extractBoolean("invisible")],
    "planes",
  ),
];

const clipVectorMappings: ExtractionFunc<void, void>[] = [
  extractArrayConditionally(
    [
      {
        discriminator: "planes",
        mappings: [...clipPrimitivePlaneMappings],
      },
      {
        discriminator: "shape",
        mappings: [...clipPrimitiveShapeMappings],
      },
    ],
    "clipVectors",
    "clip",
  ),
];

/**
 * Extracts the clip vectors from a legacy view
 * @param input
 */
export const extractClipVectors = (input: object) => {
  const viewDetails = input;
  if (!("clipVectors" in input)) {
    return undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const output: any = {};
  applyExtraction(viewDetails, output, clipVectorMappings);
  return output;
};
