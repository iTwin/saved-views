/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import type { ViewStateProps } from "@itwin/core-common";
import {
  DrawingViewState,
  IModelApp,
  SheetViewState,
  SpatialViewState,
  type ScreenViewport,
} from "@itwin/core-frontend";

import { applySavedView } from "./applySavedView.js";
import type { SavedViewData } from "./SavedView.js";

/** Minimal client interface required for {@link setView} when passing a saved view ID. */
export interface ViewOperationsClient {
  getSavedViewDataById: (args: { savedViewId: string }) => Promise<SavedViewData>;
  /** Optional: list all saved views as `{ id, displayName }` pairs for name-based lookup. */
  listSavedViews?: () => Promise<{ id: string; displayName: string }[]>;
}

let _client: ViewOperationsClient | undefined;

/**
 * Initialize view operations with a client for ID-based {@link setView} calls.
 * This is optional — {@link getActiveView} and {@link setView} with {@link ViewStateProps}
 * work without initialization.
 */
export function initViewOperations(client: ViewOperationsClient): void {
  _client = client;
}

function getActiveViewport(): ScreenViewport | undefined {
  return IModelApp.viewManager.selectedView;
}

/**
 * Returns the active viewport's current view state as {@link ViewStateProps}.
 * Returns `undefined` if there is no active viewport.
 */
export function getActiveView(): ViewStateProps | undefined {
  return getActiveViewport()?.view.toProps();
}

/**
 * Lists all saved views accessible via the client supplied to {@link initViewOperations}.
 * Returns an array of `{ id, displayName }` objects, or an empty array if no client is set.
 */
export async function listSavedViews(): Promise<{ id: string; displayName: string }[]> {
  return _client?.listSavedViews?.() ?? [];
}

/**
 * Sets the active viewport's view.
 * - When passed a **saved view ID** (string), fetches the saved view data via the
 *   client supplied to {@link initViewOperations} and applies it.
 * - When passed **{@link ViewStateProps}**, constructs a `ViewState` from the props
 *   and applies it directly — no client required.
 * @returns `true` on success, `false` on any failure.
 */
export async function setView(viewIdOrProps: string | ViewStateProps): Promise<boolean> {
  const vp = getActiveViewport();
  if (!vp)
    return false;

  if (typeof viewIdOrProps === "string") {
    if (!_client)
      return false;

    try {
      const savedViewData = await _client.getSavedViewDataById({ savedViewId: viewIdOrProps });
      await applySavedView(vp.iModel, vp, savedViewData);
      return true;
    } catch {
      return false;
    }
  }

  try {
    const viewState = createViewStateFromViewStateProps(viewIdOrProps, vp);
    await viewState.load();
    vp.changeView(viewState);
    return true;
  } catch {
    return false;
  }
}

function createViewStateFromViewStateProps(
  props: ViewStateProps,
  vp: ScreenViewport,
) {
  const className = props.viewDefinitionProps.classFullName.toLowerCase();
  if (className.includes("drawing"))
    return DrawingViewState.createFromProps(props, vp.iModel);
  if (className.includes("sheet"))
    return SheetViewState.createFromProps(props, vp.iModel);
  return SpatialViewState.createFromProps(props, vp.iModel);
}
