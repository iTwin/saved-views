/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { createContext, useContext } from "react";

import type { SavedView } from "../SavedView.js";

const savedViewTileContext = createContext<SavedViewTileContext | undefined>(undefined);

/** Context that's accessable within `<SavedViewTile />` component. */
export interface SavedViewTileContext {
  savedView: SavedView;
  setEditingName: (value: boolean) => void;
}

/** @internal */
export const SavedViewTileContextProvider = savedViewTileContext.Provider;

/**
 * Context that's accessable within `<SavedViewTile />` component. You can use this to make custom actions for
 * `SavedViewTile`.
 */
export function useSavedViewTileContext(): SavedViewTileContext {
  const contextValue = useContext(savedViewTileContext);
  return contextValue ?? {
    savedView: { id: "SavedViewTileContext_NoContext", displayName: "" },
    setEditingName: () => { },
  };
}
