export class TelerException extends Error {
    /**
     * Base Exception model
     */
    public code: number;

    constructor(message: string = "", code: number = 500) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
    }
}

export class BadParametersException extends TelerException {
    /**
     * 
     * if parameters are invalid.
     */
    public param: string;

    constructor(param: string = "", message: string = "Bad Parameter(s).", code: number = 400) {
        super(message, code);
        this.param = param;
    }
}

export class UnprocessableRequestException extends TelerException {
    /**
     * 
     * if request body is invalid.
     */

    constructor(message: string = "Unprocessable Request.", code: number = 422) {
        super(message, code);
    }
}

export class UnauthorizedException extends TelerException {
    /**
     * 
     * if user is unauthorized to access the server.
     */
    constructor(message: string = "Unauthorized.", code: number = 401) {
        super(message, code);
    }
}

export class ForbiddenException extends TelerException {
    /**
     * 
     * if user is making forbidden request.
     */
    constructor(message: string = "Forbidden.", code: number = 403) {
        super(message, code);
    }
}

export class NotFoundException extends TelerException {
    /**
     * 
     * if the request does not exist.
     */
    constructor(message: string = "Not Found.", code: number = 404) {
        super(message, code);
    }
}

export class InternalServerErrorException extends TelerException {
    constructor(message: string = "Internal Server Error", code: number = 500) {
        super(message, code);
    }
}

export class NotImplementedException extends TelerException {
    /**
     * 
     * if the feature is not implemented.
     */
    constructor(message: string = "Not implemented.", code: number = 501) {
        super(message, code);
    }
}