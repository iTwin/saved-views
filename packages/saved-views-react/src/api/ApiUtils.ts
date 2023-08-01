// Copyright (c) Bentley Systems, Incorporated. All rights reserved.
import { type HttpActions } from "./HttpActions";
import { SavedViewsManager } from "./SavedViewsManager";
import { GroupLinks, TagLinks } from "./utilities/SavedViewTypes";

export interface SavedViewsClientRequestOptions<BodyType extends object> {
  headers: {
    "Content-Type": string;
    Authorization: string;
    Accept: string;
    Prefer: string;
  };
  body?: BodyType;
  method: HttpActions;
  json: boolean;
  resolveWithFullResponse: boolean;
}

export async function createRequestOptions<BodyType extends object>(
  method: HttpActions,
  body?: BodyType,
  prefer = "return=minimal",
): Promise<SavedViewsClientRequestOptions<BodyType>> {
  const accessToken = await SavedViewsManager.getAccessToken();
  return {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: accessToken,
      Accept: "application/vnd.bentley.itwin-platform.v1+json",
      Prefer: prefer,
    },
    body,
    json: true,
    resolveWithFullResponse: true,
  };
}

export function extractUserID<LinksType extends GroupLinks | TagLinks>(links: LinksType) {
  return links.creator.href.split("/").pop();
}
