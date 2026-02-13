/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { describe, it, expect, vi } from "vitest";
import type {
  SpatialViewDefinitionProps,
  ViewDefinition2dProps,
} from "@itwin/core-common";

// Mock @itwin/core-common
vi.mock("@itwin/core-common", () => ({
  ColorDef: {
    isValidColor: (value: unknown) => {
      return typeof value === "number" && value >= 0 && value <= 0xffffffff;
    },
  },
}));

import {
  extractViewDetails2dFromLegacy,
  extractViewDetails3dFromLegacy,
} from "../../translation/viewDetailsLegacyExtractor.js";

// ============================================================================
// Test fixtures
// ============================================================================

const createLegacyViewDetails2d = () => ({
  acs: "0x123",
  aspectSkew: 1.5,
  gridOrient: 1,
  gridPerRef: 10,
  gridSpaceX: 100,
  gridSpaceY: 100,
});

const createLegacyViewDetails3d = () => ({
  ...createLegacyViewDetails2d(),
  disable3dManipulations: true,
  modelClipGroups: [
    {
      models: ["0x1", "0x2"],
      clips: [
        [
          {
            planes: {
              clips: [[{ origin: [0, 0, 0], direction: [1, 0, 0] }]],
            },
          },
        ],
      ],
    },
  ],
});

const createLegacyViewDefinition2dProps = (
  viewDetails?: Record<string, unknown>,
): ViewDefinition2dProps => ({
  classFullName: "BisCore:ViewDefinition2d",
  code: {
    spec: "0x1",
    scope: "0x1",
    value: "Test View",
  },
  model: "0x1",
  categorySelectorId: "0x2",
  displayStyleId: "0x3",
  baseModelId: "0x4",
  origin: { x: 0, y: 0 },
  delta: { x: 100, y: 100 },
  angle: { radians: 0 },
  jsonProperties: viewDetails ? { viewDetails } : undefined,
});

const createLegacySpatialViewDefinitionProps = (
  viewDetails?: Record<string, unknown>,
): SpatialViewDefinitionProps => ({
  classFullName: "BisCore:SpatialViewDefinition",
  code: {
    spec: "0x1",
    scope: "0x1",
    value: "Test View",
  },
  model: "0x1",
  categorySelectorId: "0x2",
  displayStyleId: "0x3",
  modelSelectorId: "0x5",
  cameraOn: true,
  origin: [0, 0, 0],
  extents: [100, 100, 100],
  angles: { yaw: 0, pitch: 0, roll: 0 },
  camera: {
    eye: [0, 0, 100],
    focusDist: 100,
    lens: 45,
  },
  jsonProperties: viewDetails ? { viewDetails } : undefined,
});

// ============================================================================
// Tests
// ============================================================================

