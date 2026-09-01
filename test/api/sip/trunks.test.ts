import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { createTestClient } from '@test/support/client';
import { server } from '@test/msw/server';
import { TEST_CONFIG } from '@test/support/env';
import {
  sipTrunkListFixture,
  createSipTrunkPayloadFixture,
  createSipTrunkCredentialPayloadFixture,
  updateSipTrunkPayloadFixture,
  sipTrunkFiltersFixture,
} from '@test/support/fixtures/sip';
import { AuthenticationType, Transport } from '@/types/sip';
import {
  BadParametersException,
  UnprocessableRequestException,
  InternalServerErrorException,
} from '@/exceptions';

describe('SIP Trunks API (integration)', () => {
  it('creates a sip trunk through the real http stack', async () => {
    const client = createTestClient();
    const payload = createSipTrunkPayloadFixture();
    const result = await client.sip.trunks.create(payload);
    expect(result.id).toMatch(/^st_/);
    expect(result.name).toBe(payload.name);
    expect(result.secure).toBe(true);
    expect(result.transport).toBe(Transport.TLS);
    expect(result.is_active).toBe(true);
  });

  it('creates a credential-authenticated sip trunk', async () => {
    const client = createTestClient();
    const payload = createSipTrunkCredentialPayloadFixture();
    const result = await client.sip.trunks.create(payload);
    expect(result.id).toMatch(/^st_/);
  });

  it('handles transport tls when secure is passed as true', async () => {
    const client = createTestClient();
    const payload = createSipTrunkPayloadFixture({ secure: true });
    const result = await client.sip.trunks.create(payload);
    expect(result.secure).toBe(true);
    expect(result.transport).toBe(Transport.TLS);
  });

  it('handles transport tcp when secure is passed as false', async () => {
    const client = createTestClient();
    const payload = createSipTrunkPayloadFixture({ secure: false });
    const result = await client.sip.trunks.create(payload);
    expect(result.secure).toBe(false);
    expect(result.transport).toBe(Transport.TCP);
  });

  it('handles transport when passed explicitly in create', async () => {
    const client = createTestClient();
    const payload = createSipTrunkCredentialPayloadFixture({ transport: Transport.UDP });
    const result = await client.sip.trunks.create(payload);
    expect(result.transport).toBe(Transport.UDP);
  });

  it('rejects payload when both secure and transport are passed', async () => {
    const client = createTestClient();
    const payload = createSipTrunkPayloadFixture({ secure: true, transport: Transport.TLS });
    await expect(client.sip.trunks.create(payload)).rejects.toThrow(
      "Provide either 'secure' or 'transport', not both; 'transport' supersedes 'secure'"
    );
  });

  it('rejects UDP transport with IP authentication', async () => {
    const client = createTestClient();
    const payload = createSipTrunkPayloadFixture({
      transport: Transport.UDP,
      authentication_type: AuthenticationType.IP,
    });
    await expect(client.sip.trunks.create(payload)).rejects.toThrow(
      'UDP transport requires credential (digest) authentication. IP/ACL-based authentication over UDP is not permitted.'
    );
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
    const captured: {url: URL | null} = {url: null};
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/sip/trunks`, ({ request }) => {
        captured.url = new URL(request.url);
        return HttpResponse.json(sipTrunkListFixture());
      })
    );
    const client = createTestClient();
    await client.sip.trunks.list(sipTrunkFiltersFixture());
    expect(captured.url?.searchParams.get('search')).toBe('Primary');
    expect(captured.url?.searchParams.get('status')).toBe('active');
    expect(captured.url?.searchParams.get('limit')).toBe('10');
  });

  it('retrieves a sip trunk through the real http stack', async () => {
    const client = createTestClient();
    const trunk = await client.sip.trunks.retrieve('st_01J5ABCDEFGHJKMNPQRSTVWXYZ');
    expect(trunk.id).toBe('st_01J5ABCDEFGHJKMNPQRSTVWXYZ');
    expect(trunk.webhook_api_version).toBeDefined();
  });

  it('updates a sip trunk through the real http stack', async () => {
    const client = createTestClient();
    const payload = updateSipTrunkPayloadFixture();
    const updated = await client.sip.trunks.update('st_01J5ABCDEFGHJKMNPQRSTVWXYZ', payload);
    expect(updated.id).toBe('st_01J5ABCDEFGHJKMNPQRSTVWXYZ');
    expect(updated.name).toBe(payload.name);
  });

  it('updates transport on a sip trunk through the real http stack', async () => {
    const client = createTestClient();
    const payload = updateSipTrunkPayloadFixture({ transport: Transport.TCP });
    const updated = await client.sip.trunks.update('st_01J5ABCDEFGHJKMNPQRSTVWXYZ', payload);
    expect(updated.id).toBe('st_01J5ABCDEFGHJKMNPQRSTVWXYZ');
    expect(updated.transport).toBe(Transport.TCP);
    expect(updated.secure).toBe(false);
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
