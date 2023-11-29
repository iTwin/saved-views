/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

export interface CallITwinApiParams {
  url: string;
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  getAccessToken: () => Promise<string>;
  body?: object | undefined;
  headers?: Record<string, string> | undefined;
  signal?: AbortSignal | undefined;
}

export async function callITwinApi(args: CallITwinApiParams): Promise<Record<string, unknown>> {
  const response = await fetch(args.url, {
    method: args.method,
    body: args.body && JSON.stringify(args.body),
    headers: {
      ...args.headers,
      Authorization: await args.getAccessToken(),
    },
    signal: args.signal,
  });

  if (!response.ok) {
    await throwBadResponseCodeError(response, "iTwin API request failed.");
  }

  return response.json();
}

async function throwBadResponseCodeError(response: Response, errorMessage: string): Promise<never> {
  let error: unknown;
  try {
    error = (await response.json()).error;
  } catch {
    throw new Error(
      `${errorMessage} Unexpected response status code: ${response.status} ${response.statusText}.`,
    );
  }

  throw error;
}