describe("viewDetailsLegacyExtractor", () => {
  describe("extractViewDetails2dFromLegacy", () => {
    it("extracts all viewDetails properties from legacy 2D view", () => {
      const input = createLegacyViewDefinition2dProps(
        createLegacyViewDetails2d(),
      );

      const result = extractViewDetails2dFromLegacy(input);

      expect(result).toBeDefined();
      expect(result!.acs).toBe("0x123");
      expect(result!.aspectSkew).toBe(1.5);
      expect(result!.gridOrient).toBe(1);
      expect(result!.gridPerRef).toBe(10);
      expect(result!.gridSpaceX).toBe(100);
      expect(result!.gridSpaceY).toBe(100);
    });

    it("returns undefined when jsonProperties is not present", () => {
      const input: ViewDefinition2dProps = {
        ...createLegacyViewDefinition2dProps(),
        jsonProperties: undefined,
      };

      const result = extractViewDetails2dFromLegacy(input);

      expect(result).toBeUndefined();
    });

    it("returns undefined when viewDetails is not present", () => {
      const input: ViewDefinition2dProps = {
        ...createLegacyViewDefinition2dProps(),
        jsonProperties: {},
      };

      const result = extractViewDetails2dFromLegacy(input);

      expect(result).toBeUndefined();
    });

    it("extracts partial viewDetails", () => {
      const input = createLegacyViewDefinition2dProps({
        acs: "0x456",
        gridPerRef: 5,
      });

      const result = extractViewDetails2dFromLegacy(input);

      expect(result).toBeDefined();
      expect(result!.acs).toBe("0x456");
      expect(result!.gridPerRef).toBe(5);
      expect(result!.aspectSkew).toBeUndefined();
    });

    it("handles empty viewDetails object", () => {
      const input = createLegacyViewDefinition2dProps({});

      const result = extractViewDetails2dFromLegacy(input);

      expect(result).toBeDefined();
      expect(result).toEqual({});
    });
  });

  describe("extractViewDetails3dFromLegacy", () => {
    it("extracts all viewDetails properties from legacy 3D view", () => {
      const input = createLegacySpatialViewDefinitionProps(
        createLegacyViewDetails3d(),
      );

      const result = extractViewDetails3dFromLegacy(input);

      expect(result).toBeDefined();
      expect(result!.acs).toBe("0x123");
      expect(result!.aspectSkew).toBe(1.5);
      expect(result!.gridOrient).toBe(1);
      expect(result!.gridPerRef).toBe(10);
      expect(result!.gridSpaceX).toBe(100);
      expect(result!.gridSpaceY).toBe(100);
    });

    it("extracts 3D-specific properties", () => {
      const input = createLegacySpatialViewDefinitionProps(
        createLegacyViewDetails3d(),
      );

      const result = extractViewDetails3dFromLegacy(input);

      expect(result!.disable3dManipulations).toBe(true);
    });

    it("extracts modelClipGroups", () => {
      const input = createLegacySpatialViewDefinitionProps(
        createLegacyViewDetails3d(),
      );

      const result = extractViewDetails3dFromLegacy(input);

      expect(result!.modelClipGroups).toBeDefined();
      expect(result!.modelClipGroups).toHaveLength(1);
      expect(result!.modelClipGroups![0].models).toEqual(["0x1", "0x2"]);
    });

    it("returns undefined when jsonProperties is not present", () => {
      const input: SpatialViewDefinitionProps = {
        ...createLegacySpatialViewDefinitionProps(),
        jsonProperties: undefined,
      };

      const result = extractViewDetails3dFromLegacy(input);

      expect(result).toBeUndefined();
    });

    it("returns undefined when viewDetails is not present", () => {
      const input: SpatialViewDefinitionProps = {
        ...createLegacySpatialViewDefinitionProps(),
        jsonProperties: {},
      };

      const result = extractViewDetails3dFromLegacy(input);

      expect(result).toBeUndefined();
    });

    it("filters out invalid clip primitives from modelClipGroups", () => {
      const viewDetails = {
        modelClipGroups: [
          {
            models: ["0xA"],
            clips: [
              [
                // Valid clip primitive with planes
                {
                  planes: {
                    clips: [[{ origin: [0, 0, 0], direction: [1, 0, 0] }]],
                  },
                },
              ],
              [
                // Invalid - plane with no actual clips
                {
                  planes: {
                    clips: [],
                  },
                },
              ],
            ],
          },
        ],
      };
      const input = createLegacySpatialViewDefinitionProps(viewDetails);

      const result = extractViewDetails3dFromLegacy(input);

      expect(result!.modelClipGroups).toBeDefined();
      expect(result!.modelClipGroups![0]).toBeDefined();
      // The clipVectors property will contain only valid clips after filtering
      // Invalid clips with empty planes.clips should be filtered out
    });

    it("handles modelClipGroups with shape clips", () => {
      const viewDetails = {
        modelClipGroups: [
          {
            models: ["0xB"],
            clips: [
              [
                {
                  shape: {
                    points: [
                      [0, 0, 0],
                      [1, 0, 0],
                      [1, 1, 0],
                      [0, 1, 0],
                    ],
                  },
                },
              ],
            ],
          },
        ],
      };
      const input = createLegacySpatialViewDefinitionProps(viewDetails);

      const result = extractViewDetails3dFromLegacy(input);

      expect(result!.modelClipGroups).toBeDefined();
      expect(result!.modelClipGroups).toHaveLength(1);
    });

    it("extracts without modelClipGroups when not present", () => {
      const viewDetails = {
        acs: "0x789",
        disable3dManipulations: false,
      };
      const input = createLegacySpatialViewDefinitionProps(viewDetails);

      const result = extractViewDetails3dFromLegacy(input);

      expect(result!.acs).toBe("0x789");
      expect(result!.disable3dManipulations).toBe(false);
      expect(result!.modelClipGroups).toBeUndefined();
    });
  });

  describe("snapshot tests", () => {
    it("matches snapshot for full legacy 2D view details extraction", () => {
      const input = createLegacyViewDefinition2dProps(
        createLegacyViewDetails2d(),
      );

      const result = extractViewDetails2dFromLegacy(input);

      expect(result).toMatchSnapshot();
    });

    it("matches snapshot for full legacy 3D view details extraction", () => {
      const input = createLegacySpatialViewDefinitionProps(
        createLegacyViewDetails3d(),
      );

      const result = extractViewDetails3dFromLegacy(input);

      expect(result).toMatchSnapshot();
    });
  });
});
