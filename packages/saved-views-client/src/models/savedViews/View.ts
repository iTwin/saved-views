/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import type { Extension, ExtensionMin } from "../Extension.js";
import type { HalLinks } from "../Links.js";
import type { SavedViewTag } from "../Tag.js";
import type { DisplayStyle3dSettingsProps, DisplayStyleSettingsProps } from "./DisplayStyles.js";

export interface SavedViewRepresentation extends SavedView {
  extensions?: Extension[];
}

export interface SavedViewMinimal extends SavedView {
  extensions?: ExtensionMin[];
}

export interface SavedView {
  id: string;
  displayName: string;
  shared: boolean;
  /** Time the saved view was created as an ISO8601 string, `"YYYY-MM-DDTHH:mm:ss.sssZ"` */
  creationTime: string;
  /** Time the saved view was last modified as an ISO8601 string, `"YYYY-MM-DDTHH:mm:ss.sssZ"` */
  lastModified: string;
  tags?: SavedViewTag[];
  savedViewData: ViewData & { legacyView: unknown; };
  _links: HalLinks<["image", "thumbnail", "iTwin"?, "project"?, "imodel"?, "creator"?, "group"?]>;
}

export type ViewData = ViewDataITwin3d | ViewDataITwinDrawing | ViewDataITwinSheet;

export type ViewDataITwin3d = { itwin3dView: ViewITwin3d; };

export function isViewDataITwin3d(savedViewData: ViewData): savedViewData is ViewDataITwin3d {
  return (savedViewData as ViewDataITwin3d).itwin3dView !== undefined;
}

export type ViewDataITwinDrawing = { itwinDrawingView: ViewITwinDrawing; };

export function isViewDataITwinDrawing(savedViewData: ViewData): savedViewData is ViewDataITwinDrawing {
  return (savedViewData as ViewDataITwinDrawing).itwinDrawingView !== undefined;
}

export type ViewDataITwinSheet = { itwinSheetView: ViewITwinSheet; };

export function isViewDataITwinSheet(savedViewData: ViewData): savedViewData is ViewDataITwinSheet {
  return (savedViewData as ViewDataITwinSheet).itwinSheetView !== undefined;
}

export interface ViewITwin3d {
  origin: [x: number, y: number, z: number];
  extents: [x: number, y: number, z: number];
  angles?: ViewYawPitchRoll;
  camera?: ViewCamera;
  models?: ViewVisibilityList;
  displayStyle?: DisplayStyle3dSettingsProps;
  categories?: ViewVisibilityList;
  clipVectors?: Array<ClipPrimitivePlaneProps | ClipPrimitiveShapeProps>;
}

/** Representation of the 3d orientation of an object in space. */
export interface ViewYawPitchRoll {
  yaw?: number;
  pitch?: number;
  roll?: number;
}

export interface ViewCamera {
  lens: number;
  focusDist: number;
  eye: [x: number, y: number, z: number];
}

export interface ViewVisibilityList {
  enabled?: string[];
  disabled?: string[];
}

export interface ViewITwinDrawing extends ViewITwin2d {
  spatialView?: string;
  displaySpatialView?: boolean;
  drawingToSpatialTransform?: [
    [qx: number, qy: number, qz: number, ax: number],
    [qx: number, qy: number, qz: number, ax: number],
    [qx: number, qy: number, qz: number, ax: number],
  ];
  modelExtents: [
    low: [x: number, y: number, z: number],
    high: [x: number, y: number, z: number],
  ];
}

export interface ViewITwinSheet extends ViewITwin2d {
  width?: number;
  height?: number;
  scale?: number;
  sheetTemplate?: string;
  sheetAttachments?: string[];
}

export interface ViewITwin2d {
  baseModelId: string;
  origin: [x: number, y: number];
  delta: [x: number, y: number];
  angle: number;
  displayStyle?: DisplayStyleSettingsProps;
  categories?: ViewVisibilityList;
  clipVectors?: Array<ClipPrimitivePlaneProps | ClipPrimitiveShapeProps>;
}

/** A clip primitive made of a set of planes. */
export interface ClipPrimitivePlaneProps {
  planes: PlanesProps;
}

/** Contains a set of clip planes used to clip the view. */
export interface PlanesProps {
  clips: ClipPlaneProps[][];
  invisible?: boolean;
}

/**
 * Wire format describing a ClipPlane. If either normal or dist are omitted, defaults to a normal of Vector3d.unitZ and
 * a distance of zero.
 */
export interface ClipPlaneProps {
  normal?: [x: number, y: number, z: number];
  distance?: number;
  invisible?: boolean;
  interior?: boolean;
}

/** A clip primitive made of a shape. */
export interface ClipPrimitiveShapeProps {
  shape: ShapeProps;
}

/** Contains the shape/polygon used to clip the view. */
export interface ShapeProps {
  points: number[][];
  transform: [
    [qx: number, qy: number, qz: number, ax: number],
    [qx: number, qy: number, qz: number, ax: number],
    [qx: number, qy: number, qz: number, ax: number],
  ];
  zLow?: number;
  zHigh?: number;
  mask?: boolean;
  invisible?: boolean;
}
