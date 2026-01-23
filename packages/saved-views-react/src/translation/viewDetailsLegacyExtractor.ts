/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import type {
  SpatialViewDefinitionProps,
  ViewDefinition2dProps,
} from "@itwin/core-common";
import type {
  ViewDetails3dProps,
  ViewDetailsProps,
} from "@itwin/saved-views-client";

import {
  clipVectorLegacyMappings,
  isValidClipPrimitive,
} from "./clipVectorsLegacyExtractor.js";
import {
  applyExtraction,
  extractArray,
  extractBoolean,
  extractSimpleArray,
  simpleTypeOf,
} from "./extractionUtilities.js";
import { viewDetailsMappings } from "./viewDetailsExtractor.js";

export function extractViewDetails2dFromLegacy(
  input: ViewDefinition2dProps,
): ViewDetailsProps | undefined {
  const viewDetails = input.jsonProperties?.viewDetails;
  if (!viewDetails) {
    return undefined;
  }

  const output = {} as ViewDetailsProps;
  applyExtraction(viewDetails, output, viewDetailsMappings);
  return output;
}

export function extractViewDetails3dFromLegacy(
  input: SpatialViewDefinitionProps,
): ViewDetails3dProps | undefined {
  const viewDetails = input.jsonProperties?.viewDetails;
  if (!viewDetails) {
    return undefined;
  }

  const output = {} as ViewDetails3dProps;
  applyExtraction(viewDetails, output, viewDetails3dLegacyMappings);

  // Filter out any plane clipVectors that have no planes actually defined
  for (const clipGroup of output?.modelClipGroups ?? []) {
    clipGroup.clipVectors = clipGroup.clipVectors?.filter(isValidClipPrimitive);
  }

  return output;
}

const modelClipGroupLegacyMappings = [
  ...clipVectorLegacyMappings,
  extractSimpleArray(simpleTypeOf("string"), "models"),
];

const viewDetails3dLegacyMappings = [
  ...viewDetailsMappings,
  extractBoolean("disable3dManipulations"),
  extractArray(modelClipGroupLegacyMappings, "modelClipGroups"),
];
