import axios from 'axios';
import { describe, it, expect, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@test/msw/server';
import { HttpResourceManager } from '@/resources/http';
import { TEST_CONFIG } from '@test/support/env';
import {
  BadParametersException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  GoneException,
  UnprocessableRequestException,
  RateLimitException,
  NotImplementedException,
  InternalServerErrorException
} from '@/exceptions';

function createHttp() {
  return new HttpResourceManager(TEST_CONFIG.apiKey, TEST_CONFIG.baseUrl);
}

describe('HttpResourceManager (integration)', () => {
  const errorCases: Array<{
    status: number;
    exception: new (...args: any[]) => Error;
    name: string;
  }> = [
    { status: 400, exception: BadParametersException, name: 'BadParametersException' },
    { status: 401, exception: UnauthorizedException, name: 'UnauthorizedException' },
    { status: 403, exception: ForbiddenException, name: 'ForbiddenException' },
    { status: 404, exception: NotFoundException, name: 'NotFoundException' },
    { status: 409, exception: ConflictException, name: 'ConflictException' },
    { status: 410, exception: GoneException, name: 'GoneException' },
    { status: 422, exception: UnprocessableRequestException, name: 'UnprocessableRequestException' },
    { status: 429, exception: RateLimitException, name: 'RateLimitException' },
    { status: 501, exception: NotImplementedException, name: 'NotImplementedException' },
    { status: 503, exception: InternalServerErrorException, name: 'InternalServerErrorException' },
  ];

  errorCases.forEach(({ status, name }) => {
    it(`throws ${name} for a ${status} response`, async () => {
      const response = status === 422
        ? { success: false, message: 'Validation Error', errors: [{ loc: ['body'], msg: 'required', type: 'value_error' }] }
        : { success: false, message: `error ${status}` };

      server.use(
        http.get(`${TEST_CONFIG.baseUrl}/test-endpoint`, () =>
          HttpResponse.json(response, { status })
        )
      );
      const httpClient = createHttp();

      await expect(httpClient.get('/test-endpoint')).rejects.toMatchObject({
        name,
        status,
        message: status === 422 ? 'Validation Error' : `error ${status}`,
      });
    });
  });

  it('throws a generic TelerException for an unmapped status code', async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/test-endpoint`, () =>
        HttpResponse.json({ message: 'teapot' }, { status: 418 })
      )
    );
    const httpClient = createHttp();

    await expect(httpClient.get('/test-endpoint')).rejects.toMatchObject({
      name: 'TelerException',
    });
  });

  it('throws NetworkException when the request fails with no response', async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/test-endpoint`, () => HttpResponse.error())
    );
    const httpClient = createHttp();

    await expect(httpClient.get('/test-endpoint')).rejects.toMatchObject({
      name: 'NetworkException',
      message: expect.any(String),
    });
  });

  it('surfaces the API response errorCode and type for error responses', async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/test-endpoint`, () =>
        HttpResponse.json(
          { success: false, message: 'Access denied', code: 'AUTH_INSUFFICIENT_PERMISSIONS', type: 'permission_error' },
          { status: 403 }
        )
      )
    );
    const httpClient = createHttp();

    await expect(httpClient.get('/test-endpoint')).rejects.toMatchObject({
      name: 'ForbiddenException',
      status: 403,
      errorCode: 'AUTH_INSUFFICIENT_PERMISSIONS',
      type: 'permission_error',
    });
  });

  it('derives param from 422 validation error loc and preserves full error response', async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/test-endpoint`, () =>
        HttpResponse.json(
          {
            success: false,
            message: 'Validation Error',
            errors: [
              {
                type: 'string_pattern_mismatch',
                loc: ['body', 'from_number'],
                msg: "String should match pattern '^\\+\\d{7,15}$'",
                input: '918065200756',
                ctx: { pattern: '^\\+\\d{7,15}$' },
              },
            ],
          },
          { status: 422 }
        )
      )
    );
    const httpClient = createHttp();

    await expect(httpClient.get('/test-endpoint')).rejects.toMatchObject({
      name: 'UnprocessableRequestException',
      status: 422,
      param: 'body.from_number',
      message: 'Validation Error',
    });

    try {
      await httpClient.get('/test-endpoint');
    } catch (err) {
      const e = err as any;
      expect(e.details?.errors[0]?.input).toBe('918065200756');
      expect(e.details?.errors[0]?.ctx).toEqual({ pattern: '^\\+\\d{7,15}$' });
    }
  });

  it('handles 422 business-rule validation errors without field-level details', async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/test-endpoint`, () =>
        HttpResponse.json(
          { success: false, message: 'Value error, cursor_after and cursor_before are mutually exclusive' },
          { status: 422 }
        )
      )
    );
    const httpClient = createHttp();

    await expect(httpClient.get('/test-endpoint')).rejects.toMatchObject({
      name: 'UnprocessableRequestException',
      status: 422,
      param: undefined,
      message: 'Value error, cursor_after and cursor_before are mutually exclusive',
    });
  });

  it('retries on 503 and eventually succeeds, reusing the request until it does', async () => {
    let attempts = 0;
    server.use(
      http.post(`${TEST_CONFIG.baseUrl}/test-endpoint`, () => {
        attempts++;
        if (attempts < 2) {
          return HttpResponse.json({ message: 'unavailable' }, { status: 503 });
        }
        return HttpResponse.json({ ok: true });
      })
    );
    const httpClient = createHttp();

    const result = await httpClient.post(
      '/test-endpoint',
      {},
      { retry: true, baseRetryDelayMs: 10 }
    );

    expect(attempts).toBe(2);
    expect(result).toEqual({ ok: true });
  });

  it('does not retry on a non-retryable status even when retry is true', async () => {
    let attempts = 0;
    server.use(
      http.post(`${TEST_CONFIG.baseUrl}/test-endpoint`, () => {
        attempts++;
        return HttpResponse.json({ message: 'bad request' }, { status: 400 });
      })
    );
    const httpClient = createHttp();

    await expect(
      httpClient.post('/test-endpoint', {}, { retry: true, baseRetryDelayMs: 10 })
    ).rejects.toThrow(BadParametersException);
    expect(attempts).toBe(1);
  });

  it('serializes array query params as repeated keys', async () => {
    const captured: {url: URL | null} = {url: null};
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/test-endpoint`, ({ request }) => {
        captured.url = new URL(request.url);
        return HttpResponse.json({ ok: true });
      })
    );
    const httpClient = createHttp();

    await httpClient.get('/test-endpoint', { status: ['active', 'paused'] });

    expect(captured.url?.searchParams.getAll('status')).toEqual(['active', 'paused']);
  });

  it('filters out null/undefined values from array query params', async () => {
    const captured: {url: URL | null} = {url: null};
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/test-endpoint`, ({ request }) => {
        captured.url = new URL(request.url);
        return HttpResponse.json({ ok: true });
      })
    );
    const httpClient = createHttp();

    await httpClient.get('/test-endpoint', { status: ['active', null, undefined, 'paused'] as any });

    expect(captured.url?.searchParams.getAll('status')).toEqual(['active', 'paused']);
  });

  it('omits undefined scalar query params entirely', async () => {
    const captured: {url: URL | null} = {url: null};
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/test-endpoint`, ({ request }) => {
        captured.url = new URL(request.url);
        return HttpResponse.json({ ok: true });
      })
    );
    const httpClient = createHttp();

    await httpClient.get('/test-endpoint', { callId: undefined, limit: 10 } as any);

    expect(captured.url?.searchParams.has('callId')).toBe(false);
    expect(captured.url?.searchParams.get('limit')).toBe('10');
  });

  it('sends a patch request with a body', async () => {
    let capturedBody: unknown = null;
    server.use(
      http.patch(`${TEST_CONFIG.baseUrl}/test-endpoint`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ updated: true });
      })
    );
    const httpClient = createHttp();

    const result = await httpClient.patch('/test-endpoint', { name: 'updated-name' });

    expect(capturedBody).toEqual({ name: 'updated-name' });
    expect(result).toEqual({ updated: true });
  });

  it('sends a delete request', async () => {
    server.use(
      http.delete(`${TEST_CONFIG.baseUrl}/test-endpoint`, () =>
        HttpResponse.json({ deleted: true })
      )
    );
    const httpClient = createHttp();

    const result = await httpClient.delete('/test-endpoint');

    expect(result).toEqual({ deleted: true });
  });

  it('converts an outgoing camelCase request body to snake_case', async () => {
    let capturedBody: unknown = null;
    server.use(
      http.post(`${TEST_CONFIG.baseUrl}/test-endpoint`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ ok: true });
      })
    );
    const httpClient = createHttp();

    await httpClient.post('/test-endpoint', {
      fromNumber: '+18005550100',
      webhookApiVersion: '2026-06-01',
    });

    expect(capturedBody).toEqual({
      from_number: '+18005550100',
      webhook_api_version: '2026-06-01',
    });
  });

  it('converts an incoming snake_case response body to camelCase', async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/test-endpoint`, () =>
        HttpResponse.json({
          from_number: '+18005550100',
          webhook_api_version: '2026-06-01',
        })
      )
    );
    const httpClient = createHttp();

    const result = await httpClient.get('/test-endpoint');

    expect(result).toEqual({
      fromNumber: '+18005550100',
      webhookApiVersion: '2026-06-01',
    });
  });

  it('attaches the x-api-key header on every request', async () => {
    let capturedKey: string | null = null;
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/test-endpoint`, ({ request }) => {
        capturedKey = request.headers.get('x-api-key');
        return HttpResponse.json({ ok: true });
      })
    );
    const httpClient = createHttp();

    await httpClient.get('/test-endpoint');

    expect(capturedKey).toBe(TEST_CONFIG.apiKey);
  });

  it('throws a generic TelerException when the error is not an axios error', async () => {
    const isAxiosErrorSpy = vi.spyOn(axios, 'isAxiosError').mockReturnValue(false);

    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/test-endpoint`, () =>
        HttpResponse.json({ message: 'irrelevant' }, { status: 400 })
      )
    );

    const httpClient = createHttp();

    await expect(httpClient.get('/test-endpoint')).rejects.toMatchObject({
      name: 'TelerException',
      message: 'An unknown error occurred while calling the API.',
    });

    isAxiosErrorSpy.mockRestore();
  });

  it('GET retries on 503 by default', async () => {
    let attempts = 0;
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/test-endpoint`, () => {
        attempts++;
        if (attempts < 2) {
          return HttpResponse.json({ message: 'unavailable' }, { status: 503 });
        }
        return HttpResponse.json({ ok: true });
      })
    );
    const httpClient = createHttp();

    const result = await httpClient.get('/test-endpoint');

    expect(attempts).toBe(2);
    expect(result).toEqual({ ok: true });
  });

  it('GET can disable retry with retry option', async () => {
    let attempts = 0;
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/test-endpoint`, () => {
        attempts++;
        return HttpResponse.json({ message: 'unavailable' }, { status: 503 });
      })
    );
    const httpClient = createHttp();

    await expect(
      httpClient.get('/test-endpoint', undefined, { retry: false })
    ).rejects.toThrow(InternalServerErrorException);
    expect(attempts).toBe(1);
  });

  it('GET can override baseRetryDelayMs', async () => {
    let attempts = 0;
    const startTime = Date.now();
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/test-endpoint`, () => {
        attempts++;
        if (attempts < 2) {
          return HttpResponse.json({ message: 'unavailable' }, { status: 503 });
        }
        return HttpResponse.json({ ok: true });
      })
    );
    const httpClient = createHttp();

    const result = await httpClient.get('/test-endpoint', undefined, { baseRetryDelayMs: 10 });
    const duration = Date.now() - startTime;

    expect(attempts).toBe(2);
    expect(result).toEqual({ ok: true });
    expect(duration).toBeLessThan(100);
  });

  it('applies full jitter: delay = random(0, min(cap, base * 2^attempt))', async () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const startTime = Date.now();
    let callCount = 0;

    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/test-endpoint`, () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.json({ message: 'unavailable' }, { status: 503 });
        }
        return HttpResponse.json({ ok: true });
      })
    );
    const httpClient = createHttp();

    await httpClient.get('/test-endpoint', undefined, { baseRetryDelayMs: 100, maxRetryDelayMs: 2000 });
    const elapsed = Date.now() - startTime;

    randomSpy.mockRestore();

    expect(callCount).toBe(2);
    expect(elapsed).toBeGreaterThanOrEqual(40);
    expect(elapsed).toBeLessThan(150);
  });

  it('caps the retry delay at maxRetryDelayMs', async () => {
    let attempts = 0;
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/test-endpoint`, () => {
        attempts++;
        if (attempts < 2) {
          return HttpResponse.json({ message: 'unavailable' }, { status: 503 });
        }
        return HttpResponse.json({ ok: true });
      })
    );
    const httpClient = createHttp();

    const startTime = Date.now();
    await httpClient.get('/test-endpoint', undefined, { baseRetryDelayMs: 100000, maxRetryDelayMs: 50 });
    const duration = Date.now() - startTime;

    expect(attempts).toBe(2);
    expect(duration).toBeLessThan(200);
  });

  it('DELETE retries on 503 by default', async () => {
    let attempts = 0;
    server.use(
      http.delete(`${TEST_CONFIG.baseUrl}/test-endpoint`, () => {
        attempts++;
        if (attempts < 2) {
          return HttpResponse.json({ message: 'unavailable' }, { status: 503 });
        }
        return HttpResponse.json({ ok: true });
      })
    );
    const httpClient = createHttp();

    const result = await httpClient.delete('/test-endpoint');

    expect(attempts).toBe(2);
    expect(result).toEqual({ ok: true });
  });

  it('PATCH does not retry by default', async () => {
    let attempts = 0;
    server.use(
      http.patch(`${TEST_CONFIG.baseUrl}/test-endpoint`, () => {
        attempts++;
        return HttpResponse.json({ message: 'unavailable' }, { status: 503 });
      })
    );
    const httpClient = createHttp();

    await expect(
      httpClient.patch('/test-endpoint', { data: 'value' })
    ).rejects.toThrow(InternalServerErrorException);
    expect(attempts).toBe(1);
  });

  it('PATCH/DELETE retry can be overridden via caller-supplied options', async () => {
    let patchAttempts = 0;
    let deleteAttempts = 0;
    server.use(
      http.patch(`${TEST_CONFIG.baseUrl}/test-patch`, () => {
        patchAttempts++;
        if (patchAttempts < 2) {
          return HttpResponse.json({ message: 'unavailable' }, { status: 503 });
        }
        return HttpResponse.json({ ok: true });
      }),
      http.delete(`${TEST_CONFIG.baseUrl}/test-delete`, () => {
        deleteAttempts++;
        return HttpResponse.json({ message: 'unavailable' }, { status: 503 });
      })
    );
    const httpClient = createHttp();

    const patchResult = await httpClient.patch('/test-patch', { data: 'value' }, { retry: true });
    expect(patchAttempts).toBe(2);
    expect(patchResult).toEqual({ ok: true });

    await expect(
      httpClient.delete('/test-delete', { retry: false })
    ).rejects.toThrow(InternalServerErrorException);
    expect(deleteAttempts).toBe(1);
  });

  it('retries on 429 (rate limit)', async () => {
    let attempts = 0;
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/test-endpoint`, () => {
        attempts++;
        if (attempts < 2) {
          return HttpResponse.json({ message: 'rate limited' }, { status: 429 });
        }
        return HttpResponse.json({ ok: true });
      })
    );
    const httpClient = createHttp();

    const result = await httpClient.get('/test-endpoint', undefined, { baseRetryDelayMs: 10 });

    expect(attempts).toBe(2);
    expect(result).toEqual({ ok: true });
  });

  it('respects Retry-After header (delay in seconds) on 429', async () => {
    let attempts = 0;
    const startTime = Date.now();
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/test-endpoint`, () => {
        attempts++;
        if (attempts < 2) {
          return HttpResponse.json({ message: 'rate limited' }, {
            status: 429,
            headers: { 'Retry-After': '1' }
          });
        }
        return HttpResponse.json({ ok: true });
      })
    );
    const httpClient = createHttp();

    const result = await httpClient.get('/test-endpoint', undefined, { baseRetryDelayMs: 10 });
    const elapsed = Date.now() - startTime;

    expect(attempts).toBe(2);
    expect(result).toEqual({ ok: true });
    expect(elapsed).toBeGreaterThanOrEqual(900);
  });

  it('respects Retry-After header (delay in seconds) when header is parsed', async () => {
    let attempts = 0;
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/test-endpoint`, () => {
        attempts++;
        if (attempts < 2) {
          return HttpResponse.json({ message: 'rate limited' }, {
            status: 429,
            headers: { 'retry-after': '0' }
          });
        }
        return HttpResponse.json({ ok: true });
      })
    );
    const httpClient = createHttp();

    const result = await httpClient.get('/test-endpoint', undefined, { baseRetryDelayMs: 10 });

    expect(attempts).toBe(2);
    expect(result).toEqual({ ok: true });
  });

  it('falls back to exponential backoff when Retry-After is unparseable', async () => {
    let attempts = 0;
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/test-endpoint`, () => {
        attempts++;
        if (attempts < 2) {
          return HttpResponse.json({ message: 'rate limited' }, {
            status: 429,
            headers: { 'Retry-After': 'invalid-value' }
          });
        }
        return HttpResponse.json({ ok: true });
      })
    );
    const httpClient = createHttp();

    const result = await httpClient.get('/test-endpoint', undefined, { baseRetryDelayMs: 10 });

    expect(attempts).toBe(2);
    expect(result).toEqual({ ok: true });
  });

  it('caps Retry-After delay at maxRetryDelayMs', async () => {
    let attempts = 0;
    const startTime = Date.now();
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/test-endpoint`, () => {
        attempts++;
        if (attempts < 2) {
          return HttpResponse.json({ message: 'rate limited' }, {
            status: 429,
            headers: { 'Retry-After': '100' }
          });
        }
        return HttpResponse.json({ ok: true });
      })
    );
    const httpClient = createHttp();

    const result = await httpClient.get('/test-endpoint', undefined, { maxRetryDelayMs: 50 });
    const elapsed = Date.now() - startTime;

    expect(attempts).toBe(2);
    expect(result).toEqual({ ok: true });
    expect(elapsed).toBeLessThan(200);
  });
});