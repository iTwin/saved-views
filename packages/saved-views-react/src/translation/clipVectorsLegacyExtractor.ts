/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import type { SpatialViewDefinitionProps } from "@itwin/core-common";
import type { ClipPrimitivePlaneProps, ClipPrimitiveShapeProps, ViewITwin3d } from "@itwin/saved-views-client";

import {
  applyExtraction, extractArray2d, extractArrayConditionally, extractBoolean, extractNumber, extractObject,
  extractSimpleArray, filterArray, simpleTypeOf,
} from "./extractionUtilities.js";

export function extractClipVectorsFromLegacy(
  input: SpatialViewDefinitionProps,
): Array<ClipPrimitivePlaneProps | ClipPrimitiveShapeProps> | undefined {
  const viewDetails = input.jsonProperties?.viewDetails;
  if (!viewDetails || !("clip" in viewDetails)) {
    return undefined;
  }

  const output = {} as ViewITwin3d;
  applyExtraction(viewDetails, output, clipVectorLegacyMappings);
  filterArray("clipVectors", output, (value: any) => {
    const planes: Object = value?.planes;
    return !planes || Object.keys(planes).length > 0;
  });

  return output.clipVectors;
}

const clipPlaneLegacyMappings = [
  extractSimpleArray(simpleTypeOf("number"), "normal"),
  extractNumber("dist", "distance"),
  extractBoolean("invisible"),
  extractBoolean("interior"),
];

const clipPrimitivePlaneLegacyMappings = [
  extractObject(
    [extractArray2d(clipPlaneLegacyMappings, "clips"), extractBoolean("invisible")],
    "planes",
  ),
];

const clipPrimitiveShapeLegacyMappings = [
  extractObject(
    [
      extractSimpleArray(isPoint, "points"),
      extractSimpleArray(isTransformRow, "trans", "transform"),
      extractNumber("zlow", "zLow"),
      extractNumber("zhigh", "zHigh"),
      extractBoolean("mask"),
      extractBoolean("invisible"),
    ],
    "shape",
  ),
];

const clipVectorLegacyMappings = [
  extractArrayConditionally(
    [
      { discriminator: "planes", mappings: clipPrimitivePlaneLegacyMappings },
      { discriminator: "shape", mappings: clipPrimitiveShapeLegacyMappings },
    ],
    "clip",
    "clipVectors",
  ),
];

function isPoint(val: unknown): val is [number, number, number] {
  return Array.isArray(val) && val.length === 3 && val.every((num) => typeof num === "number");
}

function isTransformRow(value: unknown): value is [number, number, number, number] {
  return Array.isArray(value) && value.length === 4 && value.every((num) => typeof num === "number");
}
