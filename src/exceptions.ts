/**
 * Teler Base Exception model.
 */
export class TelerException extends Error {
  public code: number | string | undefined;
  public param?: string;
  public details?: unknown;

  constructor(
    message = "",
    details?: unknown,
    code?: number | string,
    param: string = ""
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
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
    public param = "",
    message = "Bad Parameter(s).",
    details?: unknown,
    code = 400
  ) {
    super(message, details, code, param);
  }
}

/**
 *
 * If user is unauthorized to make request.
 */
export class UnauthorizedException extends TelerException {
  constructor(message = "Unauthorized.", details?: unknown, code = 401) {
    super(message, details, code);
  }
}

/**
 *
 * If user makes forbidden request.
 */
export class ForbiddenException extends TelerException {
  constructor(message = "Forbidden.", details?: unknown, code = 403) {
    super(message, details, code);
  }
}

/**
 *
 * If the requested resource does not exist.
 */
export class NotFoundException extends TelerException {
  constructor(message = "Not Found.", details?: unknown, code = 404) {
    super(message, details, code);
  }
}

/**
 *
 * If the requested resource conflicts with the current state.
 */
export class ConflictException extends TelerException {
  constructor(message = "Resource conflict.", details?: unknown, code = 409) {
    super(message, details, code);
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
    code = 422
  ) {
    super(message, details, code);
  }
}

/**
 *
 * If the rate limit is exceeded.
 */
export class RateLimitException extends TelerException {
  constructor(message = "Rate Limit.", details?: unknown, code = 429) {
    super(message, details, code);
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
    code = 500
  ) {
    super(message, details, code);
  }
}

/**
 *
 * If the requested feature is not implemented.
 */
export class NotImplementedException extends TelerException {
  constructor(message = "Not implemented.", details?: unknown, code = 501) {
    super(message, details, code);
  }
}

/**
 * Thrown when a request fails with no response from the server —
 * network-level failures such as timeout, DNS resolution failure,
 * or connection refused/reset. Distinct from server-side error
 * responses (4xx/5xx), since no response was ever received.
 */
export class NetworkException extends TelerException {
  constructor(message: string, details?: unknown, code?: string) {
    super(message, details, code);
  }
}
