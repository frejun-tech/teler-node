import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { createTestClient } from '@test/support/client';
import { server } from '@test/msw/server';
import { TEST_CONFIG } from '@test/support/env';
import { sipTrunkListFixture } from '@test/support/fixtures/sip';
import { AuthenticationType } from '@/types/sip';
import { Status } from '@/types/core';
import {
  BadParametersException,
  UnprocessableRequestException,
  InternalServerErrorException,
} from '@/exceptions';

describe('SIP Trunks API (integration)', () => {
  it('creates a sip trunk through the real http stack', async () => {
    const client = createTestClient();
    const result = await client.sip.trunks.create({
      name: 'Primary Trunk',
      domain_name: 'trunk1.pstn.teler.io',
      authentication_type: AuthenticationType.IP,
      inbound_route: {
        name: 'Primary Route',
        sip_url: 'sip:primary@example.com',
      },
    });
    expect(result.id).toMatch(/^st_/);
    expect(result.name).toBe('Primary Trunk');
    expect(result.secure).toBe(true);
    expect(result.is_active).toBe(true);
  });

  it('creates a credential-authenticated sip trunk', async () => {
    const client = createTestClient();
    const result = await client.sip.trunks.create({
      name: 'Credential Trunk',
      domain_name: 'trunk2.pstn.teler.io',
      authentication_type: AuthenticationType.CREDENTIAL,
      auth_credential: { username: 'sipuser1', password: 'password123' },
      inbound_route: {
        name: 'Credential Route',
        sip_url: 'sip:cred@example.com',
      },
    });
    expect(result.id).toMatch(/^st_/);
  });

  it('lists sip trunks', async () => {
    const client = createTestClient();
    const result = await client.sip.trunks.list();
    expect(result.data).toBeInstanceOf(Array);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0].id).toMatch(/^st_/);
    expect(result).toHaveProperty('has_more');
    expect(result).toHaveProperty('next_cursor');
    expect(result).toHaveProperty('previous_cursor');
  });

  it('sends query params correctly on list', async () => {
    let capturedUrl: URL | null = null;
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/sip/trunks`, ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json(sipTrunkListFixture());
      })
    );
    const client = createTestClient();
    await client.sip.trunks.list({
      search: 'Primary',
      status: [Status.ACTIVE],
      limit: 10,
    });
    expect(capturedUrl?.searchParams.get('search')).toBe('Primary');
    expect(capturedUrl?.searchParams.get('status')).toBe('active');
    expect(capturedUrl?.searchParams.get('limit')).toBe('10');
  });

  it('retrieves a sip trunk through the real http stack', async () => {
    const client = createTestClient();
    const trunk = await client.sip.trunks.retrieve('st_01J5ABCDEFGHJKMNPQRSTVWXYZ');
    expect(trunk.id).toBe('st_01J5ABCDEFGHJKMNPQRSTVWXYZ');
    expect(trunk.webhook_api_version).toBeDefined();
  });

  it('updates a sip trunk through the real http stack', async () => {
    const client = createTestClient();
    const updated = await client.sip.trunks.update('st_01J5ABCDEFGHJKMNPQRSTVWXYZ', {
      name: 'Updated Trunk Name',
      channel_limit: 200,
    });
    expect(updated.id).toBe('st_01J5ABCDEFGHJKMNPQRSTVWXYZ');
    expect(updated.name).toBe('Updated Trunk Name');
  });

  it('deletes a sip trunk through the real http stack', async () => {
    const client = createTestClient();
    const res = await client.sip.trunks.delete('st_01J5ABCDEFGHJKMNPQRSTVWXYZ');
    expect(res.success).toBe(true);
  });

  it('lists virtual numbers assigned to a sip trunk', async () => {
    const client = createTestClient();
    const result = await client.sip.trunks.listVirtualNumbers('st_01J5ABCDEFGHJKMNPQRSTVWXYZ');
    expect(result.data).toBeInstanceOf(Array);
    expect(result).toHaveProperty('has_more');
  });

  // --- Error Contract Tests ---

  it('propagates 400 Bad Parameters / Invalid Cursor error on list', async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/sip/trunks`, () =>
        HttpResponse.json(
          { success: false, message: 'The pagination cursor is invalid or has expired.' },
          { status: 400 }
        )
      )
    );
    const client = createTestClient();
    await expect(
      client.sip.trunks.list({ cursor_after: 'bad_cursor' })
    ).rejects.toThrow(BadParametersException);
  });

  it('propagates 403 Forbidden error when API key is missing or invalid', async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/sip/trunks`, () =>
        HttpResponse.json(
          { success: false, message: 'Invalid API Key.' },
          { status: 403 }
        )
      )
    );
    const client = createTestClient();
    await expect(client.sip.trunks.list()).rejects.toMatchObject({
      name: 'ForbiddenException',
      code: 403,
      message: 'Invalid API Key.',
    });
  });

  it('propagates 404 Not Found error with exact spec message', async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/sip/trunks/:id`, () =>
        HttpResponse.json(
          { success: false, message: 'The requested SIP trunk was not found.' },
          { status: 404 }
        )
      )
    );
    const client = createTestClient();
    await expect(client.sip.trunks.retrieve('st_missing')).rejects.toMatchObject({
      name: 'NotFoundException',
      code: 404,
      message: 'The requested SIP trunk was not found.',
    });
  });

  it('propagates 422 Unprocessable Request error on invalid create payload', async () => {
    server.use(
      http.post(`${TEST_CONFIG.baseUrl}/sip/trunks`, () =>
        HttpResponse.json(
          { detail: [{ loc: ['body', 'domain_name'], msg: 'field required' }] },
          { status: 422 }
        )
      )
    );
    const client = createTestClient();
    await expect(
      client.sip.trunks.create({
        name: 'Incomplete Trunk',
        authentication_type: AuthenticationType.IP,
        domain_name: '',
        inbound_route: { name: '', sip_url: '' },
      })
    ).rejects.toThrow(UnprocessableRequestException);
  });

  it('propagates 500 Internal Server Error', async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/sip/trunks/:id`, () =>
        HttpResponse.json({ success: false, message: 'Internal error' }, { status: 500 })
      )
    );
    const client = createTestClient();
    await expect(client.sip.trunks.retrieve('st_broken')).rejects.toThrow(
      InternalServerErrorException
    );
  });
});
