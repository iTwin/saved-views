/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { describe, it, expect } from "vitest";

import {
  extractEmphasizeElements,
  extractPerModelCategoryVisibility,
} from "../../translation/extensionExtractor.js";

// ============================================================================
// Fixtures
// ============================================================================

const validEmphElementsData = JSON.stringify({
  emphasizeElementsProps: {
    neverDrawn: ["0x100", "0x101"],
    alwaysDrawn: ["0x200", "0x201", "0x202"],
    isAlwaysDrawnExclusive: true,
    alwaysDrawnExclusiveEmphasized: ["0x300"],
    defaultAppearance: {
      rgb: { r: 128, g: 128, b: 128 },
      transparency: 0.5,
      nonLocatable: true,
    },
    wantEmphasis: true,
    unanimatedAppearance: {
      rgb: { r: 200, g: 200, b: 200 },
      weight: 2,
    },
  },
});

const emphElementsWithAppearanceOverride = JSON.stringify({
  emphasizeElementsProps: {
    neverDrawn: ["0x100"],
    appearanceOverride: [
      {
        overrideType: 1,
        color: { red: 255, green: 0, blue: 0 },
        ids: ["0x400", "0x401"],
      },
      {
        overrideType: 2,
        color: { red: 0, green: 255, blue: 0 },
        ids: ["0x500"],
      },
    ],
  },
});

const emphElementsMinimal = JSON.stringify({
  emphasizeElementsProps: {
    neverDrawn: ["0x100"],
  },
});

const emphElementsMissing = JSON.stringify({
  // No emphasizeElementsProps
  someOtherProp: "value",
});

const emphElementsEmpty = JSON.stringify({
  emphasizeElementsProps: {},
});

const malformedJson = "{ invalid json }";

const validPMCVData = JSON.stringify({
  perModelCategoryVisibilityProps: [
    { modelId: "0x300", categoryId: "0x100", visible: true },
    { modelId: "0x300", categoryId: "0x101", visible: false },
    { modelId: "0x301", categoryId: "0x100", visible: true },
  ],
});

const pmcvDataEmpty = JSON.stringify({
  perModelCategoryVisibilityProps: [],
});

const pmcvDataMissing = JSON.stringify({
  // No perModelCategoryVisibilityProps
  someOtherProp: "value",
});

// ============================================================================
// Tests
// ============================================================================

