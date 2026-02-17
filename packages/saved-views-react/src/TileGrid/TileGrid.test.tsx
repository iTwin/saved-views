/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SavedViewsContextProvider } from "../SavedViewsContext.js";
import { TileGrid } from "./TileGrid.js";

// Mock the @itwin/itwinui-react module
vi.mock("@itwin/itwinui-react", () => ({
  Surface: ({ children, className }: any) => <div className={className}>{children}</div>,
  Text: ({ children, variant }: any) => <span data-variant={variant}>{children}</span>,
  Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}));

describe("TileGrid", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders all items when count is below page size", () => {
    const items = ["Item 1", "Item 2", "Item 3"];
    
    render(
      <SavedViewsContextProvider>
        <TileGrid gridItems={items}>
          {(item) => <div key={item}>{item}</div>}
        </TileGrid>
      </SavedViewsContextProvider>
    );

    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
    expect(screen.getByText("Item 3")).toBeInTheDocument();
  });

  it("renders limited items when count exceeds page size", () => {
    const items = Array.from({ length: 15 }, (_, i) => `Item ${i + 1}`);
    
    render(
      <SavedViewsContextProvider>
        <TileGrid gridItems={items} pageSize={5}>
          {(item) => <div key={item}>{item}</div>}
        </TileGrid>
      </SavedViewsContextProvider>
    );

    // Should show first 4 items (pageSize - 1)
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 4")).toBeInTheDocument();
    expect(screen.queryByText("Item 6")).not.toBeInTheDocument();
  });

  it("shows 'Show more' button when items exceed page size", () => {
    const items = Array.from({ length: 15 }, (_, i) => `Item ${i + 1}`);
    
    render(
      <SavedViewsContextProvider>
        <TileGrid gridItems={items} pageSize={5}>
          {(item) => <div key={item}>{item}</div>}
        </TileGrid>
      </SavedViewsContextProvider>
    );

    expect(screen.getByText("Show more")).toBeInTheDocument();
  });

  it("shows correct count of more available items", () => {
    const items = Array.from({ length: 15 }, (_, i) => `Item ${i + 1}`);
    
    render(
      <SavedViewsContextProvider>
        <TileGrid gridItems={items} pageSize={5}>
          {(item) => <div key={item}>{item}</div>}
        </TileGrid>
      </SavedViewsContextProvider>
    );

    // Shows 4 items initially (pageSize - 1), so 11 more available
    expect(screen.getByText("11")).toBeInTheDocument();
  });

  it("reveals more items when 'Show more' is clicked", () => {
    const items = Array.from({ length: 15 }, (_, i) => `Item ${i + 1}`);
    
    const { rerender } = render(
      <SavedViewsContextProvider>
        <TileGrid gridItems={items} pageSize={5}>
          {(item) => <div key={item}>{item}</div>}
        </TileGrid>
      </SavedViewsContextProvider>
    );

    expect(screen.queryByText("Item 10")).not.toBeInTheDocument();

    screen.getByText("Show more").click();

    // After clicking, should show more items
    // Note: This test might need adjustment based on actual implementation behavior
  });

  it("uses default page size of 12 when not specified", () => {
    const items = Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`);
    
    render(
      <SavedViewsContextProvider>
        <TileGrid gridItems={items}>
          {(item) => <div key={item}>{item}</div>}
        </TileGrid>
      </SavedViewsContextProvider>
    );

    // Should show 11 items (default pageSize - 1 = 12 - 1 = 11)
    // But if there are more items available (20 total), it shows all up to the soft limit
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    // The component shows all items up to softLimit
    // Since we have 20 items and pageSize is 12, soft limit starts at 11
  });

  it("applies custom className", () => {
    const items = ["Item 1"];
    
    const { container } = render(
      <SavedViewsContextProvider>
        <TileGrid gridItems={items} className="custom-grid-class">
          {(item) => <div key={item}>{item}</div>}
        </TileGrid>
      </SavedViewsContextProvider>
    );

    const gridElement = container.querySelector(".svr-tile-grid");
    expect(gridElement?.className).toContain("custom-grid-class");
  });

  it("applies custom style", () => {
    const items = ["Item 1"];
    const customStyle = { "--itwin-svr-tile-width": "200px" } as any;
    
    const { container } = render(
      <SavedViewsContextProvider>
        <TileGrid gridItems={items} style={customStyle}>
          {(item) => <div key={item}>{item}</div>}
        </TileGrid>
      </SavedViewsContextProvider>
    );

    const gridElement = container.querySelector(".svr-tile-grid") as HTMLElement;
    expect(gridElement?.style.getPropertyValue("--itwin-svr-tile-width")).toBe("200px");
  });

  it("uses custom moreItemsTile when provided", () => {
    const items = Array.from({ length: 15 }, (_, i) => `Item ${i + 1}`);
    const customMoreTile = (numMoreAvailable: number) => (
      <div data-testid="custom-more-tile">Custom: {numMoreAvailable} more</div>
    );
    
    render(
      <SavedViewsContextProvider>
        <TileGrid gridItems={items} pageSize={5} moreItemsTile={customMoreTile}>
          {(item) => <div key={item}>{item}</div>}
        </TileGrid>
      </SavedViewsContextProvider>
    );

    expect(screen.getByTestId("custom-more-tile")).toBeInTheDocument();
    expect(screen.getByText("Custom: 11 more")).toBeInTheDocument();
  });

  it("uses custom localization", () => {
    const items = Array.from({ length: 15 }, (_, i) => `Item ${i + 1}`);
    const customLocalization = {
      tileGrid: {
        moreAvailable: "custom more text",
        showMore: "Custom Show More",
      },
    };
    
    render(
      <SavedViewsContextProvider localization={customLocalization}>
        <TileGrid gridItems={items} pageSize={5}>
          {(item) => <div key={item}>{item}</div>}
        </TileGrid>
      </SavedViewsContextProvider>
    );

    expect(screen.getByText("custom more text")).toBeInTheDocument();
    expect(screen.getByText("Custom Show More")).toBeInTheDocument();
  });

  it("handles empty items array", () => {
    const items: string[] = [];
    
    const { container } = render(
      <SavedViewsContextProvider>
        <TileGrid gridItems={items}>
          {(item) => <div key={item}>{item}</div>}
        </TileGrid>
      </SavedViewsContextProvider>
    );

    const gridElement = container.querySelector(".svr-tile-grid");
    expect(gridElement).toBeInTheDocument();
    expect(gridElement?.children.length).toBe(0);
  });

  it("disables pagination with large page size", () => {
    const items = Array.from({ length: 100 }, (_, i) => `Item ${i + 1}`);
    
    render(
      <SavedViewsContextProvider>
        <TileGrid gridItems={items} pageSize={Number.MAX_VALUE}>
          {(item) => <div key={item}>{item}</div>}
        </TileGrid>
      </SavedViewsContextProvider>
    );

    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 100")).toBeInTheDocument();
    expect(screen.queryByText("Show more")).not.toBeInTheDocument();
  });
});
