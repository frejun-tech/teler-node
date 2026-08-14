import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { createTestClient } from '@test/support/client';
import { server } from '@test/msw/server';
import { TEST_CONFIG } from '@test/support/env';
import { secretListFixture } from '@test/support/fixtures/secrets';
import {
  BadParametersException,
  UnprocessableRequestException,
  InternalServerErrorException,
} from '@/exceptions';

describe('Secrets API (integration)', () => {
  it('creates a secret through the real http stack', async () => {
    const client = createTestClient();
    const result = await client.secrets.create({ name: 'My Production Secret' });
    expect(result.id).toMatch(/^sk_/);
    expect(result.name).toBe('My Production Secret');
    expect(result.voice_apps).toBeInstanceOf(Array);
    expect(result.sip_trunks).toBeInstanceOf(Array);
  });

  it('lists secrets', async () => {
    const client = createTestClient();
    const result = await client.secrets.list();
    expect(result.data).toBeInstanceOf(Array);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0].id).toMatch(/^sk_/);
    expect(result).toHaveProperty('has_more');
    expect(result).toHaveProperty('next_cursor');
    expect(result).toHaveProperty('previous_cursor');
  });

  it('sends query params correctly on list', async () => {
    let capturedUrl: URL | null = null;
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/secrets`, ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json(secretListFixture());
      })
    );
    const client = createTestClient();
    await client.secrets.list({
      search: 'prod_key',
      limit: 5,
      cursor_after: 'eyJpZCI6InNrXzEifQ',
    });
    expect(capturedUrl?.searchParams.get('search')).toBe('prod_key');
    expect(capturedUrl?.searchParams.get('limit')).toBe('5');
    expect(capturedUrl?.searchParams.get('cursor_after')).toBe('eyJpZCI6InNrXzEifQ');
  });

  it('retrieves a secret through the real http stack', async () => {
    const client = createTestClient();
    const secret = await client.secrets.retrieve('sk_01J5ABCDEFGHJKMNPQRSTVWXYZ');
    expect(secret.id).toBe('sk_01J5ABCDEFGHJKMNPQRSTVWXYZ');
    expect(secret.needs_rotation).toBe(false);
  });

  it('updates a secret through the real http stack', async () => {
    const client = createTestClient();
    const updated = await client.secrets.update('sk_01J5ABCDEFGHJKMNPQRSTVWXYZ', {
      name: 'Updated Name',
    });
    expect(updated.id).toBe('sk_01J5ABCDEFGHJKMNPQRSTVWXYZ');
    expect(updated.name).toBe('Updated Name');
  });

  it('rotates a secret through update', async () => {
    const client = createTestClient();
    const updated = await client.secrets.update('sk_01J5ABCDEFGHJKMNPQRSTVWXYZ', {
      rotate: true,
    });
    expect(updated.id).toBe('sk_01J5ABCDEFGHJKMNPQRSTVWXYZ');
  });

  it('deletes a secret through the real http stack', async () => {
    const client = createTestClient();
    const res = await client.secrets.delete('sk_01J5ABCDEFGHJKMNPQRSTVWXYZ');
    expect(res.success).toBe(true);
  });

  // --- Error Contract Tests ---

  it('propagates 400 Bad Parameters / Invalid Cursor error', async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/secrets`, () =>
        HttpResponse.json(
          { success: false, message: 'The pagination cursor is invalid or has expired.' },
          { status: 400 }
        )
      )
    );
    const client = createTestClient();
    await expect(client.secrets.list({ cursor_after: 'invalid' })).rejects.toThrow(
      BadParametersException
    );
  });

  it('propagates 403 Forbidden error when API key is missing or invalid', async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/secrets`, () =>
        HttpResponse.json(
          { success: false, message: 'Invalid API Key.' },
          { status: 403 }
        )
      )
    );
    const client = createTestClient();
    await expect(client.secrets.list()).rejects.toMatchObject({
      name: 'ForbiddenException',
      code: 403,
      message: 'Invalid API Key.',
    });
  });

  it('propagates 404 Not Found error with exact spec error message', async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/secrets/:id`, () =>
        HttpResponse.json(
          { success: false, message: 'The requested secret was not found.' },
          { status: 404 }
        )
      )
    );
    const client = createTestClient();
    await expect(client.secrets.retrieve('sk_missing')).rejects.toMatchObject({
      name: 'NotFoundException',
      code: 404,
      message: 'The requested secret was not found.',
    });
  });

  it('propagates 422 Unprocessable Request error on validation failure', async () => {
    server.use(
      http.post(`${TEST_CONFIG.baseUrl}/secrets`, () =>
        HttpResponse.json(
          {
            detail: [{ loc: ['body', 'name'], msg: 'field required', type: 'value_error.missing' }],
          },
          { status: 422 }
        )
      )
    );
    const client = createTestClient();
    await expect(client.secrets.create({ name: '' })).rejects.toThrow(
      UnprocessableRequestException
    );
  });

  it('propagates 500 Internal Server Error', async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/secrets/:id`, () =>
        HttpResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
      )
    );
    const client = createTestClient();
    await expect(client.secrets.retrieve('sk_broken')).rejects.toThrow(
      InternalServerErrorException
    );
  });
});
