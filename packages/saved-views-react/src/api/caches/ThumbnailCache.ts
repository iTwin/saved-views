/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { getClassName } from "@itwin/appui-abstract";
import { Logger } from "@itwin/core-bentley";
import type { ThumbnailProps, ViewDefinitionProps } from "@itwin/core-common";
import { type IModelConnection } from "@itwin/core-frontend";

import { SavedViewsManager } from "../SavedViewsManager";

export class ThumbnailCache {
  private static _thumbnails: Map<string, ThumbnailProps | undefined> = new Map<
    string,
    ThumbnailProps
  >();

  /** Caches thumbnails for desktop views */
  public static async getThumbnail(
    iModelConnection: IModelConnection | undefined,
    viewProps: ViewDefinitionProps,
  ) {
    if (!viewProps.id) {
      return undefined;
    }

    if (ThumbnailCache._thumbnails.has(viewProps.id)) {
      return ThumbnailCache._thumbnails.get(viewProps.id);
    } else if (iModelConnection) {
      let thumbnail: ThumbnailProps | undefined;
      try {
        thumbnail = await iModelConnection.views.getThumbnail(viewProps.id);
      } catch {
        if (!thumbnail) {
          // tslint:disable-next-line:no-console
          Logger.logInfo(
            SavedViewsManager.loggerCategory(getClassName(this)),
            "Failed to obtain a thumbnail from the iModel",
          );
        }
      }

      // There are cases where the file may not have a thumbnail for the view
      // Set even if undefined so that we avoid querying over and over again
      ThumbnailCache._thumbnails.set(viewProps.id, thumbnail);
      return thumbnail;
    }

    return undefined;
  }
}
