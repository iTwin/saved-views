/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { PropsWithChildren, ReactElement, createContext, useContext, useMemo } from "react";
import { LocalizationStrings, defaultLocalization } from "./localization.js";

const savedViewsContext = createContext<SavedViewsContext>({ localization: defaultLocalization });
savedViewsContext.displayName = "SavedViewsContext";

export interface SavedViewsContext {
  localization: typeof defaultLocalization;
}

interface SavedViewsContextProviderProps {
  /** Custom strings to be used within `@itwin/saved-views-react` React components. */
  localization?: LocalizationStrings | undefined;
}

/** React context for `@itwin/saved-views-react` components. Optional. */
export function SavedViewsContextProvider(props: PropsWithChildren<SavedViewsContextProviderProps>): ReactElement {
  const localization = useMemo(
    () => {
      if (!props.localization) {
        return defaultLocalization;
      }

      const localization = { ...defaultLocalization };
      replaceStringsRecursively(props.localization, localization);
      return localization;
    },
    [props.localization],
  );

  const contextValue = useMemo(() => ({ localization }), [localization]);

  return (
    <savedViewsContext.Provider value={contextValue}>
      {props.children}
    </savedViewsContext.Provider>
  );
}

export function useSavedViewsContext(): SavedViewsContext {
  return useContext(savedViewsContext);
}

function replaceStringsRecursively(source: Record<string, unknown>, destination: Record<string, unknown>): void {
  for (const key in source) {
    if (!Object.hasOwnProperty.call(destination, key)) {
      return;
    }

    if (typeof source[key] === "string") {
      destination[key] = source[key];
    } else {
      replaceStringsRecursively(source[key] as Record<string, unknown>, destination[key] as Record<string, unknown>);
    }
  }
}
