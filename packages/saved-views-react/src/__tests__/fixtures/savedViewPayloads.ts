/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import type {
  ITwin3dViewData,
  ITwinDrawingdata,
  ITwinSheetData,
  SavedViewData,
  SavedViewExtension,
} from "../../SavedView.js";

export const minimal3dView: ITwin3dViewData = {
  type: "iTwin3d",
  origin: [0, 0, 0],
  extents: [100, 100, 100],
  angles: { yaw: 0, pitch: 0, roll: 0 },
  categories: { enabled: [], disabled: [] },
  models: { enabled: [], disabled: [] },
  displayStyle: {},
};

export const full3dView: ITwin3dViewData = {
  type: "iTwin3d",
  origin: [10, 20, 30],
  extents: [1000, 2000, 3000],
  angles: { yaw: 45, pitch: 30, roll: 15 },
  camera: {
    lens: 90,
    focusDist: 100,
    eye: [50, 60, 70],
  },
  categories: {
    enabled: ["0x100", "0x101", "0x102"],
    disabled: ["0x200", "0x201"],
  },
  models: {
    enabled: ["0x300", "0x301"],
    disabled: ["0x400"],
  },
  displayStyle: {
    viewflags: {
      renderMode: 6,
      noConstructions: true,
      noDimensions: false,
    },
    backgroundColor: { red: 255, green: 255, blue: 255 },
  },
  clipVectors: [
    {
      planes: {
        clips: [
          [
            { normal: [1, 0, 0], distance: 10 },
            { normal: [0, 1, 0], distance: 20 },
          ],
        ],
      },
    },
  ],
};

export const drawingView: ITwinDrawingdata = {
  type: "iTwinDrawing",
  origin: [0, 0],
  delta: [500, 500],
  angle: 0,
  baseModelId: "0x1000",
  categories: { enabled: ["0x100"], disabled: [] },
  displayStyle: {},
};

export const sheetView: ITwinSheetData = {
  type: "iTwinSheet",
  origin: [0, 0],
  delta: [200, 300],
  angle: 0,
  baseModelId: "0x2000",
  width: 200,
  height: 300,
  categories: { enabled: ["0x100"], disabled: [] },
  displayStyle: {},
};

export const minimalSavedViewData: SavedViewData = {
  viewData: minimal3dView,
  extensions: [],
};

export const fullSavedViewData: SavedViewData = {
  viewData: full3dView,
  extensions: [],
};

export const extensionPayloads = {
  emphasizeElements: {
    extensionName: "EmphasizeElements",
    data: JSON.stringify({
      emphasizeElementsProps: {
        neverDrawn: ["0x100", "0x101"],
        alwaysDrawn: ["0x200", "0x201"],
        isAlwaysDrawnExclusive: true,
        defaultAppearance: {
          rgb: { r: 128, g: 128, b: 128 },
          transparency: 0.5,
          nonLocatable: true,
        },
        wantEmphasis: true,
      },
    }),
  } satisfies SavedViewExtension,
  perModelCategoryVisibility: {
    extensionName: "PerModelCategoryVisibility",
    data: JSON.stringify({
      perModelCategoryVisibilityProps: [
        { modelId: "0x300", categoryId: "0x100", visible: true },
        { modelId: "0x300", categoryId: "0x101", visible: false },
        { modelId: "0x301", categoryId: "0x100", visible: true },
      ],
    }),
  } satisfies SavedViewExtension,
};

export const savedViewWithEmphasis: SavedViewData = {
  viewData: minimal3dView,
  extensions: [extensionPayloads.emphasizeElements],
};

export const savedViewWithPMCV: SavedViewData = {
  viewData: minimal3dView,
  extensions: [extensionPayloads.perModelCategoryVisibility],
};

export const savedViewWithAllExtensions: SavedViewData = {
  viewData: full3dView,
  extensions: [
    extensionPayloads.emphasizeElements,
    extensionPayloads.perModelCategoryVisibility,
  ],
};
