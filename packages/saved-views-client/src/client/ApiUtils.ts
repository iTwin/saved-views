/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

export interface CallITwinApiParams<BodyType> {
  method: "GET"|"POST"|"PATCH"|"PUT"|"DELETE";
  url: string;
  getAccessToken: () => Promise<string>;
  signal?: AbortSignal | undefined;
  headers?: Record<string, string> | undefined;
  body?: BodyType;
}

export async function callITwinApi<BodyType>(args: CallITwinApiParams<BodyType>): Promise<Record<string, unknown>> {
  const response = await fetch(
    args.url,
    {
      method: args.method,
      headers: {
        ...args.headers,
        Authorization: await args.getAccessToken(),
      },
      body: args.body && JSON.stringify(args.body),
      signal: args.signal,
    },
  );

  if (!response.ok) {
    await throwBadResponseCodeError(response, "iTwin API request failed.");
  }

  return response.json();
}

async function throwBadResponseCodeError(
  response: Response,
  errorMessage: string,
): Promise<never> {
  let error: unknown;
  try {
    error = (await response.json()).error;
  } catch {
    throw new Error(`${errorMessage} Unexpected response status code: ${response.status} ${response.statusText}.`);
  }

  throw error;
}
