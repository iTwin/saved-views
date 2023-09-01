/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Extension, ExtensionMin } from "../Extension.js";
import { HalLinks } from "../Links.js";
import { SavedViewTag } from "../Tag.js";
import {
  DisplayStyle3dSettingsProps,
  DisplayStyleSettingsProps,
} from "./DisplayStyles.js";

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

/** Contains the set of clip planes used to clip the view. */
export interface PlanesProps {
  clips: ClipPlaneProps[][];
  invisible?: boolean;
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

/** A clip primitive made of a set planes. */
export interface ClipPrimitivePlaneProps {
  planes: PlanesProps;
}

/** A clip primitive made of a shape. */
export interface ClipPrimitiveShapeProps {
  shape: ShapeProps;
}

/** Representation of the 3d orientation of an object in space. */
export interface ViewYawPitchRoll {
  yaw?: number;
  pitch?: number;
  roll?: number;
}

/** Required camera information. */
export interface ViewCamera {
  lens: number;
  focusDist: number;
  eye: [x: number, y: number, z: number];
}

/** List of explicitly enabled/disabled Id64Strings, used for Categories and Models. */
export interface ViewVisibilityList {
  enabled?: string[];
  disabled?: string[];
}

export interface SavedViewBase {
  /** Origin, represented as an array of x and y coordinates. */
  origin: [number, number] | [number, number, number];
  /** List of categories that should be displayed or hidden on that view. */
  categories?: ViewVisibilityList;
  /** Array of clip vectors in the view. */
  clipVectors?: Array<ClipPrimitivePlaneProps | ClipPrimitiveShapeProps>;
}

/** Minimum required information saved for a 3D saved view. */
export interface ViewITwin3d extends SavedViewBase {
  origin: [x: number, y: number, z: number];
  extents: [x: number, y: number, z: number];
  angles?: ViewYawPitchRoll;
  camera?: ViewCamera;
  models?: ViewVisibilityList;
  displayStyle?: DisplayStyle3dSettingsProps;
}

/** Minimum required information saved for a 2d saved view (Used by Sheet and Drawings). */
export interface ViewITwin2d extends SavedViewBase {
  baseModelId: string;
  origin: [x: number, y: number];
  delta: [x: number, y: number];
  angle: number;
  displayStyle?: DisplayStyleSettingsProps;
}

/** Minimum required information saved for a Sheet saved view. */
export interface ViewITwinSheet extends ViewITwin2d {
  width?: number;
  height?: number;
  scale?: number;
  sheetTemplate?: string;
  sheetAttachments?: string[];
}

/** Minimum required information saved for a Drawing saved view. */
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

/** Minimum Saved View structure so every application can have something to work with. */
export interface View {
  ITwin3dView?: ViewITwin3d;
  ITwinSheetView?: ViewITwinSheet;
  ITwinDrawingView?: ViewITwinDrawing;
}

/** Minimum saved view structure including possible legacy data from product setting service. */
export interface ViewWithLegacy extends View {
  legacyView?: unknown;
}

export interface SavedView {
  tags?: SavedViewTag[];
  _links: HalLinks<
    [
      "savedView",
      "image",
      "thumbnail",
      "ITwin"?,
      "project"?,
      "iModel"?,
      "creator"?,
      "group"?,
    ]
  >;
  id: string;
  displayName: string;
  shared: boolean;
}

export interface SavedViewWithDataRepresentation extends SavedView {
  savedViewData: ViewWithLegacy;
  extensions?: Extension[];
}

export interface SavedViewWithDataMinimal extends SavedView {
  savedViewData: ViewWithLegacy;
  extensions?: ExtensionMin[];
}
