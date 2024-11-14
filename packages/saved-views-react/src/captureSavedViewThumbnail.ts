/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import type { ImageBuffer } from "@itwin/core-common";
import { getCenteredViewRect, imageBufferToCanvas, type Viewport } from "@itwin/core-frontend";
import { Point2d } from "@itwin/core-geometry";

/**
 * Generates Saved View thumbnail based on what is currently displayed on the {@linkcode viewport}.
 * @returns base64-encoded URL string, or `undefined` if the thumbnail could not be generated
 *
 * @example
 * const thumbnail = captureSavedViewThumbnail(viewport);
 * console.log(thumbnail); // "data:image/png;base64,iVBORw0KGoAAAANSUhEUg..."
 */
export function captureSavedViewThumbnail(
  viewport: Viewport,
  width = 280,
  height = 200,
): string | undefined {
  const thumbnail = getThumbnail(viewport, width, height);
  if (!thumbnail) {
    return undefined;
  }

  const canvas = imageBufferToCanvas(thumbnail);
  return canvas?.toDataURL("image/png", 1.0);
}

function getThumbnail(vp: Viewport, width: number, height: number): ImageBuffer | undefined {
  const size = new Point2d(width, height);

  // Passing in vp.target.viewRect instead of vp.viewRect because currently vp.viewRect
  // is not updated correctly in some cases when a new dialog is created. The bottom
  // property would be 2px higher than the renderRect in readImageBuffer which
  // caused the method to return undefined. vp.target.viewRect allows us to have
  // the correct dimensions when creating the thumbnail.
  const thumbnail = vp.readImageBuffer({ rect: getCenteredViewRect(vp.target.viewRect), size });
  if (thumbnail) {
    return thumbnail;
  }

  // Since using vp.target.viewRect while creating thumbnail returns undefined
  // for some, we switch back to using vp.viewRect
  return vp.readImageBuffer({ rect: getCenteredViewRect(vp.viewRect), size });
}
