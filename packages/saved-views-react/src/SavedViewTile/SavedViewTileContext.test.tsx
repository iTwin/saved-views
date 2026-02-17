/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { SavedView } from "../SavedView.js";
import { SavedViewTileContextProvider, useSavedViewTileContext } from "./SavedViewTileContext.js";

describe("SavedViewTileContext", () => {
  const mockSavedView: SavedView = {
    savedViewId: "test-saved-view-id",
    displayName: "Test Saved View",
  };

  it("provides context value to child components", () => {
    let capturedContext;
    const mockSetEditingName = vi.fn();

    function TestComponent() {
      capturedContext = useSavedViewTileContext();
      return <div>Test</div>;
    }

    const contextValue = {
      savedView: mockSavedView,
      setEditingName: mockSetEditingName,
    };

    render(
      <SavedViewTileContextProvider value={contextValue}>
        <TestComponent />
      </SavedViewTileContextProvider>
    );

    expect(capturedContext).toBeDefined();
    expect(capturedContext.savedView).toEqual(mockSavedView);
    expect(capturedContext.setEditingName).toBe(mockSetEditingName);
  });

  it("returns default context when used outside provider", () => {
    let capturedContext;

    function TestComponent() {
      capturedContext = useSavedViewTileContext();
      return <div>Test</div>;
    }

    render(<TestComponent />);

    expect(capturedContext).toBeDefined();
    expect(capturedContext.savedView).toBeDefined();
    expect(capturedContext.savedView.savedViewId).toBe("SavedViewTileContext_NoContext");
    expect(capturedContext.savedView.displayName).toBe("");
    expect(typeof capturedContext.setEditingName).toBe("function");
    // Should not throw when called
    capturedContext.setEditingName(true);
  });

  it("provides context to nested components", () => {
    let outerContext;
    let innerContext;
    const mockSetEditingName = vi.fn();

    function OuterComponent() {
      outerContext = useSavedViewTileContext();
      return <InnerComponent />;
    }

    function InnerComponent() {
      innerContext = useSavedViewTileContext();
      return <div>Inner</div>;
    }

    const contextValue = {
      savedView: mockSavedView,
      setEditingName: mockSetEditingName,
    };

    render(
      <SavedViewTileContextProvider value={contextValue}>
        <OuterComponent />
      </SavedViewTileContextProvider>
    );

    expect(outerContext).toBeDefined();
    expect(innerContext).toBeDefined();
    expect(outerContext).toEqual(innerContext);
    expect(outerContext.savedView).toEqual(mockSavedView);
  });

  it("setEditingName callback can be invoked", () => {
    let capturedContext;
    const mockSetEditingName = vi.fn();

    function TestComponent() {
      capturedContext = useSavedViewTileContext();
      return <div>Test</div>;
    }

    const contextValue = {
      savedView: mockSavedView,
      setEditingName: mockSetEditingName,
    };

    render(
      <SavedViewTileContextProvider value={contextValue}>
        <TestComponent />
      </SavedViewTileContextProvider>
    );

    capturedContext.setEditingName(true);
    expect(mockSetEditingName).toHaveBeenCalledWith(true);

    capturedContext.setEditingName(false);
    expect(mockSetEditingName).toHaveBeenCalledWith(false);
    expect(mockSetEditingName).toHaveBeenCalledTimes(2);
  });
});
