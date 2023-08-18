export interface CommonRequestArgs {
  signal?: AbortSignal | undefined;
  headers?: Record<string, string> | undefined;
}

export interface CommonClientArgs {
  /** url that conforms to pattern https://{...}api.bentley.com/savedviews */
  baseURL: string;
  /** function for getting auth token */
  getAccessToken: () => Promise<string>;
}

type saveViewsBaseUrl = string;

export function isValidBaseUrl(value: string): value is saveViewsBaseUrl {
  return value.startsWith("https://") && value.endsWith("api.bentley.com/savedviews");
}
