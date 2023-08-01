// Copyright (c) Bentley Systems, Incorporated. All rights reserved.

import type { Id64Array } from "@itwin/core-bentley";
import { QueryRowFormat } from "@itwin/core-common";
import { type IModelConnection } from "@itwin/core-frontend";

/**
 * Helper function to execute ECSql queries.
 */
const executeQuery = async (iModel: IModelConnection, query: string) => {
  const rows = [];
  const sqlReader = iModel.createQueryReader(query, undefined, {
    rowFormat: QueryRowFormat.UseJsPropertyNames,
  });
  const result = await sqlReader.toArray();
  for (const row of result) {
    rows.push(row.id);
  }

  return rows;
};

export const IModelQueryClient = {
  getAllModels: async (iModel: IModelConnection): Promise<Id64Array> => {
    // Note: IsNotSpatiallyLocated was introduced in a later version of the BisCore ECSchema.
    // If the iModel has an earlier version, the statement will throw because the property does not exist.
    // If the iModel was created from an earlier version and later upgraded to a newer version, the property may be NULL for models created prior to the upgrade.
    let query =
      "SELECT ECInstanceId FROM Bis.GeometricModel3D WHERE IsPrivate = false AND IsTemplate = false AND (IsNotSpatiallyLocated IS NULL OR IsNotSpatiallyLocated = false)";
    let models = [];
    try {
      models = await executeQuery(iModel, query);
    } catch {
      query =
        "SELECT ECInstanceId FROM Bis.GeometricModel3D WHERE IsPrivate = false AND IsTemplate = false";
      models = await executeQuery(iModel, query);
    }

    return models;
  },
  getAllCategories: async (iModel: IModelConnection): Promise<Id64Array> => {
    // Only use categories with elements in them
    const query = "SELECT DISTINCT Category.Id AS id FROM BisCore.GeometricElement3d WHERE Category.Id IN (SELECT ECInstanceId FROM BisCore.SpatialCategory)";
    const categories: Id64Array = await executeQuery(iModel, query);

    return categories;
  },
  getAllModelsAndCategories: async (
    iModel: IModelConnection,
  ): Promise<{ models: Id64Array; categories: Id64Array; }> => {
    return {
      models: await IModelQueryClient.getAllModels(iModel),
      categories: await IModelQueryClient.getAllCategories(iModel),
    };
  },
};
