/**
 * Teler Base Exception model.
 */
export interface TelerExceptionOptions {
  message?: string;
  details?: unknown;
  status?: number;
  errorCode?: string;
  param?: string;
  type?: string;
}

export class TelerException extends Error {
  public status?: number;
  public errorCode?: string;
  public type?: string;
  public param?: string;
  public details?: unknown;

  constructor(opts: TelerExceptionOptions = {}) {
    super(opts.message ?? "");
    this.name = "TelerException";
    this.status = opts.status;
    this.errorCode = opts.errorCode;
    this.type = opts.type;
    this.param = opts.param;
    this.details = opts.details;
  }
}

/**
 * If the parameters are invalid.
 */
export class BadParametersException extends TelerException {
  constructor(opts: TelerExceptionOptions = {}) {
    super({ message: "Bad Parameter(s).", status: 400, ...opts });
    this.name = "BadParametersException";
  }
}

/**
 * If user is unauthorized to make request.
 */
export class UnauthorizedException extends TelerException {
  constructor(opts: TelerExceptionOptions = {}) {
    super({ message: "Unauthorized.", status: 401, ...opts });
    this.name = "UnauthorizedException";
  }
}

/**
 * If user makes forbidden request.
 */
export class ForbiddenException extends TelerException {
  constructor(opts: TelerExceptionOptions = {}) {
    super({ message: "Forbidden.", status: 403, ...opts });
    this.name = "ForbiddenException";
  }
}

/**
 * If the requested resource does not exist.
 */
export class NotFoundException extends TelerException {
  constructor(opts: TelerExceptionOptions = {}) {
    super({ message: "Not Found.", status: 404, ...opts });
    this.name = "NotFoundException";
  }
}

/**
 * If the requested resource conflicts with the current state.
 */
export class ConflictException extends TelerException {
  constructor(opts: TelerExceptionOptions = {}) {
    super({ message: "Resource conflict.", status: 409, ...opts });
    this.name = "ConflictException";
  }
}

/**
 * If the resource is no longer available.
 */
export class GoneException extends TelerException {
  constructor(opts: TelerExceptionOptions = {}) {
    super({
      message: "Resource is no longer available.",
      status: 410,
      ...opts
    });
    this.name = "GoneException";
  }
}

/**
 * If the request body is invalid.
 */
export class UnprocessableRequestException extends TelerException {
  constructor(opts: TelerExceptionOptions = {}) {
    super({ message: "Unprocessable Request.", status: 422, ...opts });
    this.name = "UnprocessableRequestException";
  }
}

/**
 * If the rate limit is exceeded.
 */
export class RateLimitException extends TelerException {
  constructor(opts: TelerExceptionOptions = {}) {
    super({ message: "Rate Limit.", status: 429, ...opts });
    this.name = "RateLimitException";
  }
}

/**
 * If an internal server error occurs.
 */
export class InternalServerErrorException extends TelerException {
  constructor(opts: TelerExceptionOptions = {}) {
    super({ message: "Internal Server Error.", status: 500, ...opts });
    this.name = "InternalServerErrorException";
  }
}

/**
 * If the requested feature is not implemented.
 */
export class NotImplementedException extends TelerException {
  constructor(opts: TelerExceptionOptions = {}) {
    super({ message: "Not implemented.", status: 501, ...opts });
    this.name = "NotImplementedException";
  }
}

/**
 * Thrown when a request fails with no response from the server —
 * network-level failures such as timeout, DNS resolution failure,
 * or connection refused/reset. Distinct from server-side error
 * responses (4xx/5xx), since no response was ever received.
 */
export class NetworkException extends TelerException {
  constructor(opts: TelerExceptionOptions = {}) {
    super(opts);
    this.name = "NetworkException";
  }
}
