/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { ImageBuffer } from "@itwin/core-common";
import { IModelApp, Viewport, canvasToImageBuffer, imageBufferToBase64EncodedPng } from "@itwin/core-frontend";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { SavedViewsManager } from "../api/SavedViewsManager";

interface DownloadViewportLinkProps extends React.HTMLProps<HTMLAnchorElement> {
  handleErrorMessage?: (errorDetails: string) => void;
  handleTracking?: (trackingObj: DownloadViewportTrackingObject) => void;
}

export enum DownloadViewportTrackingEventType {
  error,
  click,
}

export interface DownloadViewportTrackingObject {
  eventType: DownloadViewportTrackingEventType;
  details?: string;
}

export function DownloadViewportLink(props: DownloadViewportLinkProps) {
  const generateThumbnail = useCallback(async () => {
    const reportFailure = (details: string) => {
      if (props.handleErrorMessage) {
        (0, props.handleErrorMessage)(details);
      }
      if (props.handleTracking) {
        (0, props.handleTracking)({
          eventType: DownloadViewportTrackingEventType.error,
          details: details,
        });
      }
    };
    try {
      if (props.handleTracking) {
        (0, props.handleTracking)({
          eventType: DownloadViewportTrackingEventType.click,
        });
      }
      const mainViewport = IModelApp.viewManager.selectedView;
      if (mainViewport && !mainViewport.isDisposed) {
        const data = generateDecoratedViewportUrlData(mainViewport);
        if (data) {
          return {
            hrefEncodedContent: data,
            downloadName: `${SavedViewsManager.translate("ViewportTools.DownloadViewport.filename")}.png`,
          };
        }
      }
      reportFailure(`Viewport: ${mainViewport ? "Disposed" : "None"};`);
    } catch (ex) {
      let error = "Unknown Error";
      if (ex instanceof Error) {
        error = ex.message;
      } else if (typeof ex === "string") {
        error = ex;
      }
      reportFailure(`Uncaught error: ${error}`);
    }

    return;
  }, [props.handleErrorMessage, props.handleTracking]);

  return <DynamicLink contentGeneratingFn={generateThumbnail} {...props} />;
}

interface DynamicLinkProps
  extends Omit<React.HTMLProps<HTMLAnchorElement>, "onClick" | "href"> {
  contentGeneratingFn(): Promise<
    { hrefEncodedContent?: string; downloadName: string; } | undefined
  >;
}

export function DynamicLink({ contentGeneratingFn, ...anchorProps }: DynamicLinkProps) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [linkContent, setLinkContent] = useState<React.HTMLProps<HTMLAnchorElement>>({});
  useEffect(() => {
    if (linkContent.href && linkRef.current) {
      linkRef.current.click();
    }
  }, [linkContent]);
  const generateAndDownloadContent = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
      event.preventDefault();
      contentGeneratingFn().then(
        (generated) => {
          if (
            !generated ||
            !generated.hrefEncodedContent ||
            !generated.downloadName
          ) {
            return;
          }
          setLinkContent({
            href: generated.hrefEncodedContent,
            download: generated.downloadName,
          });
        },
        // eslint-disable-next-line no-console
        (reason) => console.error("Dynamic Link fileGeneratingFn failed, reason:", reason),
      );
    },
    [contentGeneratingFn],
  );

  return (
    <>
      <a {...anchorProps} onClick={generateAndDownloadContent} href={""} />
      <a
        ref={linkRef}
        style={{ display: "none" }}
        {...linkContent}
        data-testid={"DynamicLink-generated-link"}
      />
    </>
  );
}

/**
 * Creates a data: base 64 encoded string corresponding to the PNG of the supplied viewport, including its decorations.
 * @param vp viewport to be captured
 */
export function generateDecoratedViewportUrlData(vp: Viewport): string | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isUsingWebGL = (vp.target as any)._usingWebGLCanvas; // This is wrong and specific to OnScreenTarget, should this be a public prop ?
  if (isUsingWebGL) {
    // OnScreenTarget renders content and overlay in 2 different canvas that is not caught by readImage, but this is
    // specific to OnScreenTarget, should readImage have a parameter to include or not the overlays ?
    vp.target.setRenderToScreen(false);
  }

  renderFrameWithNoAccuSnap(vp);
  const imageBuffer = canvasToImageBuffer(vp.readImageToCanvas());

  if (isUsingWebGL) {
    vp.target.setRenderToScreen(isUsingWebGL);
  }

  return encodeToUrlData(imageBuffer);
}

/**
 * Temporarily clear accusnap, render frame and reset accusnap, in case outside tools are using it.
 * @param vp Viewport to use for the thumnail generation
 */
function renderFrameWithNoAccuSnap(vp: Viewport) {
  IModelApp.accuSnap.clear();
  // invalidate scene and redraw the frame to ensure that the viewport state is up to date before reading the image
  vp.invalidateScene();
  vp.renderFrame();
}

/**
 * Converts an imageBuffer to its url data: string representation, so it can be downloaded/stored.
 * @param imageBuffer image to convert
 */
function encodeToUrlData(imageBuffer?: ImageBuffer) {
  if (!imageBuffer) {
    return undefined;
  }

  // pass false to preserveAlpha
  // from iModelJs: If false, the alpha channel will be set to 255 (fully opaque). This is recommended when converting an already-blended image (e.g., one obtained from [[Viewport.readImage]]).
  return `data:image/png;base64,${imageBufferToBase64EncodedPng(imageBuffer, false)}`;
}
