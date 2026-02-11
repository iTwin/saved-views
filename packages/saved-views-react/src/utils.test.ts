/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { isAbortError, trimInputString, useControlledState } from "./utils.js";

describe("utils", () => {
  describe("trimInputString", () => {
    it("replaces multiple spaces with single space", () => {
      expect(trimInputString("hello  world")).toBe("hello world");
      expect(trimInputString("hello   world")).toBe("hello world");
      expect(trimInputString("hello    world    test")).toBe("hello world test");
    });

    it("replaces tabs with single space", () => {
      expect(trimInputString("hello\tworld")).toBe("hello world");
      expect(trimInputString("hello\t\tworld")).toBe("hello world");
    });

    it("replaces newlines with single space", () => {
      expect(trimInputString("hello\nworld")).toBe("hello world");
      expect(trimInputString("hello\n\nworld")).toBe("hello world");
    });

    it("replaces mixed whitespace with single space", () => {
      expect(trimInputString("hello \t\n world")).toBe("hello world");
      expect(trimInputString("  hello  \n\t  world  ")).toBe(" hello world ");
    });

    it("handles empty string", () => {
      expect(trimInputString("")).toBe("");
    });

    it("handles string with only whitespace", () => {
      expect(trimInputString("   ")).toBe(" ");
      expect(trimInputString("\t\n")).toBe(" ");
    });

    it("handles string with no whitespace", () => {
      expect(trimInputString("hello")).toBe("hello");
    });
  });

  describe("isAbortError", () => {
    it("returns true for AbortError", () => {
      const abortError = new DOMException("The operation was aborted.", "AbortError");
      expect(isAbortError(abortError)).toBe(true);
    });

    it("returns false for other DOMException types", () => {
      const timeoutError = new DOMException("Operation timed out.", "TimeoutError");
      expect(isAbortError(timeoutError)).toBe(false);
    });

    it("returns false for regular Error", () => {
      const error = new Error("Regular error");
      expect(isAbortError(error)).toBe(false);
    });

    it("returns false for non-error values", () => {
      expect(isAbortError("not an error")).toBe(false);
      expect(isAbortError(null)).toBe(false);
      expect(isAbortError(undefined)).toBe(false);
      expect(isAbortError(123)).toBe(false);
      expect(isAbortError({})).toBe(false);
    });
  });

  describe("useControlledState", () => {
    it("uses uncontrolled state when controlled state is not provided", () => {
      const { result } = renderHook(() => useControlledState("initial", undefined));

      expect(result.current[0]).toBe("initial");
    });

    it("uses controlled state when provided", () => {
      const { result } = renderHook(() => useControlledState("initial", "controlled"));

      expect(result.current[0]).toBe("controlled");
    });

    it("updates uncontrolled state", () => {
      const { result } = renderHook(() => useControlledState("initial", undefined));

      act(() => {
        result.current[1]("updated");
      });

      expect(result.current[0]).toBe("updated");
    });

    it("calls setControlledState when provided", () => {
      const setControlledState = vi.fn();
      const { result } = renderHook(() => 
        useControlledState("initial", "controlled", setControlledState)
      );

      act(() => {
        result.current[1]("new value");
      });

      expect(setControlledState).toHaveBeenCalledWith("new value");
    });

    it("updates both uncontrolled and controlled state when both are provided", () => {
      const setControlledState = vi.fn();
      const { result, rerender } = renderHook(
        ({ controlled }) => useControlledState("initial", controlled, setControlledState),
        { initialProps: { controlled: "controlled" } }
      );

      expect(result.current[0]).toBe("controlled");

      act(() => {
        result.current[1]("new value");
      });

      expect(setControlledState).toHaveBeenCalledWith("new value");

      // Rerender with updated controlled state
      rerender({ controlled: "new value" });
      expect(result.current[0]).toBe("new value");
    });

    it("handles function updater", () => {
      const { result } = renderHook(() => useControlledState(0, undefined));

      act(() => {
        result.current[1]((prev) => prev + 1);
      });

      expect(result.current[0]).toBe(1);
    });

    it("switches from uncontrolled to controlled", () => {
      const { result, rerender } = renderHook(
        ({ controlled }) => useControlledState("initial", controlled),
        { initialProps: { controlled: undefined as string | undefined } }
      );

      expect(result.current[0]).toBe("initial");

      // Switch to controlled
      rerender({ controlled: "controlled" });
      expect(result.current[0]).toBe("controlled");
    });

    it("switches from controlled to uncontrolled", () => {
      const { result, rerender } = renderHook(
        ({ controlled }) => useControlledState("initial", controlled),
        { initialProps: { controlled: "controlled" as string | undefined } }
      );

      expect(result.current[0]).toBe("controlled");

      // Update internal state while controlled
      act(() => {
        result.current[1]("updated");
      });

      // Switch to uncontrolled
      rerender({ controlled: undefined });
      expect(result.current[0]).toBe("updated");
    });
  });
});
