/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @itwin/core-common for ColorDef dependency
vi.mock("@itwin/core-common", () => ({
  ColorDef: {
    isValidColor: (value: unknown) => {
      return typeof value === "number" && value >= 0 && value <= 0xffffffff;
    },
  },
}));

import {
  extractNumber,
  extractBoolean,
  extractString,
  extractSimpleArray,
  extractColor,
  extractColorLegacy,
  applyExtraction,
  extractArrayConditionally,
  extractObject,
  extractArray,
  extractArray2d,
  extractConditionally,
  simpleTypeOf,
  simpleTypeOrArrayOf,
  transformColor,
  transformColorLegacy,
  isAnyColorFormat,
} from "../../translation/extractionUtilities.js";

// ============================================================================
// Tests
// ============================================================================

describe("extractionUtilities", () => {
  describe("simpleTypeOf", () => {
    it("returns function that checks typeof for numbers", () => {
      const checker = simpleTypeOf("number");
      expect(checker(42)).toBe(true);
      expect(checker("42")).toBe(false);
      expect(checker(null)).toBe(false);
    });

    it("returns function that checks typeof for strings", () => {
      const checker = simpleTypeOf("string");
      expect(checker("hello")).toBe(true);
      expect(checker(42)).toBe(false);
    });

    it("returns function that checks typeof for booleans", () => {
      const checker = simpleTypeOf("boolean");
      expect(checker(true)).toBe(true);
      expect(checker(false)).toBe(true);
      expect(checker(1)).toBe(false);
    });
  });

  describe("simpleTypeOrArrayOf", () => {
    it("checks for single value of type", () => {
      const checker = simpleTypeOrArrayOf(["number"]);
      expect(checker(42)).toBe(true);
      expect(checker("42")).toBe(false);
    });

    it("checks for array of type", () => {
      const checker = simpleTypeOrArrayOf(["number"]);
      expect(checker([1, 2, 3])).toBe(true);
      expect(checker([1, "2", 3])).toBe(false);
    });

    it("checks multiple types", () => {
      const checker = simpleTypeOrArrayOf(["number", "string"]);
      expect(checker(42)).toBe(true);
      expect(checker("hello")).toBe(true);
      expect(checker(true)).toBe(false);
    });
  });

  describe("extractNumber", () => {
    it("extracts valid numbers", () => {
      const input = { value: 42 };
      const output: Record<string, unknown> = {};

      extractNumber("value")(input, output);

      expect(output.value).toBe(42);
    });

    it("extracts zero as valid number", () => {
      const input = { value: 0 };
      const output: Record<string, unknown> = {};

      extractNumber("value")(input, output);

      expect(output.value).toBe(0);
    });

    it("extracts negative numbers", () => {
      const input = { value: -100.5 };
      const output: Record<string, unknown> = {};

      extractNumber("value")(input, output);

      expect(output.value).toBe(-100.5);
    });

    it("ignores non-numbers", () => {
      const input = { value: "42" };
      const output: Record<string, unknown> = {};

      extractNumber("value")(input, output);

      expect(output.value).toBeUndefined();
    });

    it("uses custom output accessor when provided", () => {
      const input = { oldName: 42 };
      const output: Record<string, unknown> = {};

      extractNumber("oldName", "newName")(input, output);

      expect(output.newName).toBe(42);
      expect(output.oldName).toBeUndefined();
    });
  });

  describe("extractBoolean", () => {
    it("extracts true", () => {
      const input = { flag: true };
      const output: Record<string, unknown> = {};

      extractBoolean("flag")(input, output);

      expect(output.flag).toBe(true);
    });

    it("extracts false", () => {
      const input = { flag: false };
      const output: Record<string, unknown> = {};

      extractBoolean("flag")(input, output);

      expect(output.flag).toBe(false);
    });

    it("ignores non-booleans (truthy numbers)", () => {
      const input = { flag: 1 };
      const output: Record<string, unknown> = {};

      extractBoolean("flag")(input, output);

      expect(output.flag).toBeUndefined();
    });

    it("ignores non-booleans (strings)", () => {
      const input = { flag: "true" };
      const output: Record<string, unknown> = {};

      extractBoolean("flag")(input, output);

      expect(output.flag).toBeUndefined();
    });
  });

  describe("extractString", () => {
    it("extracts valid strings", () => {
      const input = { name: "hello" };
      const output: Record<string, unknown> = {};

      extractString("name")(input, output);

      expect(output.name).toBe("hello");
    });

    it("extracts empty strings", () => {
      const input = { name: "" };
      const output: Record<string, unknown> = {};

      extractString("name")(input, output);

      expect(output.name).toBe("");
    });

    it("preserves unicode", () => {
      const input = { name: "こんにちは世界 🌍" };
      const output: Record<string, unknown> = {};

      extractString("name")(input, output);

      expect(output.name).toBe("こんにちは世界 🌍");
    });

    it("ignores non-strings", () => {
      const input = { name: 123 };
      const output: Record<string, unknown> = {};

      extractString("name")(input, output);

      expect(output.name).toBeUndefined();
    });
  });

  describe("extractSimpleArray", () => {
    it("extracts when all elements pass type check", () => {
      const input = { ids: ["0x1", "0x2", "0x3"] };
      const output: Record<string, unknown> = {};

      extractSimpleArray(simpleTypeOf("string"), "ids")(input, output);

      expect(output.ids).toEqual(["0x1", "0x2", "0x3"]);
    });

    it("omits property when any element fails type check (current behavior)", () => {
      const input = { ids: ["0x1", 123, "0x3"] }; // Mixed types
      const output: Record<string, unknown> = {};

      extractSimpleArray(simpleTypeOf("string"), "ids")(input, output);

      // CRITICAL: Current behavior is to omit, not filter
      expect(output.ids).toBeUndefined();
    });

    it("extracts empty arrays", () => {
      const input = { ids: [] };
      const output: Record<string, unknown> = {};

      extractSimpleArray(simpleTypeOf("string"), "ids")(input, output);

      expect(output.ids).toEqual([]);
    });

    it("omits when value is not an array", () => {
      const input = { ids: "not an array" };
      const output: Record<string, unknown> = {};

      extractSimpleArray(simpleTypeOf("string"), "ids")(input, output);

      expect(output.ids).toBeUndefined();
    });

    it("uses custom output accessor", () => {
      const input = { oldIds: [1, 2, 3] };
      const output: Record<string, unknown> = {};

      extractSimpleArray(
        simpleTypeOf("number"),
        "oldIds",
        "newIds",
      )(input, output);

      expect(output.newIds).toEqual([1, 2, 3]);
    });
  });

  describe("extractColor / transformColor", () => {
    it("transforms schema RGB format to ColorDef", () => {
      const input = { color: { red: 255, green: 128, blue: 64 } };
      const output: Record<string, unknown> = {};

      extractColor("color")(input, output);

      // Result should be a number in 0xTTBBGGRR format
      expect(typeof output.color).toBe("number");
    });

    it("returns ColorDef number as-is", () => {
      const colorDef = 0x00ff8040; // Valid ColorDef
      const input = { color: colorDef };
      const output: Record<string, unknown> = {};

      extractColor("color")(input, output);

      expect(output.color).toBe(colorDef);
    });

    it("transformColor with {r,g,b} format returns undefined (current behavior)", () => {
      const rgbInput = { r: 255, g: 128, b: 64 };
      const result = transformColor(rgbInput);

      // CRITICAL: Current behavior - {r,g,b} format is not supported and returns undefined
      expect(result).toBeUndefined();
    });
  });

  describe("extractColorLegacy / transformColorLegacy", () => {
    it("transforms schema RGB to legacy format {red,green,blue}", () => {
      const input = { red: 255, green: 128, blue: 64 };
      const result = transformColorLegacy(input);

      expect(result).toEqual({ red: 255, green: 128, blue: 64 });
    });

    it("transforms ColorDef to legacy format", () => {
      const colorDef = 0x00408040; // R=64, G=128, B=64
      const result = transformColorLegacy(colorDef);

      expect(result).toEqual({
        red: 64,
        green: 128,
        blue: 64,
      });
    });

    it("transforms {r,g,b} to legacy format", () => {
      const input = { r: 255, g: 128, b: 64 };
      const result = transformColorLegacy(input);

      expect(result).toEqual({ red: 255, green: 128, blue: 64 });
    });

    it("preserves alpha when present in ColorDef", () => {
      const colorDefWithAlpha = 0x80408040; // Has alpha (transparency)
      const result = transformColorLegacy(colorDefWithAlpha);

      expect(result!.alpha).toBeDefined();
    });
  });

  describe("isAnyColorFormat", () => {
    it("accepts ColorDef number", () => {
      expect(isAnyColorFormat(0x00ff8040)).toBe(true);
    });

    it("accepts schema RGB format", () => {
      expect(isAnyColorFormat({ red: 255, green: 128, blue: 64 })).toBe(true);
    });

    it("accepts {r,g,b} format", () => {
      expect(isAnyColorFormat({ r: 255, g: 128, b: 64 })).toBe(true);
    });

    it("rejects invalid formats", () => {
      expect(isAnyColorFormat("red")).toBe(false);
      expect(isAnyColorFormat(null)).toBe(false);
      expect(isAnyColorFormat({ x: 1, y: 2 })).toBe(false);
    });
  });

  describe("applyExtraction", () => {
    it("applies all mappings", () => {
      const input = {
        num: 42,
        str: "hello",
        flag: true,
      };
      const output: Record<string, unknown> = {};

      applyExtraction(input, output, [
        extractNumber("num"),
        extractString("str"),
        extractBoolean("flag"),
      ]);

      expect(output.num).toBe(42);
      expect(output.str).toBe("hello");
      expect(output.flag).toBe(true);
    });

    it("handles missing fields gracefully", () => {
      const input = { num: 42 };
      const output: Record<string, unknown> = {};

      applyExtraction(input, output, [
        extractNumber("num"),
        extractString("missingStr"),
        extractBoolean("missingFlag"),
      ]);

      expect(output.num).toBe(42);
      expect(output.missingStr).toBeUndefined();
      expect(output.missingFlag).toBeUndefined();
    });
  });

  describe("extractObject", () => {
    it("extracts nested object with mappings", () => {
      const input = {
        nested: {
          value: 42,
          name: "test",
        },
      };
      const output: Record<string, unknown> = {};

      extractObject([extractNumber("value"), extractString("name")], "nested")(
        input,
        output,
      );

      expect(output.nested).toEqual({ value: 42, name: "test" });
    });

    it("ignores undefined nested objects", () => {
      const input = {};
      const output: Record<string, unknown> = {};

      extractObject([extractNumber("value")], "nested")(input, output);

      expect(output.nested).toBeUndefined();
    });
  });

  describe("extractArray", () => {
    it("extracts array with mappings applied to each element", () => {
      const input = {
        items: [
          { id: 1, name: "a" },
          { id: 2, name: "b" },
        ],
      };
      const output: Record<string, unknown> = {};

      extractArray([extractNumber("id"), extractString("name")], "items")(
        input,
        output,
      );

      expect(output.items).toEqual([
        { id: 1, name: "a" },
        { id: 2, name: "b" },
      ]);
    });
  });

  describe("extractArray2d", () => {
    it("extracts 2D array with mappings", () => {
      const input = {
        grid: [
          [{ val: 1 }, { val: 2 }],
          [{ val: 3 }, { val: 4 }],
        ],
      };
      const output: Record<string, unknown> = {};

      extractArray2d([extractNumber("val")], "grid")(input, output);

      expect(output.grid).toEqual([
        [{ val: 1 }, { val: 2 }],
        [{ val: 3 }, { val: 4 }],
      ]);
    });
  });

  describe("extractArrayConditionally", () => {
    it("routes by discriminator", () => {
      const input = {
        items: [
          { planes: { clips: [[{ dist: 10 }]] } },
          { shape: { points: [[0, 0, 0]] } },
        ],
      };
      const output: Record<string, unknown> = {};

      extractArrayConditionally(
        [
          {
            discriminator: "planes",
            mappings: [extractObject([extractNumber("invisible")], "planes")],
          },
          {
            discriminator: "shape",
            mappings: [
              extractObject(
                [extractSimpleArray(simpleTypeOf("number"), "points")],
                "shape",
              ),
            ],
          },
        ],
        "items",
      )(input, output);

      expect(output.items).toHaveLength(2);
      expect((output.items as unknown[])[0]).toHaveProperty("planes");
      expect((output.items as unknown[])[1]).toHaveProperty("shape");
    });

    it("handles null entry gracefully (throws in current implementation)", () => {
      const input = {
        items: [null, { planes: { clips: [] } }],
      };
      const output: Record<string, unknown> = {};

      // CRITICAL: Current behavior throws on null entry
      expect(() => {
        extractArrayConditionally(
          [{ discriminator: "planes", mappings: [] }],
          "items",
        )(input, output);
      }).toThrow();
    });
  });

  describe("extractConditionally", () => {
    it("applies mappings when discriminator matches", () => {
      const input = {
        value: { type: "numeric", num: 42 },
      };
      const output: Record<string, unknown> = {};

      extractConditionally(
        [
          {
            discriminator: "num",
            mappings: [extractNumber("num")],
          },
        ],
        "value",
      )(input, output);

      expect(output.value).toEqual({ num: 42 });
    });

    it("uses function discriminator", () => {
      const input = {
        value: { data: 42 },
      };
      const output: Record<string, unknown> = {};

      extractConditionally(
        [
          {
            discriminator: (v: unknown) =>
              typeof (v as { data: unknown }).data === "number",
            mappings: [extractNumber("data")],
          },
        ],
        "value",
      )(input, output);

      expect(output.value).toEqual({ data: 42 });
    });
  });
});
