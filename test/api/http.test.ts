import axios from 'axios';
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@test/msw/server';
import { HttpResourceManager } from '@/resources/http';
import { TEST_CONFIG } from '@test/support/env';
import {
  BadParametersException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
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
    { status: 409, exception: ConflictException, name: 'ConflictException' },
    { status: 422, exception: UnprocessableRequestException, name: 'UnprocessableRequestException' },
    { status: 429, exception: RateLimitException, name: 'RateLimitException' },
    { status: 501, exception: NotImplementedException, name: 'NotImplementedException' },
    { status: 503, exception: InternalServerErrorException, name: 'InternalServerErrorException' },
  ];

  errorCases.forEach(({ status, name }) => {
    it(`throws ${name} for a ${status} response`, async () => {
      server.use(
        http.get(`${TEST_CONFIG.baseUrl}/test-endpoint`, () =>
          HttpResponse.json({ message: `error ${status}`, errors: ['detail'] }, { status })
        )
      );
      const httpClient = createHttp();

      await expect(httpClient.get('/test-endpoint')).rejects.toMatchObject({
        name,
        code: status,
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

  it('serializes array query params as repeated keys', async () => {
    let capturedUrl: URL | null = null;
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/test-endpoint`, ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json({ ok: true });
      })
    );
    const httpClient = createHttp();

    await httpClient.get('/test-endpoint', { status: ['active', 'paused'] });

    expect(capturedUrl?.searchParams.getAll('status')).toEqual(['active', 'paused']);
  });

  it('filters out null/undefined values from array query params', async () => {
    let capturedUrl: URL | null = null;
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/test-endpoint`, ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json({ ok: true });
      })
    );
    const httpClient = createHttp();

    await httpClient.get('/test-endpoint', { status: ['active', null, undefined, 'paused'] as any });

    expect(capturedUrl?.searchParams.getAll('status')).toEqual(['active', 'paused']);
  });

  it('omits undefined scalar query params entirely', async () => {
    let capturedUrl: URL | null = null;
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/test-endpoint`, ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json({ ok: true });
      })
    );
    const httpClient = createHttp();

    await httpClient.get('/test-endpoint', { call_id: undefined, limit: 10 } as any);

    expect(capturedUrl?.searchParams.has('call_id')).toBe(false);
    expect(capturedUrl?.searchParams.get('limit')).toBe('10');
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
});