/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import type { Id64Array, Id64String } from "@itwin/core-bentley";
import {
  BackgroundMapSettings, BackgroundMapType, Code, IModel, QueryRowFormat, RenderMode, type ViewStateProps,
} from "@itwin/core-common";
import { SpatialViewState, type IModelConnection, type ViewState } from "@itwin/core-frontend";

import { SavedViewsManager } from "../SavedViewsManager";

/**
 * Class for handling creation of default views in the app
 */
export class ViewCreator {
  /**
   * Merges a seed view in the iModel with the passed view state props. It will be a no-op if there are no default 3D views in the iModel
   * @param iModelConnection IModelConnection to query/load views from
   * @param viewStateProps Input view props to be merged
   */
  private static async mergeSeedView(
    iModelConnection: IModelConnection,
    viewStateProps: ViewStateProps,
  ): Promise<ViewStateProps> {
    const viewId = await SavedViewsManager.getDefaultViewId(iModelConnection);
    // Handle iModels without any default view id
    if (!viewId) {
      return viewStateProps;
    }

    const seedViewState = (await iModelConnection.views.load(viewId)) as SpatialViewState;
    const seedViewStateProps = {
      categorySelectorProps: seedViewState.categorySelector.toJSON(),
      modelSelectorProps: seedViewState.modelSelector.toJSON(),
      viewDefinitionProps: seedViewState.toJSON(),
      displayStyleProps: seedViewState.displayStyle.toJSON(),
    };

    const mergedDisplayProps = seedViewStateProps.displayStyleProps;
    mergedDisplayProps.jsonProperties.styles = {
      ...mergedDisplayProps.jsonProperties.styles,
      ...viewStateProps.displayStyleProps.jsonProperties?.styles,
    };

    return {
      ...seedViewStateProps,
      ...viewStateProps,
      displayStyleProps: mergedDisplayProps,
    };
  }

  /**
   * Generates a view state props object for creating a view. Merges display styles with a seed view if the flags.useSeedView is ON
   * @param iModelConnection IModelConnection to use
   * @param categories Categories to put in view props
   * @param models Models to put in view props
   */
  private static async manufactureViewStateProps(
    iModelConnection: IModelConnection,
    categories: Id64String[],
    models: Id64String[],
  ): Promise<ViewStateProps> {
    // Use dictionary model in all props
    const dictionaryId = IModel.dictionaryId;

    // Category Selector Props
    const categorySelectorProps = {
      categories,
      code: Code.createEmpty(),
      model: dictionaryId,
      classFullName: "BisCore:CategorySelector",
    };
    // Model Selector Props
    const modelSelectorProps = {
      models,
      code: Code.createEmpty(),
      model: dictionaryId,
      classFullName: "BisCore:ModelSelector",
    };
    // View Definition Props
    const viewDefinitionProps = {
      categorySelectorId: "",
      displayStyleId: "",
      code: Code.createEmpty(),
      model: dictionaryId,
      classFullName: "BisCore:SpatialViewDefinition",
    };
    // Display Style Props
    const displayStyleProps = {
      code: Code.createEmpty(),
      model: dictionaryId,
      classFullName: "BisCore:DisplayStyle",
      jsonProperties: {
        styles: {
          viewflags: {
            renderMode: RenderMode.SmoothShade,
            noSourceLights: false,
            noCameraLights: false,
            noSolarLight: false,
            noConstruct: true,
            noTransp: false,
            visEdges: false,
            backgroundMap: iModelConnection.isGeoLocated,
          },
        },
      },
    };

    const viewStateProps = {
      displayStyleProps,
      categorySelectorProps,
      modelSelectorProps,
      viewDefinitionProps,
    };
    const useSeedView = SavedViewsManager.flags.useSeedView;
    return useSeedView
      ? ViewCreator.mergeSeedView(iModelConnection, viewStateProps)
      : viewStateProps;
  }

  /**
   * Get all categories containing elements
   * @param iModelConnection IModelConnection to query
   */
  public static async getAllCategories(iModelConnection: IModelConnection): Promise<Id64Array> {
    const categories: Id64Array = [];

    // Only use categories with elements in them
    const selectUsedSpatialCategoryIds =
      "SELECT DISTINCT Category.Id as id from BisCore.GeometricElement3d WHERE Category.Id IN (SELECT ECInstanceId from BisCore.SpatialCategory)";
    const sqlReader = iModelConnection.createQueryReader(
      selectUsedSpatialCategoryIds,
      undefined,
      { rowFormat: QueryRowFormat.UseJsPropertyNames },
    );
    const result = await sqlReader.toArray();
    for (const row of result) {
      categories.push(row.id);
    }

    return categories;
  }

  /**
   * Get all PhysicalModel ids in the connection
   * @param iModelConnection IModelConnection to query
   */
  public static async getAllModels(iModelConnection: IModelConnection): Promise<Id64Array> {
    const selectPhysicalModels =
      "SELECT p.ECInstanceId id, p.Parent.Id subjectId FROM bis.InformationPartitionElement p JOIN bis.Model m ON m.ModeledElement.Id = p.ECInstanceId WHERE NOT m.IsPrivate";
    const models: Id64Array = [];
    const sqlReader = iModelConnection.createQueryReader(
      selectPhysicalModels,
      undefined,
      { rowFormat: QueryRowFormat.UseJsPropertyNames },
    );
    const result = await sqlReader.toArray();
    for (const row of result) {
      models.push(row.id);
    }

    return models;
  }

  /**
   * Creates a default view based on the given model ids. Uses all models ON if no modelIds passed
   * @param iModelConnection IModelConnection to query for categories and/or models
   * @param modelIds [optional] Model Ids to use in the view
   */
  public static async createDefaultView(
    iModelConnection: IModelConnection,
    modelIds?: string[],
  ): Promise<ViewState | undefined> {
    const categories: Id64Array = await ViewCreator.getAllCategories(iModelConnection);
    const models = modelIds
      ? modelIds
      : await ViewCreator.getAllModels(iModelConnection);
    if (!models) {
      return undefined;
    }

    const props = await ViewCreator.manufactureViewStateProps(iModelConnection, categories, models);
    const viewState = SpatialViewState.createFromProps(props, iModelConnection) as SpatialViewState;
    if (!viewState) {
      return undefined;
    }

    await viewState.load();

    const hasBackgroundMapProps =
      viewState.displayStyle.toJSON().jsonProperties &&
      viewState.displayStyle.toJSON().jsonProperties.styles.backgroundMap;
    if (viewState.viewFlags.backgroundMap && !hasBackgroundMapProps) {
      viewState.getDisplayStyle3d().changeBackgroundMapProps(
        BackgroundMapSettings.fromPersistentJSON({
          providerName: "BingProvider",
          providerData: {
            mapType: BackgroundMapType.Hybrid,
          },
        }).toJSON(),
      );
    }

    return viewState;
  }
}
