/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
/* eslint-disable @typescript-eslint/comma-dangle */
// Copyright (c) Bentley Systems, Incorporated. All rights reserved.
import { BaseMapLayerProps, ImageMapLayerProps } from "@itwin/core-common";
import { ViewData, ViewDataITwinDrawing, ViewDataITwinSheet, ViewDataItwin3d } from "@itwin/saved-views-client";

/**
 * Convert url that potentially contains restricted characters ('&' or '.') to use unrestricated substitute characters ('++and++' or '++dot++')
 * @param extensionData
 */
export const legacyUrlToUrl = (unrestrictedUrl: string): string => {
  const restrictedUrl = unrestrictedUrl
    .replaceAll("&", "++and++")
    .replaceAll(".", "++dot++");
  return restrictedUrl;
};

/**
 * Convert url that potentially contains subtituted characters ('++and++' or '++dot++') to use restricated characters ('&' or '.')
 * @param extensionData
 */
export const urlToLegacyUrl = (restrictedUrl: string): string => {
  const unrestrictedUrl = restrictedUrl
    .replaceAll("++and++", "&")
    .replaceAll("++dot++", ".");
  return unrestrictedUrl;
};

export const convertAllLegacyUrlsToUrls = (
  savedViewData: ViewData,
  convert: (url: string) => string
): void => {
  const displayStyle =
    (savedViewData as ViewDataItwin3d)?.itwin3dView.displayStyle ??
    (savedViewData as ViewDataITwinDrawing)?.itwinDrawingView.displayStyle ??
    (savedViewData as ViewDataITwinSheet)?.itwinSheetView.displayStyle;
  if (displayStyle === undefined) {
    return;
  }

  // Convert legacy urls to restricted urls
  const baseUrl = (displayStyle.mapImagery?.backgroundBase as BaseMapLayerProps)
    ?.url;
  if (displayStyle.mapImagery && baseUrl) {
    (displayStyle.mapImagery.backgroundBase as BaseMapLayerProps).url =
      convert(baseUrl);
  }
  for (const layer of (displayStyle.mapImagery?.overlayLayers ??
    []) as ImageMapLayerProps[]) {
    if (layer.url) {
      layer.url = convert(layer.url);
    }
  }
  for (const layer of (displayStyle.mapImagery?.backgroundLayers ??
    []) as ImageMapLayerProps[]) {
    if (layer.url) {
      layer.url = convert(layer.url);
    }
  }
  for (const model of displayStyle.contextRealityModels ?? []) {
    if (model.tilesetUrl) {
      model.tilesetUrl = convert(model.tilesetUrl);
    }
  }
};
