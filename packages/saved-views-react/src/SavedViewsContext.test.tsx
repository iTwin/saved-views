/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { defaultLocalization } from "./localization.js";
import { SavedViewsContextProvider, useSavedViewsContext } from "./SavedViewsContext.js";

describe("SavedViewsContext", () => {
  it("provides default localization when no custom localization is provided", () => {
    let capturedContext;
    
    function TestComponent() {
      capturedContext = useSavedViewsContext();
      return null;
    }

    render(
      <SavedViewsContextProvider>
        <TestComponent />
      </SavedViewsContextProvider>
    );

    expect(capturedContext).toBeDefined();
    expect(capturedContext.localization).toEqual(defaultLocalization);
  });

  it("provides custom localization when provided", () => {
    let capturedContext;
    const customLocalization = {
      delete: "Custom Delete",
      rename: "Custom Rename",
    };

    function TestComponent() {
      capturedContext = useSavedViewsContext();
      return null;
    }

    render(
      <SavedViewsContextProvider localization={customLocalization}>
        <TestComponent />
      </SavedViewsContextProvider>
    );

    expect(capturedContext).toBeDefined();
    expect(capturedContext.localization.delete).toBe("Custom Delete");
    expect(capturedContext.localization.rename).toBe("Custom Rename");
    // Default values should remain for unprovided strings
    expect(capturedContext.localization.moveToGroupMenu.createGroup).toBe(defaultLocalization.moveToGroupMenu.createGroup);
  });

  it("merges custom localization with defaults recursively", () => {
    let capturedContext;
    const customLocalization = {
      moveToGroupMenu: {
        createGroup: "Custom Create Group",
      },
    };

    function TestComponent() {
      capturedContext = useSavedViewsContext();
      return null;
    }

    render(
      <SavedViewsContextProvider localization={customLocalization}>
        <TestComponent />
      </SavedViewsContextProvider>
    );

    expect(capturedContext).toBeDefined();
    expect(capturedContext.localization.moveToGroupMenu.createGroup).toBe("Custom Create Group");
    // Other nested values should remain default
    expect(capturedContext.localization.moveToGroupMenu.current).toBe(defaultLocalization.moveToGroupMenu.current);
    // Top-level values should remain default
    expect(capturedContext.localization.delete).toBe(defaultLocalization.delete);
  });

  it("useSavedViewsContext returns context value", () => {
    let capturedContext;

    function TestComponent() {
      capturedContext = useSavedViewsContext();
      return <div>Test</div>;
    }

    render(
      <SavedViewsContextProvider>
        <TestComponent />
      </SavedViewsContextProvider>
    );

    expect(capturedContext).toBeDefined();
    expect(capturedContext.localization).toBeDefined();
  });

  it("provides context to nested components", () => {
    let outerContext;
    let innerContext;

    function OuterComponent() {
      outerContext = useSavedViewsContext();
      return <InnerComponent />;
    }

    function InnerComponent() {
      innerContext = useSavedViewsContext();
      return <div>Inner</div>;
    }

    render(
      <SavedViewsContextProvider>
        <OuterComponent />
      </SavedViewsContextProvider>
    );

    expect(outerContext).toBeDefined();
    expect(innerContext).toBeDefined();
    expect(outerContext).toEqual(innerContext);
  });
});
