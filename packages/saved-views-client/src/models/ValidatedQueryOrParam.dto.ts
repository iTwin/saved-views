// Copyright (c) Bentley Systems, Incorporated. All rights reserved.

import { CombinedId } from "./combinedId";

/**
 * Base class having a discriminating value for ExceptionFilter validation
 */
export interface ValidatedQueryOrParamDTO {
  combinedId: CombinedId;
  isQueryOrParameterDTO: boolean;
}

/**
 * DTO to extract validated iTwinId/iModelId query
 */
export interface ContextValidatedQueryDTO extends ValidatedQueryOrParamDTO {
  iTwinId?: string;
  projectId?: string;
  iModelId?: string;
}

/**
 * DTO to extract validated groupId param
 */
export interface GroupValidatedParamDTO extends ValidatedQueryOrParamDTO {
  groupId: string;
}

/**
 * DTO to extract validated tagId param
 */
export interface TagValidatedParamDTO extends ValidatedQueryOrParamDTO {
  tagId: string;
}

/**
 * DTO to extract validated savedViewId param
 */
export interface SavedViewValidatedParamDTO extends ValidatedQueryOrParamDTO {
  savedViewId: string;
}

export interface ExtensionValidatedQueryDTO extends SavedViewValidatedParamDTO {
  extensionName: string;
}

export interface GetExtensionValidatedQueryDTO
  extends SavedViewValidatedParamDTO {
  extensionName: string;
}

/**
 * DTO to extract validated "get all saved views" param, which handles
 * string to number parameter validation
 */
export interface GetAllSavedViewsValidatedQueryDTO
  extends ValidatedQueryOrParamDTO {
  groupCombinedId?: CombinedId;
  tagCombinedId?: CombinedId;
  projectId?: string;
  iTwinId?: string;
  iModelId?: string;
  groupId: string;
  tagId: string;
  category?: string;
}

/**
 * DTO to extract validated " all saved views" param, which handles
 * string to number parameter validation
 */
export interface AllSavedViewsValidatedQueryDTO
  extends ValidatedQueryOrParamDTO {
  groupCombinedId: CombinedId;
  tagCombinedId: CombinedId;
  projectId?: string;
  iTwinId?: string;
  iModelId?: string;
  groupId: string;
  tagId: string;
  category?: string;
  skip: 0;
  top: 100;
}
