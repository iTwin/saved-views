/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import type {
  ViewITwin2d,
  ViewITwin3d,
} from "@itwin/saved-views-client";

import { clipVectorMappings } from "./clipVectorsExtractor.js";
import {
  applyExtraction,
  extractArray,
  extractBoolean,
  extractNumber,
  extractSimpleArray,
  extractString,
  simpleTypeOf,
} from "./extractionUtilities.js";

export const extractViewDetails2d = (input: ViewITwin2d) => {
  const viewDetails = input.viewDetails;
  if (!viewDetails) {
    return undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const output: any = {};
  applyExtraction(viewDetails, output, viewDetailsMappings);
  return output;
};

export const extractViewDetails3d = (input: ViewITwin3d) => {
  const viewDetails = input.viewDetails;
  if (!viewDetails) {
    return undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const output: any = {};
  applyExtraction(viewDetails, output, viewDetails3dMappings);

  return output;
};

export const viewDetailsMappings = [
  extractString("acs"),
  extractNumber("aspectSkew"),
  extractNumber("gridOrient"), // enum GridOrientationType
  extractNumber("gridPerRef"),
  extractNumber("gridSpaceX"),
  extractNumber("gridSpaceY"),
  // clip is already extracted in clipVectors property of the view
];

const modelClipGroupMappings = [
  ...clipVectorMappings,
  extractSimpleArray(simpleTypeOf("string"), "models"),
];

const viewDetails3dMappings = [
  ...viewDetailsMappings,
  extractBoolean("disable3dManipulations"),
  extractArray(modelClipGroupMappings, "modelClipGroups"),
];
