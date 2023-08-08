// Copyright (c) Bentley Systems, Incorporated. All rights reserved.

/**
 * Http Action enum for request.
 */
export enum HttpActions {
  DELETE = "DELETE",
  GET = "GET",
  PATCH = "PATCH",
  POST = "POST",
  PUT = "PUT",
}


/**
 * Status enum for request.
 */
export enum HttpStatus {
  SUCCESS_OKAY = 200,
  SUCCESS_CREATED = 201,
  SUCCESS_NO_CONTENT = 204,
  FAILURE_UNAUTHORIZED = 401,
  FAILURE_NOT_FOUND = 404,
  FAILURE_TOO_MANY_REQUESTS = 421,
}
