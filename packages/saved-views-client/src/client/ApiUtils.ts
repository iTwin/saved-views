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

export async function callITwinApi(args: CallITwinApiParams): Promise<unknown> {
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

  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

/** Type guard for error responses */
function isErrorResponse(value: unknown): value is { error: unknown; } {
  return typeof value === "object" && value !== null && "error" in value;
}

async function throwBadResponseCodeError(response: Response, errorMessage: string): Promise<never> {
  let error: unknown;
  try {
    const resp = (await response.json());
    if (!isErrorResponse(resp)) {
      throw 0;
    }
    error = resp.error;
  } catch {
    const statusText = response.statusText ? ` ${response.statusText}` : "";
    throw new Error(
      `${errorMessage} Unexpected response status code: ${response.status}${statusText}.`,
    );
  }

  throw error;
}
