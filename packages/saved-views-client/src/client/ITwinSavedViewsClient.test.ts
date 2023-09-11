/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { describe, expect, it, vi } from "vitest";
import { CallITwinApiParams } from "./ApiUtils";
import { ITwinSavedViewsClient, PreferOptions } from "./ITwinSavedViewsClient";
import { ImageSize } from "./SavedViewsClient";

interface TestQueryParams {
  urlParams: string[];
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: object | undefined;
  headers?: {
    prefer?: PreferOptions;
  };
  signal?: AbortSignal | undefined;
}

const baseUrl = "https://api.bentley.com/savedviews";
const authToken = "auth token";

const getAccessToken = async () => {
  return authToken;
};

const systemUnderTest: ITwinSavedViewsClient = new ITwinSavedViewsClient({
  getAccessToken: getAccessToken,
});

const callITwinApiTestRunner = async (
  expectedQueryArgs: TestQueryParams, funcUnderTest: () => Promise<void>, mockFunc: (args: any) => Promise<any>) => {
  global.fetch = vi.fn(() => { return mockFunc(expectedQueryArgs); });
  await funcUnderTest();
};

const checkIfFetchIsReceivingExpectedParams = (expectedQueryArgs: TestQueryParams) => {
  verifyCallITwinApiInfo(expectedQueryArgs);
  return ({ ok: true, json: () => { } }) as any;
};

const createFailedRequest = () => {
  return ({
    ok: false,
    json: () => { },
    status: 500,
    statusText: "Test",
  }) as any;
};

const verifyCallITwinApiInfo = (queryArgs: TestQueryParams) => {
  return async (callITwinApiArgs: CallITwinApiParams) => {
    confirmURL(callITwinApiArgs.url, queryArgs.urlParams);
    expect(callITwinApiArgs.body).toEqual(queryArgs.body);
    expect(callITwinApiArgs.headers).toEqual(queryArgs.headers);
    expect(callITwinApiArgs.signal).toEqual(queryArgs.signal);
    expect(callITwinApiArgs.method).toBe(queryArgs.method);
    expect(await callITwinApiArgs.getAccessToken()).toBe(authToken);
    return {} as any;
  };
};

const confirmURL = (url: string, urlParams: string[]) => {
  expect(url.startsWith(baseUrl)).toBe(true);
  urlParams.forEach((urlParam) => { expect(url.includes(urlParam)).toBe(true); });
};