describe("extractEmphasizeElements", () => {
  describe("valid data", () => {
    it("parses valid JSON and extracts props", () => {
      const result = extractEmphasizeElements(validEmphElementsData);

      expect(result).toBeDefined();
      expect(result?.neverDrawn).toEqual(["0x100", "0x101"]);
      expect(result?.alwaysDrawn).toEqual(["0x200", "0x201", "0x202"]);
    });

    it("extracts neverDrawn and alwaysDrawn arrays", () => {
      const result = extractEmphasizeElements(validEmphElementsData);

      expect(result?.neverDrawn).toHaveLength(2);
      expect(result?.alwaysDrawn).toHaveLength(3);
    });

    it("extracts isAlwaysDrawnExclusive boolean", () => {
      const result = extractEmphasizeElements(validEmphElementsData);

      expect(result?.isAlwaysDrawnExclusive).toBe(true);
    });

    it("extracts alwaysDrawnExclusiveEmphasized array", () => {
      const result = extractEmphasizeElements(validEmphElementsData);

      expect(result?.alwaysDrawnExclusiveEmphasized).toEqual(["0x300"]);
    });

    it("extracts defaultAppearance object", () => {
      const result = extractEmphasizeElements(validEmphElementsData);

      expect(result?.defaultAppearance).toBeDefined();
      expect(result?.defaultAppearance?.transparency).toBe(0.5);
      expect(result?.defaultAppearance?.nonLocatable).toBe(true);
    });

    it("extracts wantEmphasis boolean", () => {
      const result = extractEmphasizeElements(validEmphElementsData);

      expect(result?.wantEmphasis).toBe(true);
    });

    it("extracts unanimatedAppearance object", () => {
      const result = extractEmphasizeElements(validEmphElementsData);

      expect(result?.unanimatedAppearance).toBeDefined();
      expect(result?.unanimatedAppearance?.weight).toBe(2);
    });

    it("extracts appearanceOverride array", () => {
      const result = extractEmphasizeElements(
        emphElementsWithAppearanceOverride,
      );

      expect(result?.appearanceOverride).toBeDefined();
      expect(result?.appearanceOverride).toHaveLength(2);
      expect(result?.appearanceOverride?.[0].overrideType).toBe(1);
      expect(result?.appearanceOverride?.[0].ids).toEqual(["0x400", "0x401"]);
    });

    it("handles minimal valid data", () => {
      const result = extractEmphasizeElements(emphElementsMinimal);

      expect(result).toBeDefined();
      expect(result?.neverDrawn).toEqual(["0x100"]);
      expect(result?.alwaysDrawn).toBeUndefined();
    });

    it("handles empty emphasizeElementsProps", () => {
      const result = extractEmphasizeElements(emphElementsEmpty);

      expect(result).toBeDefined();
      expect(result?.neverDrawn).toBeUndefined();
      expect(result?.alwaysDrawn).toBeUndefined();
    });
  });

  describe("edge cases", () => {
    it("returns undefined for missing emphasizeElementsProps", () => {
      const result = extractEmphasizeElements(emphElementsMissing);

      expect(result).toBeUndefined();
    });

    it("throws on malformed JSON (current behavior)", () => {
      expect(() => extractEmphasizeElements(malformedJson)).toThrow(
        SyntaxError,
      );
    });

    it("returns undefined for undefined emphasizeElementsProps", () => {
      const data = JSON.stringify({
        emphasizeElementsProps: undefined,
      });

      const result = extractEmphasizeElements(data);
      expect(result).toBeUndefined();
    });
  });
});

describe("extractPerModelCategoryVisibility", () => {
  describe("valid data", () => {
    it("parses valid array", () => {
      const result = extractPerModelCategoryVisibility(validPMCVData);

      expect(result).toBeDefined();
      expect(result).toHaveLength(3);
    });

    it("extracts all entries with correct properties", () => {
      const result = extractPerModelCategoryVisibility(validPMCVData);

      expect(result[0]).toEqual({
        modelId: "0x300",
        categoryId: "0x100",
        visible: true,
      });

      expect(result[1]).toEqual({
        modelId: "0x300",
        categoryId: "0x101",
        visible: false,
      });

      expect(result[2]).toEqual({
        modelId: "0x301",
        categoryId: "0x100",
        visible: true,
      });
    });

    it("extracts modelId string", () => {
      const result = extractPerModelCategoryVisibility(validPMCVData);

      expect(typeof result[0].modelId).toBe("string");
      expect(result[0].modelId).toBe("0x300");
    });

    it("extracts categoryId string", () => {
      const result = extractPerModelCategoryVisibility(validPMCVData);

      expect(typeof result[0].categoryId).toBe("string");
      expect(result[0].categoryId).toBe("0x100");
    });

    it("extracts visible boolean", () => {
      const result = extractPerModelCategoryVisibility(validPMCVData);

      expect(typeof result[0].visible).toBe("boolean");
      expect(result[0].visible).toBe(true);
      expect(result[1].visible).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("returns empty array for missing props", () => {
      const result = extractPerModelCategoryVisibility(pmcvDataMissing);

      expect(result).toBeDefined();
      expect(result).toEqual([]);
    });

    it("returns empty array for empty perModelCategoryVisibilityProps", () => {
      const result = extractPerModelCategoryVisibility(pmcvDataEmpty);

      expect(result).toBeDefined();
      expect(result).toEqual([]);
    });

    it("throws on malformed JSON (current behavior)", () => {
      expect(() => extractPerModelCategoryVisibility(malformedJson)).toThrow(
        SyntaxError,
      );
    });

    it("returns empty array for undefined perModelCategoryVisibilityProps", () => {
      const data = JSON.stringify({
        perModelCategoryVisibilityProps: undefined,
      });

      const result = extractPerModelCategoryVisibility(data);
      expect(result).toEqual([]);
    });
  });
});
