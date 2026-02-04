export class TelerException extends Error {
    /**
     * Base Exception model
     */
    public code: number;

    constructor(message: string = "", code: number = 500,) {
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

    constructor(param: string = "", message: string = "Bad Parameter(s).") {
        super(message, 400);
        this.param = param;
    }
}

export class UnauthorizedException extends TelerException {
    /**
     * 
     * if user is unauthorized to access the server.
     */
    constructor(message: string = "Unauthorized.") {
        super(message, 401);
    }
}

export class ForbiddenException extends TelerException {
    /**
     * 
     * if user is making forbidden request.
     */
    constructor(message: string = "Forbidden.") {
        super(message, 403);
    }
}

export class NotImplementedException extends TelerException {
    /**
     * 
     * if the error is not implemented.
     */
    constructor(message: string = "Not implemented.") {
        super(message, 501);
    }
}