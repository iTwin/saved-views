/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Logger } from "@itwin/core-bentley";
import type { ViewDefinitionProps, ViewQueryParams } from "@itwin/core-common";
import { ViewState, type IModelConnection } from "@itwin/core-frontend";

const LOGGER_CATEGORY = "DesktopViewsCache";

/**
 * Queries results to get all ViewDefinitionProps in the iModel
 * @param imodel iModel to use for queries
 */
const queryViewProps = async (iModel: IModelConnection): Promise<ViewDefinitionProps[]> => {
  try {
    const params: ViewQueryParams = {};
    params.from = ViewState.classFullName; // use "BisCore.ViewDefinition" as default class name
    params.where =
      "ECClassId NOT IN (SELECT C.ECInstanceId FROM meta.ECClassDef C JOIN meta.ECSchemaDef S USING meta.SchemaOwnsClasses WHERE S.Name= 'BisCore' AND C.Name)";
    params.wantPrivate = false;
    const viewProps = await iModel.views.queryProps(params);
    return viewProps;
  } catch (ex) {
    Logger.logException(LOGGER_CATEGORY, ex);
  }
  return [];
};

export class DesktopViewsCache {
  private _cachePromise: Promise<ViewDefinitionProps[]>;

  constructor(iModel: IModelConnection) {
    this._cachePromise = queryViewProps(iModel);
  }

  async load() {
    return this._cachePromise;
  }
}
