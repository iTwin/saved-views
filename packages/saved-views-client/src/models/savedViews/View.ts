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
 * Wire format describing a ClipPlane.
 * If either normal or dist are omitted, defaults to a normal of Vector3d.unitZ and a distance of zero.
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

/** Required camera information */
export interface ViewCamera {
  lens: number;
  focusDist: number;
  eye: [x: number, y: number, z: number];
}

/** List of explicitly enabled/disabled Id64Strings, used for Categories and Models */
export interface ViewVisibilityList {
  enabled?: string[];
  disabled?: string[];
}

/** View */
export interface SavedViewBase {
  /**
   * Origin. (Array of numbers representing x and y)
   * @type {[number, number] | [number, number, number]}
   * @memberof View
   */
  origin: [number, number] | [number, number, number];
  /**
   * List of categories that should be displayed or hidden on that view
   * @type {ViewVisibilityList}
   * @memberof View
   */
  categories?: ViewVisibilityList;
  /**
   * Array of clip vectors in the view.
   * @type {Array<ClipPrimitivePlaneProps | ClipPrimitiveShapeProps>}
   * @memberof View
   */
  clipVectors?: Array<ClipPrimitivePlaneProps | ClipPrimitiveShapeProps>;
}

/** Minimum required information saved for a 3D saved view. */
export interface ViewItwin3d extends SavedViewBase {
  origin: [x: number, y: number, z: number];
  extents: [x: number, y: number, z: number];
  angles?: ViewYawPitchRoll;
  camera?: ViewCamera;
  models?: ViewVisibilityList;
  displayStyle?: DisplayStyle3dSettingsProps;
}

/** Minimum required information saved for a 2d saved view (Used by Sheet and Drawings). */
export interface ViewItwin2d extends SavedViewBase {
  baseModelId: string;
  origin: [x: number, y: number];
  delta: [x: number, y: number];
  angle: number;
  displayStyle?: DisplayStyleSettingsProps;
}

/** Minimum required information saved for a Sheet saved view. */
export interface ViewItwinSheet extends ViewItwin2d {
  width?: number;
  height?: number;
  scale?: number;
  sheetTemplate?: string;
  sheetAttachments?: string[];
}

/** Minimum required information saved for a Drawing saved view. */
export interface ViewItwinDrawing extends ViewItwin2d {
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
  itwin3dView?: ViewItwin3d;
  itwinSheetView?: ViewItwinSheet;
  itwinDrawingView?: ViewItwinDrawing;
}

/** Minimum saved view structure including possible legacy data from product setting service. */
export interface ViewWithLegacy extends View {
  legacyView?: unknown;
}

/** Saved view metadata model for restful get saved view operations following Apim standards. */
export interface SavedView {
  tags?: SavedViewTag[];
  extensions?: Extension[] | ExtensionMin[];
  category?: string;
  _links: HalLinks<["savedView", "image", "thumbnail", "iTwin"?, "project"?, "iModel"?, "creator"?, "group"?]>;
  id: string;
  displayName: string;
  shared: boolean;
}

/** Saved view metadata model for restful get saved view operations following Apim standards. */
export interface SavedViewWithData extends SavedView {
  savedViewData: ViewWithLegacy;
}
