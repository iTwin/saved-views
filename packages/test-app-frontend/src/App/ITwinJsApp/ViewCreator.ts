import {
  BackgroundMapType, BaseMapLayerSettings, ColorDef, Environment, LightSettings, RenderMode,
} from "@itwin/core-common";
import {
  type IModelConnection, type ScreenViewport, FitViewTool, IModelApp, SpatialViewState, StandardViewId, ViewCreator3d,
} from "@itwin/core-frontend";
import { Matrix3d, StandardViewIndex } from "@itwin/core-geometry";

export const ViewCreator = {
  create: async (iModel: IModelConnection, modelIds?: string[]) => {
    if (iModel.isBlank) {
      const ext = iModel.projectExtents;
      const rotation = Matrix3d.createStandardWorldToView(StandardViewIndex.Iso);
      return SpatialViewState.createBlank(iModel, ext.low, ext.high.minus(ext.low), rotation);
    }

    const viewState = await new ViewCreator3d(iModel).createDefaultView(
      {
        skyboxOn: true,
        useSeedView: false,
        standardViewId: StandardViewId.Iso,
      },
      modelIds,
    );

    if (!viewState.is3d()) {
      throw new Error("Expected ViewCreator3d to create ViewState3d");
    }

    viewState.viewFlags = viewState.viewFlags.copy({
      renderMode: RenderMode.SmoothShade,
      lighting: true,
      visibleEdges: false,
      ambientOcclusion: true,
    });
    viewState.displayStyle.settings.lights = LightSettings.fromJSON({
      solar: { intensity: 0.0 },
      ambient: { intensity: 0.55 },
      portrait: { intensity: 0.8 },
      specularIntensity: 0.0,
    });

    const displayStyle = viewState.getDisplayStyle3d();
    displayStyle.environment = Environment.fromJSON({
      sky: {
        display: displayStyle.environment.displaySky,
        twoColor: true,
        groundColor: ColorDef.computeTbgr(15265008),
        skyColor: ColorDef.computeTbgr(16773854),
        zenithColor: ColorDef.computeTbgr(16773854),
        nadirColor: ColorDef.computeTbgr(15265008),
      },
    });

    if (iModel.isGeoLocated) {
      viewState.viewFlags = viewState.viewFlags.copy({ backgroundMap: true });
      const displayStyleSettings = viewState.getDisplayStyle3d().settings;
      if (displayStyleSettings.mapImagery.backgroundBase instanceof BaseMapLayerSettings) {
        const providerName = displayStyleSettings.mapImagery.backgroundBase.provider?.name;
        if (providerName !== "BingProvider") {
          viewState.getDisplayStyle3d().changeBackgroundMapProvider({
            name: "BingProvider",
            type: BackgroundMapType.Hybrid,
          });
        }
      }
    }

    return viewState;
  },
  onViewOpen: (vp: ScreenViewport) => {
    void IModelApp.tools.run(FitViewTool.toolId, vp, true, false);
    IModelApp.viewManager.selectedView?.resetUndo();
    if (vp.view.isSpatialView()) {
      void vp.addViewedModels(vp.view.modelSelector.models);
    }

    if (vp.view.is3d()) {
      vp.changeCategoryDisplay(vp.view.categorySelector.categories, true, true);
    }
  },
};
