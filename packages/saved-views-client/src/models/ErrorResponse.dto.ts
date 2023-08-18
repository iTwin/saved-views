// Copyright (c) Bentley Systems, Incorporated. All rights reserved.

/**
 * Error detail model.
 */
export interface ErrorDetail {
  code: string;
  message: string;
  target?: string;
}

/**
 * Error model.
 */
export interface Error extends ErrorDetail {
  details?: ErrorDetail[];
}

/**
 * Error response.
 */
export interface ErrorResponse {
  error: Error;
}
