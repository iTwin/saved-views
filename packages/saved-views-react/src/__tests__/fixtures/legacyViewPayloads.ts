/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

/**
 * Legacy payloads for testing conversion from legacy format to new format.
 * These represent the old data format that may be stored in existing saved views.
 */

export const legacySpatialViewDefinitionProps = {
  classFullName: "BisCore:SpatialViewDefinition",
  id: "0x500",
  code: { spec: "0x1", scope: "0x1", value: "" },
  model: "0x10",
  origin: [0, 0, 0],
  extents: [100, 100, 100],
  angles: { yaw: 0, pitch: 0, roll: 0 },
  cameraOn: false,
  camera: { lens: 90, focusDist: 1, eye: [0, 0, 0] },
  jsonProperties: {
    viewDetails: {
      clip: [
        {
          planes: {
            clips: [
              [
                { normal: [1, 0, 0], dist: 10, invisible: false },
                { normal: [0, 1, 0], dist: 20, invisible: false },
              ],
            ],
          },
        },
      ],
    },
  },
};

export const legacyViewWithPlaneClips = {
  classFullName: "BisCore:SpatialViewDefinition",
  id: "0x501",
  code: { spec: "0x1", scope: "0x1", value: "" },
  model: "0x10",
  origin: [0, 0, 0],
  extents: [100, 100, 100],
  jsonProperties: {
    viewDetails: {
      clip: [
        {
          planes: {
            clips: [
              [
                {
                  normal: [1, 0, 0],
                  dist: 50,
                  invisible: false,
                  interior: false,
                },
                {
                  normal: [-1, 0, 0],
                  dist: -100,
                  invisible: false,
                  interior: false,
                },
              ],
              [
                {
                  normal: [0, 1, 0],
                  dist: 50,
                  invisible: false,
                  interior: false,
                },
              ],
            ],
            invisible: false,
          },
        },
      ],
    },
  },
};

export const legacyViewWithShapeClips = {
  classFullName: "BisCore:SpatialViewDefinition",
  id: "0x502",
  code: { spec: "0x1", scope: "0x1", value: "" },
  model: "0x10",
  origin: [0, 0, 0],
  extents: [100, 100, 100],
  jsonProperties: {
    viewDetails: {
      clip: [
        {
          shape: {
            points: [
              [0, 0, 0],
              [100, 0, 0],
              [100, 100, 0],
              [0, 100, 0],
            ],
            trans: [
              [1, 0, 0, 0],
              [0, 1, 0, 0],
              [0, 0, 1, 0],
            ],
            zlow: 0,
            zhigh: 50,
            mask: false,
            invisible: false,
          },
        },
      ],
    },
  },
};

export const legacyViewWithMixedClips = {
  classFullName: "BisCore:SpatialViewDefinition",
  id: "0x503",
  code: { spec: "0x1", scope: "0x1", value: "" },
  model: "0x10",
  origin: [0, 0, 0],
  extents: [100, 100, 100],
  jsonProperties: {
    viewDetails: {
      clip: [
        {
          planes: {
            clips: [[{ normal: [0, 0, 1], dist: 25 }]],
          },
        },
        {
          shape: {
            points: [
              [10, 10, 0],
              [90, 10, 0],
              [90, 90, 0],
              [10, 90, 0],
            ],
            zlow: -10,
            zhigh: 100,
          },
        },
      ],
    },
  },
};

export const legacyViewWithEmptyClip = {
  classFullName: "BisCore:SpatialViewDefinition",
  id: "0x504",
  code: { spec: "0x1", scope: "0x1", value: "" },
  model: "0x10",
  origin: [0, 0, 0],
  extents: [100, 100, 100],
  jsonProperties: {
    viewDetails: {
      clip: [],
    },
  },
};

export const legacyViewWithInvalidClipPrimitive = {
  classFullName: "BisCore:SpatialViewDefinition",
  id: "0x505",
  code: { spec: "0x1", scope: "0x1", value: "" },
  model: "0x10",
  origin: [0, 0, 0],
  extents: [100, 100, 100],
  jsonProperties: {
    viewDetails: {
      clip: [
        {
          planes: {}, // Empty planes object - invalid
        },
        {
          planes: {
            clips: [[{ normal: [1, 0, 0], dist: 10 }]],
          },
        },
      ],
    },
  },
};

export const legacyViewWithoutClip = {
  classFullName: "BisCore:SpatialViewDefinition",
  id: "0x506",
  code: { spec: "0x1", scope: "0x1", value: "" },
  model: "0x10",
  origin: [0, 0, 0],
  extents: [100, 100, 100],
  jsonProperties: {
    viewDetails: {
      // No clip property
    },
  },
};

export const legacyViewWithoutViewDetails = {
  classFullName: "BisCore:SpatialViewDefinition",
  id: "0x507",
  code: { spec: "0x1", scope: "0x1", value: "" },
  model: "0x10",
  origin: [0, 0, 0],
  extents: [100, 100, 100],
  jsonProperties: {
    // No viewDetails
  },
};
