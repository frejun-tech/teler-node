import { describe, it, expect } from 'vitest';
import {
  TelerException,
  BadParametersException,
  UnprocessableRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  RateLimitException,
  InternalServerErrorException,
  NotImplementedException,
} from '@/exceptions';

describe('TelerException hierarchy', () => {
  describe('TelerException (base)', () => {
    it('sets name, message, code, and details', () => {
      const err = new TelerException('base error', { field: 'x' }, 500);
      expect(err.name).toBe('TelerException');
      expect(err.message).toBe('base error');
      expect(err.code).toBe(500);
      expect(err.details).toEqual({ field: 'x' });
    });

    it('is an instance of Error', () => {
      expect(new TelerException()).toBeInstanceOf(Error);
    });

    it('defaults code to 500 and message to empty string', () => {
      const err = new TelerException();
      expect(err.message).toBe('');
      expect(err.code).toBe(500);
      expect(err.details).toBeUndefined();
    });
  });

  describe('BadParametersException (400)', () => {
    it('has name BadParametersException and code 400', () => {
      const err = new BadParametersException('param_name', 'Invalid value');
      expect(err.name).toBe('BadParametersException');
      expect(err.code).toBe(400);
      expect(err.param).toBe('param_name');
      expect(err.message).toBe('Invalid value');
    });

    it('is an instance of TelerException and Error', () => {
      const err = new BadParametersException();
      expect(err).toBeInstanceOf(TelerException);
      expect(err).toBeInstanceOf(Error);
    });

    it('defaults to generic message when none provided', () => {
      const err = new BadParametersException();
      expect(err.message).toBe('Bad Parameter(s).');
    });

    it('carries the invalid cursor message from API', () => {
      const err = new BadParametersException(
        '',
        'The pagination cursor is invalid or has expired.'
      );
      expect(err.message).toBe('The pagination cursor is invalid or has expired.');
      expect(err.code).toBe(400);
    });
  });

  describe('UnprocessableRequestException (422)', () => {
    it('has name UnprocessableRequestException and code 422', () => {
      const err = new UnprocessableRequestException('Validation failed', [
        { loc: ['name'], msg: 'field required' },
      ]);
      expect(err.name).toBe('UnprocessableRequestException');
      expect(err.code).toBe(422);
      expect(err.message).toBe('Validation failed');
      expect(err.details).toEqual([{ loc: ['name'], msg: 'field required' }]);
    });

    it('is an instance of TelerException', () => {
      expect(new UnprocessableRequestException()).toBeInstanceOf(TelerException);
    });

    it('defaults to generic message', () => {
      expect(new UnprocessableRequestException().message).toBe('Unprocessable Request.');
    });
  });

  describe('UnauthorizedException (401)', () => {
    it('has name UnauthorizedException and code 401', () => {
      const err = new UnauthorizedException('Token expired.');
      expect(err.name).toBe('UnauthorizedException');
      expect(err.code).toBe(401);
      expect(err.message).toBe('Token expired.');
    });

    it('is an instance of TelerException', () => {
      expect(new UnauthorizedException()).toBeInstanceOf(TelerException);
    });
  });

  describe('ForbiddenException (403)', () => {
    it('has name ForbiddenException and code 403', () => {
      const err = new ForbiddenException('Invalid API Key.');
      expect(err.name).toBe('ForbiddenException');
      expect(err.code).toBe(403);
      expect(err.message).toBe('Invalid API Key.');
    });

    it('is an instance of TelerException', () => {
      expect(new ForbiddenException()).toBeInstanceOf(TelerException);
    });

    it('defaults to Forbidden message', () => {
      expect(new ForbiddenException().message).toBe('Forbidden.');
    });
  });

  describe('NotFoundException (404)', () => {
    it('has name NotFoundException and code 404', () => {
      const err = new NotFoundException('The requested secret was not found.');
      expect(err.name).toBe('NotFoundException');
      expect(err.code).toBe(404);
      expect(err.message).toBe('The requested secret was not found.');
    });

    it('is an instance of TelerException', () => {
      expect(new NotFoundException()).toBeInstanceOf(TelerException);
    });

    it('defaults to Not Found message', () => {
      expect(new NotFoundException().message).toBe('Not Found.');
    });
  });

  describe('ConflictException (409)', () => {
    it('has name ConflictException and code 409', () => {
      const err = new ConflictException(
        'This event cannot be redelivered in its current state.'
      );
      expect(err.name).toBe('ConflictException');
      expect(err.code).toBe(409);
    });

    it('is an instance of TelerException', () => {
      expect(new ConflictException()).toBeInstanceOf(TelerException);
    });

    it('defaults to Resource conflict message', () => {
      expect(new ConflictException().message).toBe('Resource conflict.');
    });
  });

  describe('RateLimitException (429)', () => {
    it('has name RateLimitException and code 429', () => {
      const err = new RateLimitException('Rate limit exceeded. Retry after 60s.');
      expect(err.name).toBe('RateLimitException');
      expect(err.code).toBe(429);
    });

    it('is an instance of TelerException', () => {
      expect(new RateLimitException()).toBeInstanceOf(TelerException);
    });
  });

  describe('InternalServerErrorException (500+)', () => {
    it('has name InternalServerErrorException and code 500', () => {
      const err = new InternalServerErrorException('An unexpected error occurred.');
      expect(err.name).toBe('InternalServerErrorException');
      expect(err.code).toBe(500);
    });

    it('accepts custom 5xx codes (e.g. 502, 503)', () => {
      const err502 = new InternalServerErrorException('Bad Gateway', undefined, 502);
      const err503 = new InternalServerErrorException('Service Unavailable', undefined, 503);
      expect(err502.code).toBe(502);
      expect(err503.code).toBe(503);
    });

    it('is an instance of TelerException', () => {
      expect(new InternalServerErrorException()).toBeInstanceOf(TelerException);
    });
  });

  describe('NotImplementedException (501)', () => {
    it('has name NotImplementedException and code 501', () => {
      const err = new NotImplementedException('Feature not available.', undefined, 501);
      expect(err.name).toBe('NotImplementedException');
      expect(err.code).toBe(501);
    });

    it('is an instance of TelerException', () => {
      expect(new NotImplementedException()).toBeInstanceOf(TelerException);
    });
  });

  describe('instanceof checks across the hierarchy', () => {
    const allExceptions = [
      new BadParametersException(),
      new UnprocessableRequestException(),
      new UnauthorizedException(),
      new ForbiddenException(),
      new NotFoundException(),
      new ConflictException(),
      new RateLimitException(),
      new InternalServerErrorException(),
      new NotImplementedException(),
    ];

    it.each(allExceptions)(
      '%s is an instance of TelerException and Error',
      (err) => {
        expect(err).toBeInstanceOf(TelerException);
        expect(err).toBeInstanceOf(Error);
      }
    );

    it('each exception name matches its constructor name', () => {
      allExceptions.forEach((err) => {
        expect(err.name).toBe(err.constructor.name);
      });
    });
  });

  describe('details field', () => {
    it('accepts object details', () => {
      const err = new NotFoundException('not found', { id: 'sk_123' });
      expect(err.details).toEqual({ id: 'sk_123' });
    });

    it('accepts array details (validation errors)', () => {
      const details = [{ loc: ['name'], msg: 'field required', type: 'value_error' }];
      const err = new UnprocessableRequestException('Validation failed', details);
      expect(err.details).toEqual(details);
    });

    it('accepts string details', () => {
      const err = new ConflictException('conflict', 'Resource is in use');
      expect(err.details).toBe('Resource is in use');
    });

    it('is undefined when not provided', () => {
      expect(new NotFoundException().details).toBeUndefined();
    });
  });
});
