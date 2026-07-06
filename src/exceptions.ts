/**
 * Teler Base Exception model
 */
export class TelerException extends Error {
    public code: number;

    constructor(message: string = "", code: number = 500) {
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

    constructor(param: string = "", message: string = "Bad Parameter(s).", code: number = 400) {
        super(message, code);
        this.param = param;
    }
}

/**
 * 
 * If the request body is invalid.
 */
export class UnprocessableRequestException extends TelerException {

    constructor(message: string = "Unprocessable Request.", code: number = 422) {
        super(message, code);
    }
}

/**
 * 
 * If user is unauthorized to make request.
 */
export class UnauthorizedException extends TelerException {

    constructor(message: string = "Unauthorized.", code: number = 401) {
        super(message, code);
    }
}

/**
 * 
 * If user makes forbidden request.
 */
export class ForbiddenException extends TelerException {
    
    constructor(message: string = "Forbidden.", code: number = 403) {
        super(message, code);
    }
}

/**
 * 
 * If the request does not exist.
 */
export class NotFoundException extends TelerException {
    
    constructor(message: string = "Not Found.", code: number = 404) {
        super(message, code);
    }
}

/**
 * 
 * If Internal Server Error occurs.
 */
export class InternalServerErrorException extends TelerException {
    
    constructor(message: string = "Internal Server Error", code: number = 500) {
        super(message, code);
    }
}

/**
 * 
 * If the feature is not implemented.
 */
export class NotImplementedException extends TelerException {
    
    constructor(message: string = "Not implemented.", code: number = 501) {
        super(message, code);
    }
}