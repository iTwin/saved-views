/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { describe, it, expect, vi } from "vitest";
import type { ViewITwin2d, ViewITwin3d } from "@itwin/saved-views-client";

// Mock @itwin/core-common
vi.mock("@itwin/core-common", () => ({
  ColorDef: {
    isValidColor: (value: unknown) => {
      return typeof value === "number" && value >= 0 && value <= 0xffffffff;
    },
  },
}));

import {
  extractViewDetails2d,
  extractViewDetails3d,
  viewDetailsMappings,
} from "../../translation/viewDetailsExtractor.js";

// ============================================================================
// Test fixtures
// ============================================================================

const createViewDetails2d = () => ({
  acs: "0x123",
  aspectSkew: 1.5,
  gridOrient: 1, // GridOrientationType enum value
  gridPerRef: 10,
  gridSpaceX: 100,
  gridSpaceY: 100,
});

const createViewDetails3d = () => ({
  ...createViewDetails2d(),
  disable3dManipulations: true,
  modelClipGroups: [
    {
      models: ["0x1", "0x2"],
      clipVectors: [
        {
          planes: {
            clips: [[{ distance: 10.5, normal: [1, 0, 0] }]],
          },
        },
      ],
    },
  ],
});

const createMinimalViewITwin2d = (): ViewITwin2d => ({
  id: "test-id",
  displayName: "Test View",
  viewData: {
    itwin3dView: undefined,
    itwin2dView: {
      baseModelId: "0x123",
      origin: [0, 0],
      delta: [100, 100],
      angle: 0,
      categorySelectorProps: {},
      displayStyleProps: {},
    },
    itwinSheetView: undefined,
    itwinDrawingView: undefined,
  },
  viewDetails: createViewDetails2d(),
  displayStyle: {},
});

const createMinimalViewITwin3d = (): ViewITwin3d => ({
  id: "test-id",
  displayName: "Test View",
  viewData: {
    itwin3dView: {
      origin: [0, 0, 0],
      extents: [100, 100, 100],
      angles: { yaw: 0, pitch: 0, roll: 0 },
      categorySelectorProps: {},
      displayStyleProps: {},
      modelSelectorProps: {},
    },
    itwin2dView: undefined,
    itwinSheetView: undefined,
    itwinDrawingView: undefined,
  },
  viewDetails: createViewDetails3d(),
  displayStyle: {},
});

// ============================================================================
// Tests
// ============================================================================

describe("viewDetailsExtractor", () => {
  describe("extractViewDetails2d", () => {
    it("extracts all viewDetails properties for 2D views", () => {
      const input = createMinimalViewITwin2d();

      const result = extractViewDetails2d(input);

      expect(result).toBeDefined();
      expect(result.acs).toBe("0x123");
      expect(result.aspectSkew).toBe(1.5);
      expect(result.gridOrient).toBe(1);
      expect(result.gridPerRef).toBe(10);
      expect(result.gridSpaceX).toBe(100);
      expect(result.gridSpaceY).toBe(100);
    });

    it("returns undefined when viewDetails is not present", () => {
      const input: ViewITwin2d = {
        ...createMinimalViewITwin2d(),
        viewDetails: undefined,
      };

      const result = extractViewDetails2d(input);

      expect(result).toBeUndefined();
    });

    it("extracts partial viewDetails", () => {
      const input: ViewITwin2d = {
        ...createMinimalViewITwin2d(),
        viewDetails: {
          acs: "0x456",
          gridPerRef: 5,
        },
      };

      const result = extractViewDetails2d(input);

      expect(result).toBeDefined();
      expect(result.acs).toBe("0x456");
      expect(result.gridPerRef).toBe(5);
      expect(result.aspectSkew).toBeUndefined();
      expect(result.gridOrient).toBeUndefined();
    });

    it("handles empty viewDetails object", () => {
      const input: ViewITwin2d = {
        ...createMinimalViewITwin2d(),
        viewDetails: {},
      };

      const result = extractViewDetails2d(input);

      expect(result).toBeDefined();
      expect(result).toEqual({});
    });

    it("handles zero values correctly", () => {
      const input: ViewITwin2d = {
        ...createMinimalViewITwin2d(),
        viewDetails: {
          aspectSkew: 0,
          gridOrient: 0,
          gridPerRef: 0,
          gridSpaceX: 0,
          gridSpaceY: 0,
        },
      };

      const result = extractViewDetails2d(input);

      expect(result.aspectSkew).toBe(0);
      expect(result.gridOrient).toBe(0);
      expect(result.gridPerRef).toBe(0);
      expect(result.gridSpaceX).toBe(0);
      expect(result.gridSpaceY).toBe(0);
    });
  });

  describe("extractViewDetails3d", () => {
    it("extracts all viewDetails properties for 3D views", () => {
      const input = createMinimalViewITwin3d();

      const result = extractViewDetails3d(input);

      expect(result).toBeDefined();
      expect(result.acs).toBe("0x123");
      expect(result.aspectSkew).toBe(1.5);
      expect(result.gridOrient).toBe(1);
      expect(result.gridPerRef).toBe(10);
      expect(result.gridSpaceX).toBe(100);
      expect(result.gridSpaceY).toBe(100);
    });

    it("extracts 3D-specific properties", () => {
      const input = createMinimalViewITwin3d();

      const result = extractViewDetails3d(input);

      expect(result.disable3dManipulations).toBe(true);
    });

    it("extracts modelClipGroups", () => {
      const input = createMinimalViewITwin3d();

      const result = extractViewDetails3d(input);

      expect(result.modelClipGroups).toBeDefined();
      expect(result.modelClipGroups).toHaveLength(1);
      expect(result.modelClipGroups[0].models).toEqual(["0x1", "0x2"]);
    });

    it("returns undefined when viewDetails is not present", () => {
      const input: ViewITwin3d = {
        ...createMinimalViewITwin3d(),
        viewDetails: undefined,
      };

      const result = extractViewDetails3d(input);

      expect(result).toBeUndefined();
    });

    it("extracts without modelClipGroups when not present", () => {
      const input: ViewITwin3d = {
        ...createMinimalViewITwin3d(),
        viewDetails: {
          acs: "0x789",
          disable3dManipulations: false,
        },
      };

      const result = extractViewDetails3d(input);

      expect(result.acs).toBe("0x789");
      expect(result.disable3dManipulations).toBe(false);
      expect(result.modelClipGroups).toBeUndefined();
    });

    it("handles complex modelClipGroups with shape clips", () => {
      const input: ViewITwin3d = {
        ...createMinimalViewITwin3d(),
        viewDetails: {
          modelClipGroups: [
            {
              models: ["0xA"],
              clipVectors: [
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
            },
          ],
        },
      };

      const result = extractViewDetails3d(input);

      expect(result.modelClipGroups).toHaveLength(1);
      expect(result.modelClipGroups[0].models).toEqual(["0xA"]);
    });
  });

  describe("viewDetailsMappings", () => {
    it("exports viewDetailsMappings as an array", () => {
      expect(Array.isArray(viewDetailsMappings)).toBe(true);
      expect(viewDetailsMappings.length).toBeGreaterThan(0);
    });
  });

  describe("snapshot tests", () => {
    it("matches snapshot for full 2D view details extraction", () => {
      const input = createMinimalViewITwin2d();

      const result = extractViewDetails2d(input);

      expect(result).toMatchSnapshot();
    });

    it("matches snapshot for full 3D view details extraction", () => {
      const input = createMinimalViewITwin3d();

      const result = extractViewDetails3d(input);

      expect(result).toMatchSnapshot();
    });
  });
});