describe("ITwinSavedViewsClient tests for callITwinApi information transference", () => {

  it("getSavedViewMinimal", async () => {
    const savedViewId = "savedViewComboId";
    const expectedQueryParams: TestQueryParams = {
      urlParams: [savedViewId],
      method: "GET",
      headers: {
        prefer: PreferOptions.Minimal,
      },
      body: undefined,
      signal: new AbortSignal(),
    };

    await callITwinApiTestRunner(expectedQueryParams, async () => {
      await systemUnderTest.getSavedViewMinimal({
        savedViewId: savedViewId,
        signal: new AbortSignal(),
      });
    }, checkIfFetchIsReceivingExpectedParams);
  });

  it("getSavedViewRepresentation", async () => {
    const savedViewId = "savedViewComboId";
    const expectedQueryParams: TestQueryParams = {
      urlParams: [savedViewId],
      method: "GET",
      headers: {
        prefer: PreferOptions.Representation,
      },
      body: undefined,
      signal: new AbortSignal(),
    };

    await callITwinApiTestRunner(expectedQueryParams, async () => {
      await systemUnderTest.getSavedViewRepresentation({
        savedViewId: savedViewId,
        signal: new AbortSignal(),
      });
    }, checkIfFetchIsReceivingExpectedParams);
  });

  it("getAllSavedViewsMinimal", async () => {
    const iTwinId = "iTwinId";
    const iModelId = "iModelId";
    const groupId = "groupId";
    const top = "top";
    const skip = "skip";
    const expectedQueryParams: TestQueryParams = {
      urlParams: [iTwinId, iModelId, groupId, top, skip],
      method: "GET",
      headers: {
        prefer: PreferOptions.Minimal,
      },
      body: undefined,
      signal: new AbortSignal(),
    };

    await callITwinApiTestRunner(expectedQueryParams, async () => {
      await systemUnderTest.getAllSavedViewsMinimal({
        iTwinId, iModelId, groupId, top, skip, signal: new AbortSignal(),
      });
    }, checkIfFetchIsReceivingExpectedParams);
  });

  it("getAllSavedViewsRepresentation", async () => {
    const iTwinId = "iTwinId";
    const iModelId = "iModelId";
    const groupId = "groupId";
    const top = "top";
    const skip = "skip";
    const expectedQueryParams: TestQueryParams = {
      urlParams: [iTwinId, iModelId, groupId, top, skip],
      method: "GET",
      headers: {
        prefer: PreferOptions.Representation,
      },
      body: undefined,
      signal: new AbortSignal(),
    };

    await callITwinApiTestRunner(expectedQueryParams, async () => {
      await systemUnderTest.getAllSavedViewsRepresentation({
        iTwinId, iModelId, groupId, top, skip, signal: new AbortSignal(),
      });
    }, checkIfFetchIsReceivingExpectedParams);
  });

  it("createSavedView", async () => {
    const expectedQueryParams: TestQueryParams = {
      urlParams: [],
      method: "POST",
      headers: {},
      body: {
        savedViewData: {},
        displayName: "Test View",
      },
      signal: new AbortSignal(),
    };

    await callITwinApiTestRunner(expectedQueryParams, async () => {
      await systemUnderTest.createSavedView({
        signal: new AbortSignal(),
        savedViewData: {},
        displayName: "Test View",
      });
    }, checkIfFetchIsReceivingExpectedParams);
  });

  it("updateSavedView", async () => {
    const savedViewId = "savedViewComboId";
    const body = {
      savedViewData: {},
      groupId: "groupId",
      displayName: "displayName",
      shared: true,
      tagIds: ["tagId"],
      extensions: [{ extensionName: "extensionName", href: "link" }],
    };
    const expectedQueryParams: TestQueryParams = {
      urlParams: [savedViewId],
      method: "PATCH",
      headers: {},
      body: body,
      signal: new AbortSignal(),
    };

    await callITwinApiTestRunner(expectedQueryParams, async () => {
      await systemUnderTest.updateSavedView({
        savedViewId,
        ...body,
        signal: new AbortSignal(),
      });
    }, checkIfFetchIsReceivingExpectedParams);
  });

  it("deleteSavedView", async () => {
    const savedViewId = "savedViewComboId";
    const expectedQueryParams: TestQueryParams = {
      urlParams: [savedViewId],
      method: "DELETE",
      headers: {},
      signal: new AbortSignal(),
    };

    await callITwinApiTestRunner(expectedQueryParams, async () => {
      await systemUnderTest.deleteSavedView({
        savedViewId,
        signal: new AbortSignal(),
      });
    }, checkIfFetchIsReceivingExpectedParams);
  });

  it("getImage", async () => {
    const savedViewId = "savedViewComboId";
    const expectedQueryParams: TestQueryParams = {
      urlParams: [savedViewId, ImageSize.Full],
      method: "GET",
      headers: {},
      signal: new AbortSignal(),
    };

    await callITwinApiTestRunner(expectedQueryParams, async () => {
      await systemUnderTest.getImage({
        size: ImageSize.Full,
        savedViewId: savedViewId,
        signal: new AbortSignal(),
      });
    }, checkIfFetchIsReceivingExpectedParams);
  });

  it("updateImage", async () => {
    const savedViewId = "savedViewComboId";
    const expectedQueryParams: TestQueryParams = {
      urlParams: [savedViewId, "image"],
      method: "PUT",
      body: {
        image: "image",
      },
      headers: {},
      signal: new AbortSignal(),
    };

    await callITwinApiTestRunner(expectedQueryParams, async () => {
      await systemUnderTest.updateImage({
        image: "image",
        savedViewId: savedViewId,
        signal: new AbortSignal(),
      });
    }, checkIfFetchIsReceivingExpectedParams);
  });

  it("getGroup", async () => {
    const groupId = "groupId";
    const expectedQueryParams: TestQueryParams = {
      urlParams: [groupId, "groups"],
      method: "GET",
      headers: {},
      signal: new AbortSignal(),
    };

    await callITwinApiTestRunner(expectedQueryParams, async () => {
      await systemUnderTest.getGroup({
        groupId,
        signal: new AbortSignal(),
      });
    }, checkIfFetchIsReceivingExpectedParams);
  });

  it("getAllGroups", async () => {
    const iTwinId = "iTwinId";
    const iModelId = "iModelId";
    const expectedQueryParams: TestQueryParams = {
      urlParams: [iModelId, iTwinId, "groups"],
      method: "GET",
      headers: {},
      signal: new AbortSignal(),
    };

    await callITwinApiTestRunner(expectedQueryParams, async () => {
      await systemUnderTest.getAllGroups({
        iTwinId,
        iModelId,
        signal: new AbortSignal(),
      });
    }, checkIfFetchIsReceivingExpectedParams);
  });

  it("createGroup", async () => {
    const body = {
      iTwinId: "iTwinId",
      iModelId: "iModelId",
      displayName: "displayName",
      shared: true,
    };
    const expectedQueryParams: TestQueryParams = {
      urlParams: ["groups"],
      method: "POST",
      body,
      headers: {},
      signal: new AbortSignal(),
    };

    await callITwinApiTestRunner(expectedQueryParams, async () => {
      await systemUnderTest.createGroup({
        ...body,
        signal: new AbortSignal(),
      });
    }, checkIfFetchIsReceivingExpectedParams);
  });

  it("createGroup", async () => {
    const groupId = "groupId";
    const body = {
      displayName: "displayName",
      shared: true,
    };
    const expectedQueryParams: TestQueryParams = {
      urlParams: ["groups", groupId],
      method: "PATCH",
      body,
      headers: {},
      signal: new AbortSignal(),
    };

    await callITwinApiTestRunner(expectedQueryParams, async () => {
      await systemUnderTest.updateGroup({
        ...body,
        groupId,
        signal: new AbortSignal(),
      });
    }, checkIfFetchIsReceivingExpectedParams);
  });

  it("deleteGroup", async () => {
    const groupId = "groupId";
    const expectedQueryParams: TestQueryParams = {
      urlParams: ["groups", groupId],
      method: "DELETE",
      headers: {},
      signal: new AbortSignal(),
    };

    await callITwinApiTestRunner(expectedQueryParams, async () => {
      await systemUnderTest.deleteGroup({
        groupId,
        signal: new AbortSignal(),
      });
    }, checkIfFetchIsReceivingExpectedParams);
  });

  it("getExtension", async () => {
    const savedViewId = "savedViewComboId";
    const extensionName = "name";
    const expectedQueryParams: TestQueryParams = {
      urlParams: ["extensions", savedViewId, extensionName],
      method: "GET",
      headers: {},
      signal: new AbortSignal(),
    };

    await callITwinApiTestRunner(expectedQueryParams, async () => {
      await systemUnderTest.getExtension({
        savedViewId,
        extensionName,
        signal: new AbortSignal(),
      });
    }, checkIfFetchIsReceivingExpectedParams);
  });

  it("getExtension", async () => {
    const savedViewId = "savedViewComboId";
    const extensionName = "name";
    const expectedQueryParams: TestQueryParams = {
      urlParams: ["extensions", savedViewId, extensionName],
      method: "GET",
      headers: {},
      signal: new AbortSignal(),
    };

    await callITwinApiTestRunner(expectedQueryParams, async () => {
      await systemUnderTest.getExtension({
        savedViewId,
        extensionName,
        signal: new AbortSignal(),
      });
    }, checkIfFetchIsReceivingExpectedParams);
  });

  it("getAllExtensions", async () => {
    const savedViewId = "savedViewComboId";
    const expectedQueryParams: TestQueryParams = {
      urlParams: ["extensions", savedViewId],
      method: "GET",
      headers: {},
      signal: new AbortSignal(),
    };

    await callITwinApiTestRunner(expectedQueryParams, async () => {
      await systemUnderTest.getAllExtensions({
        savedViewId,
        signal: new AbortSignal(),
      });
    }, checkIfFetchIsReceivingExpectedParams);
  });

  it("createExtension", async () => {
    const savedViewId = "savedViewComboId";
    const extensionName = "name";
    const body = {
      extensionName,
      data: "data",
    };
    const expectedQueryParams: TestQueryParams = {
      urlParams: ["extensions", savedViewId],
      method: "PUT",
      body,
      headers: {},
      signal: new AbortSignal(),
    };

    await callITwinApiTestRunner(expectedQueryParams, async () => {
      await systemUnderTest.createExtension({
        savedViewId,
        ...body,
        signal: new AbortSignal(),
      });
    }, checkIfFetchIsReceivingExpectedParams);
  });

  it("deleteExtension", async () => {
    const savedViewId = "savedViewComboId";
    const extensionName = "name";
    const expectedQueryParams: TestQueryParams = {
      urlParams: ["extensions", savedViewId, extensionName],
      method: "DELETE",
      headers: {},
      signal: new AbortSignal(),
    };

    await callITwinApiTestRunner(expectedQueryParams, async () => {
      await systemUnderTest.deleteExtension({
        savedViewId,
        extensionName,
        signal: new AbortSignal(),
      });
    }, checkIfFetchIsReceivingExpectedParams);
  });

  it("getTag", async () => {
    const tagId = "TagId";
    const expectedQueryParams: TestQueryParams = {
      urlParams: ["tags", tagId],
      method: "GET",
      headers: {},
      signal: new AbortSignal(),
    };

    await callITwinApiTestRunner(expectedQueryParams, async () => {
      await systemUnderTest.getTag({
        tagId,
        signal: new AbortSignal(),
      });
    }, checkIfFetchIsReceivingExpectedParams);
  });

  it("getAllTags", async () => {
    const iTwinId = "iTwinId";
    const iModelId = "iModelId";
    const expectedQueryParams: TestQueryParams = {
      urlParams: ["tags", iTwinId, iModelId],
      method: "GET",
      headers: {},
      signal: new AbortSignal(),
    };

    await callITwinApiTestRunner(expectedQueryParams, async () => {
      await systemUnderTest.getAllTags({
        iTwinId,
        iModelId,
        signal: new AbortSignal(),
      });
    }, checkIfFetchIsReceivingExpectedParams);
  });

  it("createTag", async () => {
    const body = {
      iTwinId: "iTwinId",
      iModelId: "iModelId",
      displayName: "displayName",
    };
    const expectedQueryParams: TestQueryParams = {
      urlParams: ["tags"],
      method: "POST",
      body,
      headers: {},
      signal: new AbortSignal(),
    };

    await callITwinApiTestRunner(expectedQueryParams, async () => {
      await systemUnderTest.createTag({
        ...body,
        signal: new AbortSignal(),
      });
    }, checkIfFetchIsReceivingExpectedParams);
  });

  it("updateTag", async () => {
    const tagId = "tagId";
    const body = {
      displayName: "displayName",
    };
    const expectedQueryParams: TestQueryParams = {
      urlParams: ["tags", tagId],
      method: "PATCH",
      body,
      headers: {},
      signal: new AbortSignal(),
    };

    await callITwinApiTestRunner(expectedQueryParams, async () => {
      await systemUnderTest.updateTag({
        tagId,
        ...body,
        signal: new AbortSignal(),
      });
    }, checkIfFetchIsReceivingExpectedParams);
  });

  it("deleteTag", async () => {
    const tagId = "TagId";
    const expectedQueryParams: TestQueryParams = {
      urlParams: ["tags", tagId],
      method: "DELETE",
      headers: {},
      signal: new AbortSignal(),
    };

    await callITwinApiTestRunner(expectedQueryParams, async () => {
      await systemUnderTest.deleteTag({
        tagId,
        signal: new AbortSignal(),
      });
    }, checkIfFetchIsReceivingExpectedParams);
  });

  it("run failed request and check error output", async () => {
    const savedViewId = "savedViewComboId";
    const expectedQueryParams: TestQueryParams = {
      urlParams: [savedViewId],
      method: "GET",
      headers: {
        prefer: PreferOptions.Minimal,
      },
      body: undefined,
      signal: new AbortSignal(),
    };

    try {
      await callITwinApiTestRunner(expectedQueryParams, async () => {
        await systemUnderTest.getSavedViewMinimal({
          savedViewId: savedViewId,
          signal: new AbortSignal(),
        });
      }, createFailedRequest);
    } catch (error: any) {
      expect(error.message).toBe("iTwin API request failed. Unexpected response status code: 500 Test.");
    }
  });
});
