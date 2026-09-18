import { describe, it, expect } from "vitest";
import {
  TelerException,
  BadParametersException,
  UnprocessableRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  GoneException,
  RateLimitException,
  InternalServerErrorException,
  NotImplementedException,
  NetworkException
} from "@/exceptions";

describe("TelerException hierarchy", () => {
  describe("TelerException (base)", () => {
    it("sets name, message, status, and details", () => {
      const err = new TelerException({
        message: "base error",
        details: { field: "x" },
        status: 500
      });
      expect(err.name).toBe("TelerException");
      expect(err.message).toBe("base error");
      expect(err.status).toBe(500);
      expect(err.details).toEqual({ field: "x" });
    });

    it("is an instance of Error", () => {
      expect(new TelerException()).toBeInstanceOf(Error);
    });

    it("defaults message to empty string, status and details to undefined", () => {
      const err = new TelerException();
      expect(err.message).toBe("");
      expect(err.status).toBeUndefined();
      expect(err.details).toBeUndefined();
    });

    it("independently sets status and errorCode", () => {
      const err = new TelerException({
        message: "API error",
        details: { field: "x" },
        status: 403,
        errorCode: "AUTH_EXPIRED"
      });
      expect(err.status).toBe(403);
      expect(err.errorCode).toBe("AUTH_EXPIRED");
    });

    it("independently sets status, errorCode, and type", () => {
      const err = new TelerException({
        message: "API error",
        details: { field: "x" },
        status: 409,
        errorCode: "transfer_in_progress",
        type: "invalid_state"
      });
      expect(err.status).toBe(409);
      expect(err.errorCode).toBe("transfer_in_progress");
      expect(err.type).toBe("invalid_state");
    });

    it("param and type default to undefined", () => {
      const err = new TelerException({ message: "error" });
      expect(err.param).toBeUndefined();
      expect(err.type).toBeUndefined();
    });
  });

  describe("BadParametersException (400)", () => {
    it("has name BadParametersException and status 400", () => {
      const err = new BadParametersException({
        message: "Invalid value",
        errorCode: "INVALID_EMAIL",
        param: "email"
      });
      expect(err.name).toBe("BadParametersException");
      expect(err.status).toBe(400);
      expect(err.param).toBe("email");
      expect(err.errorCode).toBe("INVALID_EMAIL");
      expect(err.message).toBe("Invalid value");
    });

    it("is an instance of TelerException and Error", () => {
      const err = new BadParametersException();
      expect(err).toBeInstanceOf(TelerException);
      expect(err).toBeInstanceOf(Error);
    });

    it("defaults to generic message when none provided", () => {
      const err = new BadParametersException();
      expect(err.message).toBe("Bad Parameter(s).");
      expect(err.param).toBeUndefined();
      expect(err.type).toBeUndefined();
    });

    it("carries the invalid cursor message from API", () => {
      const err = new BadParametersException({
        message: "The pagination cursor is invalid or has expired."
      });
      expect(err.message).toBe(
        "The pagination cursor is invalid or has expired."
      );
      expect(err.status).toBe(400);
    });

    it("independently sets status, errorCode, and type", () => {
      const err = new BadParametersException({
        message: "Invalid",
        errorCode: "INVALID_EMAIL_FORMAT",
        type: "validation_error"
      });
      expect(err.status).toBe(400);
      expect(err.errorCode).toBe("INVALID_EMAIL_FORMAT");
      expect(err.param).toBeUndefined();
      expect(err.type).toBe("validation_error");
    });
  });

  describe("UnprocessableRequestException (422)", () => {
    it("has name UnprocessableRequestException and status 422", () => {
      const details = {
        success: false,
        message: "Validation Error",
        errors: [
          { loc: ["body", "name"], msg: "field required", type: "value_error" }
        ]
      };
      const err = new UnprocessableRequestException({
        message: "Validation Error",
        details,
        param: "body.name"
      });
      expect(err.name).toBe("UnprocessableRequestException");
      expect(err.status).toBe(422);
      expect(err.message).toBe("Validation Error");
      expect(err.param).toBe("body.name");
      expect(err.details).toEqual(details);
    });

    it("is an instance of TelerException", () => {
      expect(new UnprocessableRequestException()).toBeInstanceOf(
        TelerException
      );
    });

    it("defaults to generic message", () => {
      const err = new UnprocessableRequestException();
      expect(err.message).toBe("Unprocessable Request.");
      expect(err.param).toBeUndefined();
      expect(err.status).toBe(422);
    });

    it("preserves full validation response in details", () => {
      const fullResponse = {
        success: false,
        message: "Validation Error",
        errors: [
          {
            type: "string_pattern_mismatch",
            loc: ["body", "from_number"],
            msg: "String should match pattern '^\\+\\d{7,15}$'",
            input: "918065200756",
            ctx: { pattern: "^\\+\\d{7,15}$" }
          }
        ]
      };
      const err = new UnprocessableRequestException({
        message: "Validation Error",
        details: fullResponse,
        param: "body.from_number"
      });
      expect(err.details).toEqual(fullResponse);
      const details = err.details as typeof fullResponse;
      expect(details.errors[0].input).toBe("918065200756");
      expect(details.errors[0].ctx).toEqual({ pattern: "^\\+\\d{7,15}$" });
    });
  });

  describe("UnauthorizedException (401)", () => {
    it("has name UnauthorizedException and status 401", () => {
      const err = new UnauthorizedException({ message: "Token expired." });
      expect(err.name).toBe("UnauthorizedException");
      expect(err.status).toBe(401);
      expect(err.message).toBe("Token expired.");
    });

    it("is an instance of TelerException", () => {
      expect(new UnauthorizedException()).toBeInstanceOf(TelerException);
    });

    it("carries errorCode and type", () => {
      const err = new UnauthorizedException({
        message: "Unauthorized",
        errorCode: "TOKEN_EXPIRED",
        type: "auth_error"
      });
      expect(err.errorCode).toBe("TOKEN_EXPIRED");
      expect(err.type).toBe("auth_error");
    });
  });

  describe("ForbiddenException (403)", () => {
    it("has name ForbiddenException and status 403", () => {
      const err = new ForbiddenException({ message: "Invalid API Key." });
      expect(err.name).toBe("ForbiddenException");
      expect(err.status).toBe(403);
      expect(err.message).toBe("Invalid API Key.");
    });

    it("is an instance of TelerException", () => {
      expect(new ForbiddenException()).toBeInstanceOf(TelerException);
    });

    it("defaults to Forbidden message", () => {
      expect(new ForbiddenException().message).toBe("Forbidden.");
    });

    it("carries errorCode from API response", () => {
      const err = new ForbiddenException({
        message: "Access denied",
        errorCode: "AUTH_INSUFFICIENT_PERMISSIONS"
      });
      expect(err.errorCode).toBe("AUTH_INSUFFICIENT_PERMISSIONS");
    });
  });

  describe("NotFoundException (404)", () => {
    it("has name NotFoundException and status 404", () => {
      const err = new NotFoundException({
        message: "The requested secret was not found."
      });
      expect(err.name).toBe("NotFoundException");
      expect(err.status).toBe(404);
      expect(err.message).toBe("The requested secret was not found.");
    });

    it("is an instance of TelerException", () => {
      expect(new NotFoundException()).toBeInstanceOf(TelerException);
    });

    it("defaults to Not Found message", () => {
      expect(new NotFoundException().message).toBe("Not Found.");
    });

    it("carries errorCode when provided", () => {
      const err = new NotFoundException({
        message: "Resource not found",
        details: { id: "sk_123" },
        errorCode: "RESOURCE_NOT_FOUND"
      });
      expect(err.errorCode).toBe("RESOURCE_NOT_FOUND");
      expect(err.details).toEqual({ id: "sk_123" });
    });
  });

  describe("ConflictException (409)", () => {
    it("has name ConflictException and status 409", () => {
      const err = new ConflictException({
        message: "This event cannot be redelivered in its current state."
      });
      expect(err.name).toBe("ConflictException");
      expect(err.status).toBe(409);
    });

    it("is an instance of TelerException", () => {
      expect(new ConflictException()).toBeInstanceOf(TelerException);
    });

    it("defaults to Resource conflict message", () => {
      expect(new ConflictException().message).toBe("Resource conflict.");
    });

    it("carries errorCode and type for conflict scenarios", () => {
      const err = new ConflictException({
        message: "Transfer in progress",
        errorCode: "transfer_in_progress",
        type: "invalid_state"
      });
      expect(err.errorCode).toBe("transfer_in_progress");
      expect(err.type).toBe("invalid_state");
    });
  });

  describe("GoneException (410)", () => {
    it("has name GoneException and status 410", () => {
      const err = new GoneException({
        message: "Resource is no longer available."
      });
      expect(err.name).toBe("GoneException");
      expect(err.status).toBe(410);
      expect(err.message).toBe("Resource is no longer available.");
    });

    it("is an instance of TelerException", () => {
      expect(new GoneException()).toBeInstanceOf(TelerException);
    });

    it("defaults to generic message when none provided", () => {
      expect(new GoneException().message).toBe(
        "Resource is no longer available."
      );
    });

    it("carries errorCode when provided", () => {
      const err = new GoneException({
        message: "Resource deleted",
        errorCode: "RESOURCE_DELETED",
        type: "deleted"
      });
      expect(err.errorCode).toBe("RESOURCE_DELETED");
      expect(err.type).toBe("deleted");
    });
  });

  describe("RateLimitException (429)", () => {
    it("has name RateLimitException and status 429", () => {
      const err = new RateLimitException({
        message: "Rate limit exceeded. Retry after 60s."
      });
      expect(err.name).toBe("RateLimitException");
      expect(err.status).toBe(429);
    });

    it("is an instance of TelerException", () => {
      expect(new RateLimitException()).toBeInstanceOf(TelerException);
    });

    it("carries errorCode and type", () => {
      const err = new RateLimitException({
        message: "Too many requests",
        errorCode: "RATE_LIMIT_EXCEEDED",
        type: "rate_limit"
      });
      expect(err.errorCode).toBe("RATE_LIMIT_EXCEEDED");
      expect(err.type).toBe("rate_limit");
    });
  });

  describe("InternalServerErrorException (500+)", () => {
    it("has name InternalServerErrorException and status 500", () => {
      const err = new InternalServerErrorException({
        message: "An unexpected error occurred."
      });
      expect(err.name).toBe("InternalServerErrorException");
      expect(err.status).toBe(500);
    });

    it("accepts custom 5xx statuses (e.g. 502, 503)", () => {
      const err502 = new InternalServerErrorException({
        message: "Bad Gateway",
        status: 502
      });
      const err503 = new InternalServerErrorException({
        message: "Service Unavailable",
        status: 503
      });
      expect(err502.status).toBe(502);
      expect(err503.status).toBe(503);
    });

    it("carries errorCode and type from server response", () => {
      const err = new InternalServerErrorException({
        message: "Internal server error",
        details: { error: "details" },
        status: 500,
        errorCode: "DATABASE_ERROR",
        type: "server_error"
      });
      expect(err.status).toBe(500);
      expect(err.errorCode).toBe("DATABASE_ERROR");
      expect(err.type).toBe("server_error");
    });

    it("is an instance of TelerException", () => {
      expect(new InternalServerErrorException()).toBeInstanceOf(TelerException);
    });
  });

  describe("NotImplementedException (501)", () => {
    it("has name NotImplementedException and status 501", () => {
      const err = new NotImplementedException({
        message: "Feature not available.",
        status: 501
      });
      expect(err.name).toBe("NotImplementedException");
      expect(err.status).toBe(501);
    });

    it("is an instance of TelerException", () => {
      expect(new NotImplementedException()).toBeInstanceOf(TelerException);
    });

    it("carries errorCode from server response", () => {
      const err = new NotImplementedException({
        message: "Feature not implemented",
        status: 501,
        errorCode: "FEATURE_NOT_AVAILABLE"
      });
      expect(err.errorCode).toBe("FEATURE_NOT_AVAILABLE");
    });
  });

  describe("NetworkException", () => {
    it("assigns message, details, and errorCode correctly", () => {
      const err = new NetworkException({
        message: "Connection refused",
        details: { host: "api.frejun.ai" },
        errorCode: "ECONNREFUSED"
      });
      expect(err.name).toBe("NetworkException");
      expect(err.message).toBe("Connection refused");
      expect(err.details).toEqual({ host: "api.frejun.ai" });
      expect(err.errorCode).toBe("ECONNREFUSED");
      expect(err.status).toBeUndefined();
    });

    it("is an instance of TelerException and Error", () => {
      const err = new NetworkException({ message: "err" });
      expect(err).toBeInstanceOf(TelerException);
      expect(err).toBeInstanceOf(Error);
    });
  });

  describe("instanceof checks across the hierarchy", () => {
    const allExceptions = [
      new BadParametersException(),
      new UnprocessableRequestException(),
      new UnauthorizedException(),
      new ForbiddenException(),
      new NotFoundException(),
      new ConflictException(),
      new GoneException(),
      new RateLimitException(),
      new InternalServerErrorException(),
      new NotImplementedException()
    ];

    it.each(allExceptions)(
      "%s is an instance of TelerException and Error",
      (err) => {
        expect(err).toBeInstanceOf(TelerException);
        expect(err).toBeInstanceOf(Error);
      }
    );

    it("each exception name matches its constructor name", () => {
      allExceptions.forEach((err) => {
        expect(err.name).toBe(err.constructor.name);
      });
    });
  });

  describe("details field", () => {
    it("accepts object details", () => {
      const err = new NotFoundException({
        message: "not found",
        details: { id: "sk_123" }
      });
      expect(err.details).toEqual({ id: "sk_123" });
    });

    it("accepts array details (validation errors)", () => {
      const details = [
        { loc: ["name"], msg: "field required", type: "value_error" }
      ];
      const err = new UnprocessableRequestException({
        message: "Validation failed",
        details
      });
      expect(err.details).toEqual(details);
    });

    it("accepts string details", () => {
      const err = new ConflictException({
        message: "conflict",
        details: "Resource is in use"
      });
      expect(err.details).toBe("Resource is in use");
    });

    it("is undefined when not provided", () => {
      expect(new NotFoundException().details).toBeUndefined();
    });
  });
});
