/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { type IModelConnection } from "@itwin/core-frontend";

import { SavedViewsManager } from "../SavedViewsManager";
import { DesktopViewsCache } from "./DesktopViewsCache";
import { GroupCache } from "./GroupCache";
import { SavedViewsCache } from "./SavedViewsCache";

/** WIP not sure if this is needed, SavedViewCache per IModelConnection */

export class IModelConnectionCache {
  private static _viewsCache: Map<IModelConnection, SavedViewsCache> = new Map<
    IModelConnection,
    SavedViewsCache
  >();
  private static _groupCache: Map<IModelConnection, GroupCache> = new Map<
    IModelConnection,
    GroupCache
  >();
  private static _desktopViewsCache: Map<IModelConnection, DesktopViewsCache> =
    new Map<IModelConnection, DesktopViewsCache>();

  public static createSavedViewCache(key: IModelConnection): SavedViewsCache | undefined {
    return this.getSavedViewCache(key);
  }

  public static getSavedViewCache(key: IModelConnection): SavedViewsCache | undefined {
    if (this._viewsCache.get(key) === undefined) {
      const savedViewCache = new SavedViewsCache(SavedViewsManager.savedViewsClient);
      this._viewsCache.set(key, savedViewCache);
    }

    return this._viewsCache.get(key);
  }

  public static createGroupCache(key: IModelConnection): GroupCache | undefined {
    return this.getGroupCache(key);
  }

  public static getDesktopViewsCache(key: IModelConnection): DesktopViewsCache | undefined {
    if (this._desktopViewsCache.get(key) === undefined) {
      const desktopViewsCache = new DesktopViewsCache(key);
      this._desktopViewsCache.set(key, desktopViewsCache);
    }

    return this._desktopViewsCache.get(key);
  }

  public static getGroupCache(key: IModelConnection): GroupCache | undefined {
    if (this._groupCache.get(key) === undefined) {
      const groupCache = new GroupCache(SavedViewsManager.groupClient);
      this._groupCache.set(key, groupCache);
    }

    return this._groupCache.get(key);
  }
}
