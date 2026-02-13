/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { describe, it, expect } from "vitest";

import {
  extractClipVectorsFromLegacy,
  isValidClipPrimitive,
} from "../../translation/clipVectorsLegacyExtractor.js";
import type { SpatialViewDefinitionProps } from "@itwin/core-common";
import {
  legacyViewWithPlaneClips,
  legacyViewWithShapeClips,
  legacyViewWithMixedClips,
  legacyViewWithEmptyClip,
  legacyViewWithInvalidClipPrimitive,
  legacyViewWithoutClip,
  legacyViewWithoutViewDetails,
} from "../fixtures/legacyViewPayloads.js";

// ============================================================================
// Tests
// ============================================================================

describe("extractClipVectorsFromLegacy", () => {
  describe("plane clips", () => {
    it("converts dist field to distance", () => {
      const result = extractClipVectorsFromLegacy(
        legacyViewWithPlaneClips as SpatialViewDefinitionProps,
      );

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result![0]).toHaveProperty("planes");

      const planes = (
        result![0] as {
          planes: { clips: Array<Array<{ distance?: number; dist?: number }>> };
        }
      ).planes;
      const firstClip = planes.clips[0][0];
      expect(firstClip.distance).toBe(50);
      expect(firstClip.dist).toBeUndefined();
    });

    it("preserves normal array values", () => {
      const result = extractClipVectorsFromLegacy(
        legacyViewWithPlaneClips as SpatialViewDefinitionProps,
      );

      const planes = (
        result![0] as { planes: { clips: Array<Array<{ normal: number[] }>> } }
      ).planes;
      expect(planes.clips[0][0].normal).toEqual([1, 0, 0]);
    });

    it("extracts multiple clip sets within planes", () => {
      const result = extractClipVectorsFromLegacy(
        legacyViewWithPlaneClips as SpatialViewDefinitionProps,
      );

      const planes = (result![0] as { planes: { clips: unknown[][] } }).planes;
      expect(planes.clips).toHaveLength(2);
      expect(planes.clips[0]).toHaveLength(2);
      expect(planes.clips[1]).toHaveLength(1);
    });
  });

  describe("shape clips", () => {
    it("converts trans field to transform", () => {
      const result = extractClipVectorsFromLegacy(
        legacyViewWithShapeClips as SpatialViewDefinitionProps,
      );

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);

      const shape = (
        result![0] as { shape: { transform?: unknown; trans?: unknown } }
      ).shape;
      expect(shape.transform).toBeDefined();
      expect(shape.trans).toBeUndefined();
    });

    it("converts zlow/zhigh to zLow/zHigh", () => {
      const result = extractClipVectorsFromLegacy(
        legacyViewWithShapeClips as SpatialViewDefinitionProps,
      );

      const shape = (
        result![0] as {
          shape: {
            zLow?: number;
            zHigh?: number;
            zlow?: number;
            zhigh?: number;
          };
        }
      ).shape;
      expect(shape.zLow).toBe(0);
      expect(shape.zHigh).toBe(50);
      expect(shape.zlow).toBeUndefined();
      expect(shape.zhigh).toBeUndefined();
    });

    it("preserves shape points", () => {
      const result = extractClipVectorsFromLegacy(
        legacyViewWithShapeClips as SpatialViewDefinitionProps,
      );

      const shape = (result![0] as { shape: { points: number[][] } }).shape;
      expect(shape.points).toEqual([
        [0, 0, 0],
        [100, 0, 0],
        [100, 100, 0],
        [0, 100, 0],
      ]);
    });

    it("preserves transform matrix values", () => {
      const result = extractClipVectorsFromLegacy(
        legacyViewWithShapeClips as SpatialViewDefinitionProps,
      );

      const shape = (result![0] as { shape: { transform: number[][] } }).shape;
      expect(shape.transform).toEqual([
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
      ]);
    });
  });

  describe("mixed clips", () => {
    it("handles mixed clip types", () => {
      const result = extractClipVectorsFromLegacy(
        legacyViewWithMixedClips as SpatialViewDefinitionProps,
      );

      expect(result).toBeDefined();
      expect(result).toHaveLength(2);
      expect(result![0]).toHaveProperty("planes");
      expect(result![1]).toHaveProperty("shape");
    });

    it("preserves order of mixed clips", () => {
      const result = extractClipVectorsFromLegacy(
        legacyViewWithMixedClips as SpatialViewDefinitionProps,
      );

      // First should be planes, second should be shape
      const firstClip = result![0] as {
        planes: { clips: Array<Array<{ distance: number }>> };
      };
      const secondClip = result![1] as { shape: { zHigh: number } };

      expect(firstClip.planes.clips[0][0].distance).toBe(25);
      expect(secondClip.shape.zHigh).toBe(100);
    });
  });

  describe("edge cases", () => {
    it("returns undefined for missing viewDetails", () => {
      const result = extractClipVectorsFromLegacy(
        legacyViewWithoutViewDetails as SpatialViewDefinitionProps,
      );

      expect(result).toBeUndefined();
    });

    it("returns undefined for missing clip in viewDetails", () => {
      const result = extractClipVectorsFromLegacy(
        legacyViewWithoutClip as SpatialViewDefinitionProps,
      );

      expect(result).toBeUndefined();
    });

    it("returns empty array for empty clip", () => {
      const result = extractClipVectorsFromLegacy(
        legacyViewWithEmptyClip as SpatialViewDefinitionProps,
      );

      expect(result).toBeDefined();
      expect(result).toEqual([]);
    });

    it("filters invalid clip primitives via isValidClipPrimitive", () => {
      const result = extractClipVectorsFromLegacy(
        legacyViewWithInvalidClipPrimitive as SpatialViewDefinitionProps,
      );

      // Should filter out the empty planes object, keep only valid one
      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result![0]).toHaveProperty("planes");
    });
  });
});

describe("isValidClipPrimitive", () => {
  it("returns true for valid planes clip", () => {
    const validPlanes = {
      planes: {
        clips: [[{ normal: [1, 0, 0], distance: 10 }]],
      },
    };

    expect(isValidClipPrimitive(validPlanes)).toBe(true);
  });

  it("returns true for valid shape clip", () => {
    const validShape = {
      shape: {
        points: [
          [0, 0, 0],
          [1, 0, 0],
          [1, 1, 0],
        ],
        zLow: 0,
        zHigh: 10,
      },
    };

    expect(isValidClipPrimitive(validShape)).toBe(true);
  });

  it("returns false for empty planes object", () => {
    const emptyPlanes = {
      planes: {},
    };

    expect(isValidClipPrimitive(emptyPlanes)).toBe(false);
  });

  it("returns true for planes with clips array", () => {
    const planesWithClips = {
      planes: {
        clips: [],
        invisible: false,
      },
    };

    expect(isValidClipPrimitive(planesWithClips)).toBe(true);
  });

  it("returns true when planes property is not present (shape only)", () => {
    const shapeOnly = {
      shape: {
        points: [[0, 0, 0]],
      },
    };

    expect(isValidClipPrimitive(shapeOnly)).toBe(true);
  });
});
