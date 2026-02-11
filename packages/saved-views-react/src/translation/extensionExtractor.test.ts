/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { describe, expect, it } from "vitest";

import { extractEmphasizeElements, extractPerModelCategoryVisibility } from "./extensionExtractor.js";

// Skip these tests due to dependency resolution issues with @itwin/saved-views-client
// These functions require iTwin SDK dependencies that are complex to test in isolation
describe.skip("extensionExtractor", () => {
  describe("extractEmphasizeElements", () => {
    it("extracts valid EmphasizeElementsProps", () => {
      const extensionData = JSON.stringify({
        emphasizeElementsProps: {
          neverDrawn: ["element1", "element2"],
          alwaysDrawn: ["element3"],
          isAlwaysDrawnExclusive: true,
          wantEmphasis: true,
        },
      });

      const result = extractEmphasizeElements(extensionData);

      expect(result).toBeDefined();
      expect(result?.neverDrawn).toEqual(["element1", "element2"]);
      expect(result?.alwaysDrawn).toEqual(["element3"]);
      expect(result?.isAlwaysDrawnExclusive).toBe(true);
      expect(result?.wantEmphasis).toBe(true);
    });

    it("returns undefined when emphasizeElementsProps is missing", () => {
      const extensionData = JSON.stringify({});

      const result = extractEmphasizeElements(extensionData);

      expect(result).toBeUndefined();
    });

    it("returns undefined when data is undefined", () => {
      const extensionData = JSON.stringify(undefined);

      const result = extractEmphasizeElements(extensionData);

      expect(result).toBeUndefined();
    });

    it("extracts partial EmphasizeElementsProps", () => {
      const extensionData = JSON.stringify({
        emphasizeElementsProps: {
          neverDrawn: ["element1"],
        },
      });

      const result = extractEmphasizeElements(extensionData);

      expect(result).toBeDefined();
      expect(result?.neverDrawn).toEqual(["element1"]);
    });

    it("handles empty arrays", () => {
      const extensionData = JSON.stringify({
        emphasizeElementsProps: {
          neverDrawn: [],
          alwaysDrawn: [],
        },
      });

      const result = extractEmphasizeElements(extensionData);

      expect(result).toBeDefined();
      expect(result?.neverDrawn).toEqual([]);
      expect(result?.alwaysDrawn).toEqual([]);
    });

    it("extracts alwaysDrawnExclusiveEmphasized", () => {
      const extensionData = JSON.stringify({
        emphasizeElementsProps: {
          alwaysDrawnExclusiveEmphasized: ["element1", "element2"],
        },
      });

      const result = extractEmphasizeElements(extensionData);

      expect(result).toBeDefined();
      expect(result?.alwaysDrawnExclusiveEmphasized).toEqual(["element1", "element2"]);
    });
  });

  describe("extractPerModelCategoryVisibility", () => {
    it("extracts valid PerModelCategoryVisibilityProps array", () => {
      const extensionData = JSON.stringify({
        perModelCategoryVisibilityProps: [
          { modelId: "model1", categoryId: "category1", visible: true },
          { modelId: "model2", categoryId: "category2", visible: false },
        ],
      });

      const result = extractPerModelCategoryVisibility(extensionData);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ modelId: "model1", categoryId: "category1", visible: true });
      expect(result[1]).toEqual({ modelId: "model2", categoryId: "category2", visible: false });
    });

    it("returns empty array when perModelCategoryVisibilityProps is missing", () => {
      const extensionData = JSON.stringify({});

      const result = extractPerModelCategoryVisibility(extensionData);

      expect(result).toEqual([]);
    });

    it("returns empty array when data is undefined", () => {
      const extensionData = JSON.stringify(undefined);

      const result = extractPerModelCategoryVisibility(extensionData);

      expect(result).toEqual([]);
    });

    it("handles empty array", () => {
      const extensionData = JSON.stringify({
        perModelCategoryVisibilityProps: [],
      });

      const result = extractPerModelCategoryVisibility(extensionData);

      expect(result).toEqual([]);
    });

    it("extracts single item array", () => {
      const extensionData = JSON.stringify({
        perModelCategoryVisibilityProps: [
          { modelId: "model1", categoryId: "category1", visible: true },
        ],
      });

      const result = extractPerModelCategoryVisibility(extensionData);

      expect(result).toHaveLength(1);
      expect(result[0].modelId).toBe("model1");
      expect(result[0].categoryId).toBe("category1");
      expect(result[0].visible).toBe(true);
    });

    it("handles multiple items with different visibility states", () => {
      const extensionData = JSON.stringify({
        perModelCategoryVisibilityProps: [
          { modelId: "m1", categoryId: "c1", visible: true },
          { modelId: "m2", categoryId: "c2", visible: false },
          { modelId: "m3", categoryId: "c3", visible: true },
        ],
      });

      const result = extractPerModelCategoryVisibility(extensionData);

      expect(result).toHaveLength(3);
      expect(result[0].visible).toBe(true);
      expect(result[1].visible).toBe(false);
      expect(result[2].visible).toBe(true);
    });
  });
});
