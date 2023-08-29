/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

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
