import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { createTestClient } from '@test/support/client';
import { server } from '@test/msw/server';
import { TEST_CONFIG } from '@test/support/env';
import { virtualNumberListFixture } from '@test/support/fixtures/vns';
import {
  BadParametersException,
  UnprocessableRequestException,
  InternalServerErrorException,
} from '@/exceptions';

describe('Virtual Numbers API (integration)', () => {
  it('lists virtual numbers through the real http stack', async () => {
    const client = createTestClient();
    const result = await client.virtualNumbers.list();
    expect(result.data).toBeInstanceOf(Array);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0].id).toMatch(/^vn_/);
    expect(result).toHaveProperty('has_more');
    expect(result).toHaveProperty('next_cursor');
    expect(result).toHaveProperty('previous_cursor');
  });

  it('sends query params correctly on list', async () => {
    const captured: {url: URL | null} = {url: null};
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/virtual-numbers`, ({ request }) => {
        captured.url = new URL(request.url);
        return HttpResponse.json(virtualNumberListFixture());
      })
    );
    const client = createTestClient();
    await client.virtualNumbers.list({
      search: '800',
      location: ['US'],
      limit: 10,
    });
    expect(captured.url?.searchParams.get('search')).toBe('800');
    expect(captured.url?.searchParams.get('location')).toBe('US');
    expect(captured.url?.searchParams.get('limit')).toBe('10');
  });

  it('updates a virtual number through the real http stack', async () => {
    const client = createTestClient();
    const result = await client.virtualNumbers.update('vn_01J5ABCDEFGHJKMNPQRSTVWXYZ', {
      name: 'New VN Name',
    });
    expect(result.id).toBe('vn_01J5ABCDEFGHJKMNPQRSTVWXYZ');
    expect(result.name).toBe('New VN Name');
  });

  it('assigns virtual numbers to a voice app', async () => {
    const client = createTestClient();
    const result = await client.virtualNumbers.assign({
      vn_ids: ['vn_01J5ABCDEFGHJKMNPQRSTVWXYZ'],
      voice_app_id: 'va_01J5ABCDEFGHJKMNPQRSTVWXYZ',
    });
    expect(result.success).toBe(true);
  });

  it('assigns virtual numbers to a sip trunk', async () => {
    const client = createTestClient();
    const result = await client.virtualNumbers.assign({
      vn_ids: ['vn_01J5ABCDEFGHJKMNPQRSTVWXYZ'],
      sip_trunk_id: 'st_01J5ABCDEFGHJKMNPQRSTVWXYZ',
    });
    expect(result.success).toBe(true);
  });

  it('unassigns virtual numbers through the real http stack', async () => {
    const client = createTestClient();
    const result = await client.virtualNumbers.unassign({
      vn_ids: ['vn_01J5ABCDEFGHJKMNPQRSTVWXYZ'],
    });
    expect(result.success).toBe(true);
  });

  // --- Error Contract Tests ---

  it('propagates 400 Bad Parameters / Invalid Cursor error on list', async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/virtual-numbers`, () =>
        HttpResponse.json(
          { success: false, message: 'The pagination cursor is invalid or has expired.' },
          { status: 400 }
        )
      )
    );
    const client = createTestClient();
    await expect(
      client.virtualNumbers.list({ cursor_after: 'bad_cursor' })
    ).rejects.toThrow(BadParametersException);
  });

  it('propagates 403 Forbidden error', async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/virtual-numbers`, () =>
        HttpResponse.json(
          { success: false, message: 'Invalid API Key.' },
          { status: 403 }
        )
      )
    );
    const client = createTestClient();
    await expect(client.virtualNumbers.list()).rejects.toMatchObject({
      name: 'ForbiddenException',
      code: 403,
      message: 'Invalid API Key.',
    });
  });

  it('propagates 404 Not Found error on update', async () => {
    server.use(
      http.patch(`${TEST_CONFIG.baseUrl}/virtual-numbers/:id`, () =>
        HttpResponse.json(
          { success: false, message: 'The requested virtual number was not found.' },
          { status: 404 }
        )
      )
    );
    const client = createTestClient();
    await expect(
      client.virtualNumbers.update('vn_missing', { name: 'Test' })
    ).rejects.toMatchObject({
      name: 'NotFoundException',
      code: 404,
      message: 'The requested virtual number was not found.',
    });
  });

  it('propagates 422 Unprocessable Request error on assign validation failure', async () => {
    server.use(
      http.post(`${TEST_CONFIG.baseUrl}/virtual-numbers/assign`, () =>
        HttpResponse.json(
          { detail: [{ loc: ['body', 'vn_ids'], msg: 'At least one VN ID required' }] },
          { status: 422 }
        )
      )
    );
    const client = createTestClient();
    await expect(client.virtualNumbers.assign({})).rejects.toThrow(
      UnprocessableRequestException
    );
  });

  it('propagates 500 Internal Server Error', async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/virtual-numbers`, () =>
        HttpResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
      )
    );
    const client = createTestClient();
    await expect(client.virtualNumbers.list()).rejects.toThrow(
      InternalServerErrorException
    );
  });
});
