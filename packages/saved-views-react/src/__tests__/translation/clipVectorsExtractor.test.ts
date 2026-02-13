/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { describe, it, expect } from "vitest";

import { extractClipVectors } from "../../translation/clipVectorsExtractor.js";
import type { ViewITwin3d } from "@itwin/saved-views-client";

// ============================================================================
// Fixtures (TypeScript objects for ESM compatibility)
// ============================================================================

const viewWithPlaneClips: Partial<ViewITwin3d> = {
  clipVectors: [
    {
      planes: {
        clips: [
          [
            { normal: [1, 0, 0], distance: 10 },
            { normal: [0, 1, 0], distance: 20 },
          ],
        ],
        invisible: false,
      },
    },
  ],
};

const viewWithShapeClips: Partial<ViewITwin3d> = {
  clipVectors: [
    {
      shape: {
        points: [
          [0, 0, 0],
          [100, 0, 0],
          [100, 100, 0],
          [0, 100, 0],
        ],
        transform: [
          [1, 0, 0, 0],
          [0, 1, 0, 0],
          [0, 0, 1, 0],
        ],
        zLow: 0,
        zHigh: 50,
        mask: false,
        invisible: false,
      },
    },
  ],
};

const viewWithMixedClips: Partial<ViewITwin3d> = {
  clipVectors: [
    {
      planes: {
        clips: [[{ normal: [0, 0, 1], distance: 25 }]],
      },
    },
    {
      shape: {
        points: [
          [10, 10, 0],
          [90, 10, 0],
          [90, 90, 0],
          [10, 90, 0],
        ],
        zLow: -10,
        zHigh: 100,
      },
    },
  ],
};

const viewWithoutClips: Partial<ViewITwin3d> = {
  origin: [0, 0, 0],
  extents: [100, 100, 100],
};

const viewWithShapeNoTransform: Partial<ViewITwin3d> = {
  clipVectors: [
    {
      shape: {
        points: [
          [0, 0, 0],
          [50, 0, 0],
          [50, 50, 0],
        ],
        zLow: 0,
        zHigh: 25,
      },
    },
  ],
};

const viewWithEmptyClipVectors: Partial<ViewITwin3d> = {
  clipVectors: [],
};

const viewWithMultiplePlaneClipSets: Partial<ViewITwin3d> = {
  clipVectors: [
    {
      planes: {
        clips: [
          [
            {
              normal: [1, 0, 0],
              distance: 50,
              invisible: false,
              interior: false,
            },
            {
              normal: [-1, 0, 0],
              distance: -100,
              invisible: false,
              interior: false,
            },
          ],
          [
            {
              normal: [0, 1, 0],
              distance: 50,
              invisible: true,
              interior: true,
            },
          ],
        ],
        invisible: false,
      },
    },
  ],
};

// ============================================================================
// Tests
// ============================================================================

