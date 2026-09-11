/**
 * Teler Base Exception model.
 */
export class TelerException extends Error {
  public status?: number;
  public errorCode?: string;
  public type?: string;
  public param?: string;
  public details?: unknown;

  constructor(
    message = "",
    details?: unknown,
    status?: number,
    errorCode?: string,
    param?: string,
    type?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.errorCode = errorCode;
    this.type = type;
    this.param = param;
    this.details = details;
  }
}

/**
 *
 * If the parameters are invalid.
 */
export class BadParametersException extends TelerException {
  constructor(
    message = "Bad Parameter(s).",
    details?: unknown,
    status = 400,
    errorCode?: string,
    param?: string,
    type?: string
  ) {
    super(message, details, status, errorCode, param, type);
  }
}

/**
 *
 * If user is unauthorized to make request.
 */
export class UnauthorizedException extends TelerException {
  constructor(
    message = "Unauthorized.",
    details?: unknown,
    status = 401,
    errorCode?: string,
    param?: string,
    type?: string
  ) {
    super(message, details, status, errorCode, param, type);
  }
}

/**
 *
 * If user makes forbidden request.
 */
export class ForbiddenException extends TelerException {
  constructor(
    message = "Forbidden.",
    details?: unknown,
    status = 403,
    errorCode?: string,
    param?: string,
    type?: string
  ) {
    super(message, details, status, errorCode, param, type);
  }
}

/**
 *
 * If the requested resource does not exist.
 */
export class NotFoundException extends TelerException {
  constructor(
    message = "Not Found.",
    details?: unknown,
    status = 404,
    errorCode?: string,
    param?: string,
    type?: string
  ) {
    super(message, details, status, errorCode, param, type);
  }
}

/**
 *
 * If the requested resource conflicts with the current state.
 */
export class ConflictException extends TelerException {
  constructor(
    message = "Resource conflict.",
    details?: unknown,
    status = 409,
    errorCode?: string,
    param?: string,
    type?: string
  ) {
    super(message, details, status, errorCode, param, type);
  }
}

/**
 * If the resource is no longer available.
 */
export class GoneException extends TelerException {
  constructor(
    message = "Resource is no longer available.",
    details?: unknown,
    status = 410,
    errorCode?: string,
    param?: string,
    type?: string
  ) {
    super(message, details, status, errorCode, param, type);
  }
}

/**
 *
 * If the request body is invalid.
 */
export class UnprocessableRequestException extends TelerException {
  constructor(
    message = "Unprocessable Request.",
    details?: unknown,
    status = 422,
    errorCode?: string,
    param?: string
  ) {
    super(message, details, status, errorCode, param);
  }
}

/**
 *
 * If the rate limit is exceeded.
 */
export class RateLimitException extends TelerException {
  constructor(
    message = "Rate Limit.",
    details?: unknown,
    status = 429,
    errorCode?: string,
    param?: string,
    type?: string
  ) {
    super(message, details, status, errorCode, param, type);
  }
}

/**
 *
 * If an internal server error occurs.
 */
export class InternalServerErrorException extends TelerException {
  constructor(
    message = "Internal Server Error.",
    details?: unknown,
    status = 500,
    errorCode?: string,
    param?: string,
    type?: string
  ) {
    super(message, details, status, errorCode, param, type);
  }
}

/**
 *
 * If the requested feature is not implemented.
 */
export class NotImplementedException extends TelerException {
  constructor(
    message = "Not implemented.",
    details?: unknown,
    status = 501,
    errorCode?: string,
    param?: string,
    type?: string
  ) {
    super(message, details, status, errorCode, param, type);
  }
}

/**
 * Thrown when a request fails with no response from the server —
 * network-level failures such as timeout, DNS resolution failure,
 * or connection refused/reset. Distinct from server-side error
 * responses (4xx/5xx), since no response was ever received.
 */
export class NetworkException extends TelerException {
  constructor(message: string, details?: unknown, errorCode?: string) {
    super(message, details, undefined, errorCode);
  }
}
