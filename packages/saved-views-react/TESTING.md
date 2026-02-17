# Testing Guide for saved-views-react

This document describes the testing approach and structure for the `@itwin/saved-views-react` package.

## Overview

The test suite for `saved-views-react` uses **Vitest** as the testing framework and **@testing-library/react** for component testing. The tests are designed to ensure the reliability and correctness of React components, hooks, and utility functions.

## Test Structure

Tests are organized alongside the source files they test, following the pattern `*.test.ts` or `*.test.tsx`.

### Test Files

- **`localization.test.ts`** - Tests for localization strings and default values
- **`utils.test.ts`** - Tests for utility functions (`trimInputString`, `isAbortError`, `useControlledState`)
- **`SavedViewsContext.test.tsx`** - Tests for the SavedViewsContext provider and hook
- **`SavedViewTile/SavedViewTileContext.test.tsx`** - Tests for SavedViewTileContext
- **`SavedViewTile/SavedViewTile.test.tsx`** - Tests for the SavedViewTile component
- **`TileGrid/TileGrid.test.tsx`** - Tests for the TileGrid component
- **`translation/extensionExtractor.test.ts`** - Tests for extension extraction utilities (currently skipped due to dependency complexity)

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:cover
```

## Test Setup

The test environment is configured in `vitest.config.ts`:
- **Environment**: `happy-dom` - A lightweight DOM implementation for testing
- **Setup file**: `src/test-setup.ts` - Imports `@testing-library/jest-dom` for additional matchers

## Testing Approach

### Component Testing

Component tests use mocked versions of external dependencies (e.g., `@itwin/itwinui-react`, `@itwin/itwinui-icons-react`) to isolate the components under test. This approach:
- Reduces test complexity
- Improves test performance
- Focuses tests on the component's logic rather than external library behavior

Example:
```typescript
vi.mock("@itwin/itwinui-react", () => ({
  Tile: {
    Wrapper: ({ children, className, onClick }: any) => (
      <div className={className} onClick={onClick} data-testid="tile-wrapper">
        {children}
      </div>
    ),
    // ... other mocked components
  },
}));
```

### Hook Testing

Hooks are tested using `@testing-library/react`'s `renderHook` utility:

```typescript
const { result } = renderHook(() => useControlledState("initial", undefined));
expect(result.current[0]).toBe("initial");
```

### Utility Function Testing

Pure utility functions are tested with simple unit tests:

```typescript
it("replaces multiple spaces with single space", () => {
  expect(trimInputString("hello  world")).toBe("hello world");
});
```

## Test Coverage

Current test coverage includes:

1. **Context Management**
   - Default and custom localization
   - Context provider behavior
   - Hook usage

2. **Component Rendering**
   - Basic rendering with minimal props
   - Rendering with various prop combinations
   - Custom styling and className application

3. **User Interactions**
   - Click handlers
   - Form interactions
   - Pagination controls

4. **Edge Cases**
   - Empty data handling
   - Missing data gracefully handled
   - Invalid input handling

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Cleanup**: Use `afterEach(cleanup)` to ensure DOM cleanup between tests
3. **Descriptive Names**: Test names should clearly describe what is being tested
4. **AAA Pattern**: Follow Arrange-Act-Assert pattern
5. **Mock External Dependencies**: Mock UI libraries and complex dependencies to focus on component logic

## Future Enhancements

Potential areas for future test expansion:

1. **Integration Tests**: Test component interactions with real API clients (using MSW for mocking)
2. **Accessibility Tests**: Add tests using `axe` for accessibility compliance
3. **Visual Regression Tests**: Consider adding visual regression testing for complex UI components
4. **E2E Tests**: Add end-to-end tests for critical user workflows
5. **Translation Utilities**: Add comprehensive tests for `captureSavedViewData` and `createViewState` functions

## Notes

- Some tests are currently skipped (e.g., `extensionExtractor.test.ts`) due to complex dependency requirements with iTwin SDK packages
- The test suite focuses on React-specific functionality rather than iTwin SDK integration, which should be tested separately
