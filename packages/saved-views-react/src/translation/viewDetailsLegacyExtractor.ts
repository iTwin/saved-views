/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import type {
  SpatialViewDefinitionProps,
  ViewDefinition2dProps,
  ViewDetails3dProps,
  ViewDetailsProps,
} from "@itwin/core-common";
import type {
  ClipPrimitivePlaneProps,
  ClipPrimitiveShapeProps,
  ViewITwin2d,
  ViewITwin3d,
} from "@itwin/saved-views-client";

import { clipVectorLegacyMappings } from "./clipVectorsLegacyExtractor.js";
import {
  applyExtraction,
  extractArray,
  extractBoolean,
  extractNumber,
  extractSimpleArray,
  extractString,
  simpleTypeOf,
} from "./extractionUtilities.js";

export function extractViewDetails2dFromLegacy(
  input: ViewDefinition2dProps,
): ViewDetailsProps | undefined {
  const viewDetails = input.jsonProperties?.viewDetails;
  if (!viewDetails) {
    return undefined;
  }

  const output = {} as ViewITwin2d;
  applyExtraction(viewDetails, output, viewDetailsLegacyMappings);
  return output.viewDetails;
}

export function extractViewDetails3dFromLegacy(
  input: SpatialViewDefinitionProps,
): ViewDetails3dProps | undefined {
  const viewDetails = input.jsonProperties?.viewDetails;
  if (!viewDetails) {
    return undefined;
  }

  const output = {} as ViewITwin3d;
  applyExtraction(viewDetails, output, viewDetails3dLegacyMappings);

  // Filter out any plane clipVectors that have no planes actually defined
  for (const clip of output.viewDetails?.modelClipGroups ?? []) {
    clip.clipVectors = clip.clipVectors?.filter(
      (value: ClipPrimitivePlaneProps | ClipPrimitiveShapeProps) => {
        const hasPlanes = "planes" in value;
        return (
          !hasPlanes || (value.planes && Object.keys(value.planes).length > 0)
        );
      },
    );
  }

  return output.viewDetails;
}

const viewDetailsLegacyMappings = [
  extractString("acs"),
  extractNumber("aspectSkew"),
  extractNumber("gridOrient"), // enum GridOrientationType
  extractNumber("gridPerRef"),
  extractNumber("gridSpaceX"),
  extractNumber("gridSpaceY"),
  // clip is already extracted in clipVectors property of the view
];

const modelClipGroupLegacyMappings = [
  ...clipVectorLegacyMappings,
  extractSimpleArray(simpleTypeOf("string"), "models"),
];

const viewDetails3dLegacyMappings = [
  ...viewDetailsLegacyMappings,
  extractBoolean("disable3dManipulations"),
  extractArray(modelClipGroupLegacyMappings, "modelClipGroups"),
];