describe("extractClipVectors", () => {
  describe("plane clips", () => {
    it("extracts plane clips correctly", () => {
      const result = extractClipVectors(viewWithPlaneClips);

      expect(result).toBeDefined();
      expect(result.clip).toBeDefined();
      expect(result.clip).toHaveLength(1);
      expect(result.clip[0].planes).toBeDefined();
      expect(result.clip[0].planes.clips).toHaveLength(1);
      expect(result.clip[0].planes.clips[0]).toHaveLength(2);
    });

    it("converts distance field to dist", () => {
      const result = extractClipVectors(viewWithPlaneClips);

      const firstClip = result.clip[0].planes.clips[0][0];
      expect(firstClip.dist).toBe(10);
      expect(firstClip.distance).toBeUndefined();
    });

    it("preserves normal array values", () => {
      const result = extractClipVectors(viewWithPlaneClips);

      const firstClip = result.clip[0].planes.clips[0][0];
      expect(firstClip.normal).toEqual([1, 0, 0]);
    });

    it("preserves invisible and interior flags on planes", () => {
      const result = extractClipVectors(viewWithMultiplePlaneClipSets);

      expect(result.clip[0].planes.clips[1][0].invisible).toBe(true);
      expect(result.clip[0].planes.clips[1][0].interior).toBe(true);
    });

    it("extracts multiple clip sets within planes", () => {
      const result = extractClipVectors(viewWithMultiplePlaneClipSets);

      expect(result.clip[0].planes.clips).toHaveLength(2);
      expect(result.clip[0].planes.clips[0]).toHaveLength(2);
      expect(result.clip[0].planes.clips[1]).toHaveLength(1);
    });
  });

  describe("shape clips", () => {
    it("extracts shape clips correctly", () => {
      const result = extractClipVectors(viewWithShapeClips);

      expect(result).toBeDefined();
      expect(result.clip).toBeDefined();
      expect(result.clip).toHaveLength(1);
      expect(result.clip[0].shape).toBeDefined();
    });

    it("preserves shape points", () => {
      const result = extractClipVectors(viewWithShapeClips);

      expect(result.clip[0].shape.points).toEqual([
        [0, 0, 0],
        [100, 0, 0],
        [100, 100, 0],
        [0, 100, 0],
      ]);
    });

    it("converts transform field to trans", () => {
      const result = extractClipVectors(viewWithShapeClips);

      expect(result.clip[0].shape.trans).toBeDefined();
      expect(result.clip[0].shape.transform).toBeUndefined();
      expect(result.clip[0].shape.trans).toEqual([
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
      ]);
    });

    it("converts zLow/zHigh to zlow/zhigh", () => {
      const result = extractClipVectors(viewWithShapeClips);

      expect(result.clip[0].shape.zlow).toBe(0);
      expect(result.clip[0].shape.zhigh).toBe(50);
      expect(result.clip[0].shape.zLow).toBeUndefined();
      expect(result.clip[0].shape.zHigh).toBeUndefined();
    });

    it("preserves mask and invisible flags", () => {
      const result = extractClipVectors(viewWithShapeClips);

      expect(result.clip[0].shape.mask).toBe(false);
      expect(result.clip[0].shape.invisible).toBe(false);
    });

    it("handles shapes without transform", () => {
      const result = extractClipVectors(viewWithShapeNoTransform);

      expect(result.clip[0].shape).toBeDefined();
      expect(result.clip[0].shape.trans).toBeUndefined();
      expect(result.clip[0].shape.points).toHaveLength(3);
    });
  });

  describe("mixed clips", () => {
    it("handles mixed clip types (planes and shapes)", () => {
      const result = extractClipVectors(viewWithMixedClips);

      expect(result.clip).toHaveLength(2);
      expect(result.clip[0].planes).toBeDefined();
      expect(result.clip[1].shape).toBeDefined();
    });

    it("preserves order of mixed clips", () => {
      const result = extractClipVectors(viewWithMixedClips);

      // First clip should be planes
      expect(result.clip[0].planes.clips[0][0].dist).toBe(25);
      // Second clip should be shape
      expect(result.clip[1].shape.zhigh).toBe(100);
    });
  });

  describe("edge cases", () => {
    it("returns undefined for missing clipVectors property", () => {
      const result = extractClipVectors(viewWithoutClips);

      expect(result).toBeUndefined();
    });

    it("returns object with empty clip array for empty clipVectors", () => {
      const result = extractClipVectors(viewWithEmptyClipVectors);

      // Current behavior: returns { clip: [] } for empty array
      expect(result).toBeDefined();
      expect(result.clip).toEqual([]);
    });

    it("handles view with only origin and extents (no clipVectors)", () => {
      const viewData = {
        origin: [100, 200, 300],
        extents: [500, 600, 700],
      };

      const result = extractClipVectors(viewData);
      expect(result).toBeUndefined();
    });
  });

  describe("data integrity", () => {
    it("preserves transform matrix values exactly", () => {
      const viewWithPreciseTransform: Partial<ViewITwin3d> = {
        clipVectors: [
          {
            shape: {
              points: [[0, 0, 0]],
              transform: [
                [1.5, 0.5, 0.25, 10.123],
                [0.5, 2.0, 0.75, 20.456],
                [0.25, 0.75, 3.0, 30.789],
              ],
              zLow: -5.5,
              zHigh: 15.5,
            },
          },
        ],
      };

      const result = extractClipVectors(viewWithPreciseTransform);

      expect(result.clip[0].shape.trans).toEqual([
        [1.5, 0.5, 0.25, 10.123],
        [0.5, 2.0, 0.75, 20.456],
        [0.25, 0.75, 3.0, 30.789],
      ]);
    });

    it("preserves point coordinate precision", () => {
      const viewWithPrecisePoints: Partial<ViewITwin3d> = {
        clipVectors: [
          {
            shape: {
              points: [
                [0.123456789, 1.23456789, 2.345678901],
                [3.456789012, 4.567890123, 5.678901234],
              ],
              zLow: 0,
              zHigh: 10,
            },
          },
        ],
      };

      const result = extractClipVectors(viewWithPrecisePoints);

      expect(result.clip[0].shape.points[0]).toEqual([
        0.123456789, 1.23456789, 2.345678901,
      ]);
      expect(result.clip[0].shape.points[1]).toEqual([
        3.456789012, 4.567890123, 5.678901234,
      ]);
    });
  });

  describe("snapshot", () => {
    it("matches snapshot for plane clips", () => {
      const result = extractClipVectors(viewWithPlaneClips);
      expect(result).toMatchSnapshot();
    });

    it("matches snapshot for shape clips", () => {
      const result = extractClipVectors(viewWithShapeClips);
      expect(result).toMatchSnapshot();
    });

    it("matches snapshot for mixed clips", () => {
      const result = extractClipVectors(viewWithMixedClips);
      expect(result).toMatchSnapshot();
    });
  });
});
