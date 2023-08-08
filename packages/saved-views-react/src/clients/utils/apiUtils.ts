// Copyright (c) Bentley Systems, Incorporated. All rights reserved.
import { HttpActions } from "../models/httpActionsAndStatus";

export interface CallITwinApiParams<BodyType extends object> {
  method: HttpActions;
  url: string;
  getAccessToken: () => Promise<string>;
  signal?: AbortSignal | undefined;
  headers?: Record<string, string> | undefined;
  body?: BodyType;
}

export async function callITwinApi<BodyType extends object>(args:CallITwinApiParams<BodyType>): Promise<Record<string, unknown>> {
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
