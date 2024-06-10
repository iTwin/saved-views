/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import type { ViewData } from "../models/savedViews/View.js";
import { ITwinSavedViewsClient, PreferOptions } from "./ITwinSavedViewsClient.js";

describe("ITwinSavedViewsClient", () => {
  const fetch = vi.fn();

  beforeAll(() => {
    vi.stubGlobal("fetch", fetch);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    fetch.mockReset();
  });

  it("getSavedViewMinimal", async () => {
    fetch.mockImplementation(() => createSuccessfulResponse({ savedView: { savedViewData: {} } }));

    const client = new ITwinSavedViewsClient({ getAccessToken });
    await client.getSavedViewMinimal({ savedViewId: "test_id" });

    verifyFetch({
      url: "https://api.bentley.com/savedviews/test_id",
      method: "GET",
      headers: { Prefer: PreferOptions.Minimal },
    });
  });

  it("getSavedViewRepresentation", async () => {
    fetch.mockImplementation(() => createSuccessfulResponse({ savedView: { savedViewData: {} } }));

    const client = new ITwinSavedViewsClient({ getAccessToken });
    await client.getSavedViewRepresentation({ savedViewId: "test_id" });

    verifyFetch({
      url: "https://api.bentley.com/savedviews/test_id",
      method: "GET",
      headers: { Prefer: PreferOptions.Representation },
    });
  });

  it("getAllSavedViewsMinimal", async () => {
    fetch.mockImplementation(() => createSuccessfulResponse({}));

    const client = new ITwinSavedViewsClient({ getAccessToken });
    await client.getAllSavedViewsMinimal({
      iTwinId: "test_itwinid",
      iModelId: "test_imodelid",
      groupId: "test_groupid",
      top: "test_top",
      skip: "test_skip",
    });

    verifyFetch({
      url: "https://api.bentley.com/savedviews/?iTwinId=test_itwinid&iModelId=test_imodelid&groupId=test_groupid&$top=test_top&$skip=test_skip",
      method: "GET",
      headers: { Prefer: PreferOptions.Minimal },
    });
  });

  it("getAllSavedViewsMinimal | groupId only", async () => {
    fetch.mockImplementation(() => createSuccessfulResponse({}));

    const client = new ITwinSavedViewsClient({ getAccessToken });
    await client.getAllSavedViewsMinimal({
      groupId: "test_groupid",
    });

    verifyFetch({
      url: "https://api.bentley.com/savedviews/?groupId=test_groupid",
      method: "GET",
      headers: { Prefer: PreferOptions.Minimal },
    });
  });

  it("getAllSavedViewsRepresentation", async () => {
    fetch.mockImplementation(() => createSuccessfulResponse({ savedViews: [] }));

    const client = new ITwinSavedViewsClient({ getAccessToken });
    await client.getAllSavedViewsRepresentation({
      iTwinId: "test_itwinid",
      iModelId: "test_imodelid",
      groupId: "test_groupid",
      top: "test_top",
      skip: "test_skip",
    });

    verifyFetch({
      url: "https://api.bentley.com/savedviews/?iTwinId=test_itwinid&iModelId=test_imodelid&groupId=test_groupid&$top=test_top&$skip=test_skip",
      method: "GET",
      headers: { Prefer: PreferOptions.Representation },
    });
  });

  it("createSavedView", async () => {
    fetch.mockImplementation(() => createSuccessfulResponse({}));

    const client = new ITwinSavedViewsClient({ getAccessToken });
    await client.createSavedView({
      iTwinId: "test_itwinid",
      savedViewData: {} as ViewData,
      displayName: "test_displayname",
    });

    verifyFetch({
      url: "https://api.bentley.com/savedviews/",
      method: "POST",
      body: JSON.stringify({
        iTwinId: "test_itwinid",
        savedViewData: {},
        displayName: "test_displayname",
      }),
    });
  });

  it("updateSavedView", async () => {
    fetch.mockImplementation(() => createSuccessfulResponse({}));

    const client = new ITwinSavedViewsClient({ getAccessToken });
    await client.updateSavedView({
      savedViewId: "test_savedviewid",
      savedViewData: {} as ViewData,
      groupId: "test_groupid",
      displayName: "test_displayname",
      shared: true,
      tagIds: ["test_tagid"],
    });

    verifyFetch({
      url: "https://api.bentley.com/savedviews/test_savedviewid",
      method: "PATCH",
      body: JSON.stringify({
        savedViewData: {},
        groupId: "test_groupid",
        displayName: "test_displayname",
        shared: true,
        tagIds: ["test_tagid"],
      }),
    });
  });

  it("deleteSavedView", async () => {
    fetch.mockImplementation(() => createSuccessfulResponse({}));

    const client = new ITwinSavedViewsClient({ getAccessToken });
    await client.deleteSavedView({ savedViewId: "test_savedviewid" });

    verifyFetch({
      url: "https://api.bentley.com/savedviews/test_savedviewid",
      method: "DELETE",
    });
  });

  it("getImage", async () => {
    fetch.mockImplementation(() => createSuccessfulResponse({}));

    const client = new ITwinSavedViewsClient({ getAccessToken });
    await client.getImage({ savedViewId: "test_savedviewid", size: "full" });

    verifyFetch({
      url: "https://api.bentley.com/savedviews/test_savedviewid/image?size=full",
      method: "GET",
    });
  });

  it("updateImage", async () => {
    fetch.mockImplementation(() => createSuccessfulResponse({}));

    const client = new ITwinSavedViewsClient({ getAccessToken });
    await client.updateImage({ savedViewId: "test_savedviewid", image: "test_base64imagedata" });

    verifyFetch({
      url: "https://api.bentley.com/savedviews/test_savedviewid/image",
      method: "PUT",
      body: JSON.stringify({ image: "test_base64imagedata" }),
    });
  });

  it("getGroup", async () => {
    fetch.mockImplementation(() => createSuccessfulResponse({}));

    const client = new ITwinSavedViewsClient({ getAccessToken });
    await client.getGroup({ groupId: "test_groupid" });

    verifyFetch({
      url: "https://api.bentley.com/savedviews/groups/test_groupid",
      method: "GET",
    });
  });

  it("getAllGroups", async () => {
    fetch.mockImplementation(() => createSuccessfulResponse({}));

    const client = new ITwinSavedViewsClient({ getAccessToken });
    await client.getAllGroups({ iTwinId: "test_itwinid", iModelId: "test_imodelid" });

    verifyFetch({
      url: "https://api.bentley.com/savedviews/groups/?iTwinId=test_itwinid&iModelId=test_imodelid",
      method: "GET",
    });
  });

  it("createGroup", async () => {
    fetch.mockImplementation(() => createSuccessfulResponse({}));

    const client = new ITwinSavedViewsClient({ getAccessToken });
    await client.createGroup({
      iTwinId: "test_itwinid",
      iModelId: "test_imodelid",
      displayName: "test_displayname",
      shared: true,
      readOnly: false,
    });

    verifyFetch({
      url: "https://api.bentley.com/savedviews/groups/",
      method: "POST",
      body: JSON.stringify({
        iTwinId: "test_itwinid",
        iModelId: "test_imodelid",
        displayName: "test_displayname",
        shared: true,
        readOnly: false,
      }),
    });
  });

  it("createGroup", async () => {
    fetch.mockImplementation(() => createSuccessfulResponse({}));

    const client = new ITwinSavedViewsClient({ getAccessToken });
    await client.updateGroup({
      groupId: "test_groupid",
      displayName: "test_displayname",
      shared: true,
      readOnly: false,
    });

    verifyFetch({
      url: "https://api.bentley.com/savedviews/groups/test_groupid",
      method: "PATCH",
      body: JSON.stringify({
        displayName: "test_displayname",
        shared: true,
        readOnly: false,
      }),
    });
  });

  it("deleteGroup", async () => {
    fetch.mockImplementation(() => createSuccessfulResponse({}));

    const client = new ITwinSavedViewsClient({ getAccessToken });
    await client.deleteGroup({ groupId: "test_groupid" });

    verifyFetch({
      url: "https://api.bentley.com/savedviews/groups/test_groupid",
      method: "DELETE",
    });
  });

  it("getExtension", async () => {
    fetch.mockImplementation(() => createSuccessfulResponse({}));

    const client = new ITwinSavedViewsClient({ getAccessToken });
    await client.getExtension({ savedViewId: "test_savedviewid", extensionName: "test_extensionname" });

    verifyFetch({
      url: "https://api.bentley.com/savedviews/test_savedviewid/extensions/test_extensionname",
      method: "GET",
    });
  });

  it("getAllExtensions", async () => {
    fetch.mockImplementation(() => createSuccessfulResponse({}));

    const client = new ITwinSavedViewsClient({ getAccessToken });
    await client.getAllExtensions({ savedViewId: "test_savedviewid" });

    verifyFetch({
      url: "https://api.bentley.com/savedviews/test_savedviewid/extensions/",
      method: "GET",
    });
  });

  it("createExtension", async () => {
    fetch.mockImplementation(() => createSuccessfulResponse({}));

    const client = new ITwinSavedViewsClient({ getAccessToken });
    await client.createExtension({
      savedViewId: "test_savedviewid",
      extensionName: "test_extensionname",
      data: "test_extensiondata",
    });

    verifyFetch({
      url: "https://api.bentley.com/savedviews/test_savedviewid/extensions/",
      method: "PUT",
      body: JSON.stringify({
        extensionName: "test_extensionname",
        data: "test_extensiondata",
      }),
    });
  });

  it("deleteExtension", async () => {
    fetch.mockImplementation(() => createSuccessfulResponse({}));

    const client = new ITwinSavedViewsClient({ getAccessToken });
    await client.deleteExtension({ savedViewId: "test_savedviewid", extensionName: "test_extensionname" });

    verifyFetch({
      url: "https://api.bentley.com/savedviews/test_savedviewid/extensions/test_extensionname",
      method: "DELETE",
    });
  });

  it("getTag", async () => {
    fetch.mockImplementation(() => createSuccessfulResponse({}));

    const client = new ITwinSavedViewsClient({ getAccessToken });
    await client.getTag({ tagId: "test_tagid" });

    verifyFetch({
      url: "https://api.bentley.com/savedviews/tags/test_tagid",
      method: "GET",
    });
  });

  it("getAllTags", async () => {
    fetch.mockImplementation(() => createSuccessfulResponse({}));

    const client = new ITwinSavedViewsClient({ getAccessToken });
    await client.getAllTags({ iTwinId: "test_itwinid", iModelId: "test_imodelid" });

    verifyFetch({
      url: "https://api.bentley.com/savedviews/tags/?iTwinId=test_itwinid&iModelId=test_imodelid",
      method: "GET",
    });
  });

  it("createTag", async () => {
    fetch.mockImplementation(() => createSuccessfulResponse({}));

    const client = new ITwinSavedViewsClient({ getAccessToken });
    await client.createTag({
      iTwinId: "test_itwinid",
      iModelId: "test_imodelid",
      displayName: "test_displayname",
    });

    verifyFetch({
      url: "https://api.bentley.com/savedviews/tags",
      method: "POST",
      body: JSON.stringify({
        iTwinId: "test_itwinid",
        iModelId: "test_imodelid",
        displayName: "test_displayname",
      }),
    });
  });

  it("updateTag", async () => {
    fetch.mockImplementation(() => createSuccessfulResponse({}));

    const client = new ITwinSavedViewsClient({ getAccessToken });
    await client.updateTag({ tagId: "test_tagid", displayName: "test_displayname" });

    verifyFetch({
      url: "https://api.bentley.com/savedviews/tags/test_tagid",
      method: "PATCH",
      body: JSON.stringify({ displayName: "test_displayname" }),
    });
  });

  it("deleteTag", async () => {
    fetch.mockImplementation(() => createSuccessfulResponse({}));

    const client = new ITwinSavedViewsClient({ getAccessToken });
    await client.deleteTag({ tagId: "test_tagid" });

    verifyFetch({
      url: "https://api.bentley.com/savedviews/tags/test_tagid",
      method: "DELETE",
    });
  });

  it("run failed request and check error output", async () => {
    fetch.mockImplementation(() => createFailedResponse());

    const client = new ITwinSavedViewsClient({ getAccessToken });
    await client.getSavedViewMinimal({ savedViewId: "test_savedviewid" }).catch((error) => {
      expect(error.message).toBe("iTwin API request failed. Unexpected response status code: 500 Test.");
    });
  });

  interface VerifyFetchArgs {
    url: string;
    method: "GET" | "PUT" | "PATCH" | "POST" | "DELETE";
    headers?: Record<string, string>;
    body?: string;
  }

  function verifyFetch(args: VerifyFetchArgs): void {
    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledWith(
      args.url,
      {
        method: args.method,
        headers: {
          Authorization: "test_auth_token",
          "Content-Type": "application/json",
          ...args.headers,
        },
        body: args.body,
      },
    );
  }
});

async function getAccessToken(): Promise<string> {
  return "test_auth_token";
}

function createSuccessfulResponse(response: unknown): unknown {
  return { ok: true, json: async () => response };
}

function createFailedResponse(): unknown {
  return {
    ok: false,
    json: () => { },
    status: 500,
    statusText: "Test",
  };
}
