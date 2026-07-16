/**
 * Teler Base Exception model
 */
export class TelerException extends Error {
    public code;

    constructor(message = "", code = 500) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
    }
}

/**
 * 
 * If the parameters are invalid.
 */
export class BadParametersException extends TelerException {
    public param: string;

    constructor(param = "", message = "Bad Parameter(s).", code = 400) {
        super(message, code);
        this.param = param;
    }
}

/**
 * 
 * If the request body is invalid.
 */
export class UnprocessableRequestException extends TelerException {

    constructor(message = "Unprocessable Request.", code = 422) {
        super(message, code);
    }
}

/**
 * 
 * If user is unauthorized to make request.
 */
export class UnauthorizedException extends TelerException {

    constructor(message = "Unauthorized.", code = 401) {
        super(message, code);
    }
}

/**
 * 
 * If user makes forbidden request.
 */
export class ForbiddenException extends TelerException {
    
    constructor(message = "Forbidden.", code = 403) {
        super(message, code);
    }
}

/**
 * 
 * If the request does not exist.
 */
export class NotFoundException extends TelerException {
    
    constructor(message = "Not Found.", code = 404) {
        super(message, code);
    }
}

/**
 * 
 * If rate limit is reached.
 */
export class RateLimitException extends TelerException {

    constructor(message = "Rate Limit.", code = 429) {
        super(message, code);
    }
}

/**
 * 
 * If Internal Server Error occurs.
 */
export class InternalServerErrorException extends TelerException {
    
    constructor(message = "Internal Server Error.", code = 500) {
        super(message, code);
    }
}

/**
 * 
 * If the feature is not implemented.
 */
export class NotImplementedException extends TelerException {
    
    constructor(message = "Not implemented.", code = 501) {
        super(message, code);
    }
}