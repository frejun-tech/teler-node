import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { createTestClient } from '@test/support/client';
import { server } from '@test/msw/server';
import { TEST_CONFIG } from '@test/support/env';
import { ipAclListFixture } from '@test/support/fixtures/sip';
import {
  BadParametersException,
  UnprocessableRequestException,
  InternalServerErrorException,
} from '@/exceptions';

describe('SIP IP ACLs API (integration)', () => {
  it('creates an IP ACL through the real http stack', async () => {
    const client = createTestClient();
    const result = await client.sip.ipAcls.create({
      name: 'Office ACL',
      addresses: [{ address: '192.168.1.0/24', description: 'Office HQ' }],
    });
    expect(result.id).toBeDefined();
    expect(result.name).toBe('Office ACL');
    expect(result.addresses).toBeInstanceOf(Array);
    expect(result.trunk_count).toBeGreaterThanOrEqual(0);
  });

  it('lists IP ACLs', async () => {
    const client = createTestClient();
    const result = await client.sip.ipAcls.list();
    expect(result.data).toBeInstanceOf(Array);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result).toHaveProperty('has_more');
    expect(result).toHaveProperty('next_cursor');
    expect(result).toHaveProperty('previous_cursor');
  });

  it('sends query params correctly on list', async () => {
    let capturedUrl: URL | null = null;
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/sip/ip-acls`, ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json(ipAclListFixture());
      })
    );
    const client = createTestClient();
    await client.sip.ipAcls.list({ search: 'Office', limit: 10 });
    expect(capturedUrl?.searchParams.get('search')).toBe('Office');
    expect(capturedUrl?.searchParams.get('limit')).toBe('10');
  });

  it('retrieves an IP ACL through the real http stack', async () => {
    const client = createTestClient();
    const acl = await client.sip.ipAcls.retrieve('acl_01J5ABCDEFGHJKMNPQRSTVWXYZ');
    expect(acl.id).toBe('acl_01J5ABCDEFGHJKMNPQRSTVWXYZ');
    expect(acl.addresses).toBeInstanceOf(Array);
  });

  it('updates an IP ACL through the real http stack', async () => {
    const client = createTestClient();
    const updated = await client.sip.ipAcls.update('acl_01J5ABCDEFGHJKMNPQRSTVWXYZ', {
      name: 'Updated ACL Name',
    });
    expect(updated.id).toBe('acl_01J5ABCDEFGHJKMNPQRSTVWXYZ');
    expect(updated.name).toBe('Updated ACL Name');
  });

  it('deletes an IP ACL through the real http stack', async () => {
    const client = createTestClient();
    const res = await client.sip.ipAcls.delete('acl_01J5ABCDEFGHJKMNPQRSTVWXYZ');
    expect(res.success).toBe(true);
  });

  // --- Error Contract Tests ---

  it('propagates 400 Bad Parameters / Invalid Cursor error on list', async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/sip/ip-acls`, () =>
        HttpResponse.json(
          { success: false, message: 'The pagination cursor is invalid or has expired.' },
          { status: 400 }
        )
      )
    );
    const client = createTestClient();
    await expect(
      client.sip.ipAcls.list({ cursor_after: 'bad_cursor' })
    ).rejects.toThrow(BadParametersException);
  });

  it('propagates 403 Forbidden error when API key is missing or invalid', async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/sip/ip-acls`, () =>
        HttpResponse.json(
          { success: false, message: 'Invalid API Key.' },
          { status: 403 }
        )
      )
    );
    const client = createTestClient();
    await expect(client.sip.ipAcls.list()).rejects.toMatchObject({
      name: 'ForbiddenException',
      code: 403,
      message: 'Invalid API Key.',
    });
  });

  it('propagates 404 Not Found error with exact spec message', async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/sip/ip-acls/:id`, () =>
        HttpResponse.json(
          { success: false, message: 'The requested IP ACL was not found.' },
          { status: 404 }
        )
      )
    );
    const client = createTestClient();
    await expect(client.sip.ipAcls.retrieve('acl_missing')).rejects.toMatchObject({
      name: 'NotFoundException',
      code: 404,
      message: 'The requested IP ACL was not found.',
    });
  });

  it('propagates 409 Conflict error when deleting an ACL that is in use by a trunk', async () => {
    server.use(
      http.delete(`${TEST_CONFIG.baseUrl}/sip/ip-acls/:id`, () =>
        HttpResponse.json(
          {
            success: false,
            message: 'Cannot delete IP ACL while it is referenced by active SIP trunks.',
          },
          { status: 409 }
        )
      )
    );
    const client = createTestClient();
    await expect(client.sip.ipAcls.delete('acl_in_use')).rejects.toMatchObject({
      name: 'ConflictException',
      code: 409,
    });
  });

  it('propagates 422 Unprocessable Request error on invalid IP CIDR syntax', async () => {
    server.use(
      http.post(`${TEST_CONFIG.baseUrl}/sip/ip-acls`, () =>
        HttpResponse.json(
          { detail: [{ loc: ['body', 'addresses', 0, 'address'], msg: 'invalid CIDR format' }] },
          { status: 422 }
        )
      )
    );
    const client = createTestClient();
    await expect(
      client.sip.ipAcls.create({
        name: 'Bad ACL',
        addresses: [{ address: 'not-an-ip' }],
      })
    ).rejects.toThrow(UnprocessableRequestException);
  });

  it('propagates 500 Internal Server Error', async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/sip/ip-acls/:id`, () =>
        HttpResponse.json({ success: false, message: 'Internal error' }, { status: 500 })
      )
    );
    const client = createTestClient();
    await expect(client.sip.ipAcls.retrieve('acl_broken')).rejects.toThrow(
      InternalServerErrorException
    );
  });
});
