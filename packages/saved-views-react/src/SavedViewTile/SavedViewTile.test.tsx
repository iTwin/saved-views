/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SavedView, SavedViewTag } from "../SavedView.js";
import { SavedViewsContextProvider } from "../SavedViewsContext.js";
import { SavedViewTile } from "./SavedViewTile.js";

// Mock the @itwin/itwinui-react and @itwin/itwinui-icons-react modules
vi.mock("@itwin/itwinui-react", () => ({
  Tile: {
    Wrapper: ({ children, className, onClick }: any) => (
      <div className={className} onClick={onClick} data-testid="tile-wrapper">
        {children}
      </div>
    ),
    Action: () => <div data-testid="tile-action" />,
    Name: ({ children, className }: any) => <div className={className}>{children}</div>,
    ThumbnailArea: ({ children, className }: any) => <div className={className}>{children}</div>,
    ThumbnailPicture: ({ children }: any) => <div data-testid="thumbnail-picture">{children}</div>,
    ContentArea: ({ children }: any) => <div>{children}</div>,
    Metadata: ({ children }: any) => <div data-testid="tile-metadata">{children}</div>,
  },
  IconButton: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
  Button: ({ children, onClick, className }: any) => (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  ),
  Input: ({ defaultValue, placeholder, autoFocus, onBlur, onFocus, onKeyDown }: any) => (
    <input
      defaultValue={defaultValue}
      placeholder={placeholder}
      autoFocus={autoFocus}
      onBlur={onBlur}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      data-testid="tile-name-input"
    />
  ),
  Text: ({ children, className }: any) => <span className={className}>{children}</span>,
}));

vi.mock("@itwin/itwinui-icons-react", () => ({
  SvgEdit: () => <div data-testid="icon-edit" />,
  SvgMore: () => <div data-testid="icon-more" />,
  SvgSavedView: () => <div data-testid="icon-saved-view" />,
  SvgShare: () => <div data-testid="icon-share" />,
  SvgTag: () => <div data-testid="icon-tag" />,
}));

vi.mock("../LayeredDropdownMenu/LayeredDropdownMenu.js", () => ({
  LayeredDropdownMenu: ({ children }: any) => <div data-testid="dropdown-menu">{children}</div>,
}));

describe("SavedViewTile", () => {
  const mockSavedView: SavedView = {
    savedViewId: "test-saved-view-id",
    displayName: "Test Saved View",
  };

  afterEach(() => {
    cleanup();
  });

  it("renders with minimal props", () => {
    render(
      <SavedViewsContextProvider>
        <SavedViewTile savedView={mockSavedView} />
      </SavedViewsContextProvider>
    );

    expect(screen.getByText("Test Saved View")).toBeInTheDocument();
    expect(screen.getByTestId("tile-wrapper")).toBeInTheDocument();
  });

  it("renders with thumbnail", () => {
    const thumbnail = <img src="test.jpg" alt="thumbnail" />;
    
    render(
      <SavedViewsContextProvider>
        <SavedViewTile savedView={mockSavedView} thumbnail={thumbnail} />
      </SavedViewsContextProvider>
    );

    expect(screen.getByAltText("thumbnail")).toBeInTheDocument();
  });

  it("renders with tags", () => {
    const mockTags = new Map<string, SavedViewTag>([
      ["tag1", { tagId: "tag1", displayName: "Tag 1" }],
      ["tag2", { tagId: "tag2", displayName: "Tag 2" }],
    ]);

    const savedViewWithTags: SavedView = {
      ...mockSavedView,
      tagIds: ["tag1", "tag2"],
    };

    render(
      <SavedViewsContextProvider>
        <SavedViewTile savedView={savedViewWithTags} tags={mockTags} />
      </SavedViewsContextProvider>
    );

    expect(screen.getByText("Tag 1")).toBeInTheDocument();
    expect(screen.getByText("Tag 2")).toBeInTheDocument();
  });

  it("handles missing tags gracefully", () => {
    const mockTags = new Map<string, SavedViewTag>([
      ["tag1", { tagId: "tag1", displayName: "Tag 1" }],
    ]);

    const savedViewWithTags: SavedView = {
      ...mockSavedView,
      tagIds: ["tag1", "tag-missing"],
    };

    render(
      <SavedViewsContextProvider>
        <SavedViewTile savedView={savedViewWithTags} tags={mockTags} />
      </SavedViewsContextProvider>
    );

    // Should render only the valid tag
    expect(screen.getByText("Tag 1")).toBeInTheDocument();
    expect(screen.queryByText("tag-missing")).not.toBeInTheDocument();
  });

  it("calls onClick handler when clicked", () => {
    const handleClick = vi.fn();

    render(
      <SavedViewsContextProvider>
        <SavedViewTile savedView={mockSavedView} onClick={handleClick} />
      </SavedViewsContextProvider>
    );

    screen.getByTestId("tile-wrapper").click();
    expect(handleClick).toHaveBeenCalledWith("test-saved-view-id");
  });

  it("applies custom className", () => {
    render(
      <SavedViewsContextProvider>
        <SavedViewTile savedView={mockSavedView} className="custom-class" />
      </SavedViewsContextProvider>
    );

    const wrapper = screen.getByTestId("tile-wrapper");
    expect(wrapper.className).toContain("custom-class");
    expect(wrapper.className).toContain("svr-tile");
  });

  it("uses custom localization", () => {
    const customLocalization = {
      tile: {
        moreTags: "custom more",
      },
    };

    const mockTags = new Map<string, SavedViewTag>([
      ["tag1", { tagId: "tag1", displayName: "Tag 1" }],
      ["tag2", { tagId: "tag2", displayName: "Tag 2" }],
      ["tag3", { tagId: "tag3", displayName: "Tag 3" }],
    ]);

    const savedViewWithTags: SavedView = {
      ...mockSavedView,
      tagIds: ["tag1", "tag2", "tag3"],
    };

    render(
      <SavedViewsContextProvider localization={customLocalization}>
        <SavedViewTile savedView={savedViewWithTags} tags={mockTags} />
      </SavedViewsContextProvider>
    );

    expect(screen.getByText("Tag 1")).toBeInTheDocument();
  });
});
