/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { createContext, useContext } from "react";

import type { SavedViewGroup } from "../SavedView.js";

const savedViewGroupTileContext = createContext<SavedViewGroupTileContext | undefined>(undefined);

/** Context that's accessable within `<SavedViewGroupTile />` component. */
export interface SavedViewGroupTileContext {
  group: SavedViewGroup;
  setEditingName: (value: boolean) => void;
}

/** @internal */
export const SavedViewGroupTileContextProvider = savedViewGroupTileContext.Provider;

/**
 * Context that's accessable within `<SavedViewGroupTile />` component. You can use this to make custom actions for
 * `SavedViewGroupTile`.
 */
export function useSavedViewGroupTileContext(): SavedViewGroupTileContext {
  const contextValue = useContext(savedViewGroupTileContext);
  return contextValue ?? {
    group: { id: "SavedViewGroupTileContext_NoContext", displayName: "" },
    setEditingName: () => { },
  };
}
