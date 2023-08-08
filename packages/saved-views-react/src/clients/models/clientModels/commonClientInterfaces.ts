export interface commonRequestArgs {
  signal?: AbortSignal | undefined;
  headers?: Record<string, string> | undefined;
}

export interface commonClientArgs {
  baseURL: string;
  getAccessToken: () => Promise<string>;
}
