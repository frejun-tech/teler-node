import { describe, it, expect, beforeEach } from 'vitest';
import { IpAclResourceManager } from '@/resources/sip/ipAcls';
import { createMockHttp, asHttp, type MockHttp } from '@test/support/mock-http';
import {
  ipAclFixture,
  ipAclListFixture,
  createIpAclPayloadFixture,
  updateIpAclPayloadFixture,
  ipAclFiltersFixture,
} from '@test/support/fixtures/sip';

describe('IpAclResourceManager (unit)', () => {
  let http: MockHttp;
  let ipAcls: IpAclResourceManager;

  beforeEach(() => {
    http = createMockHttp();
    ipAcls = new IpAclResourceManager(asHttp(http));
  });

  describe('create', () => {
    it('posts to /sip/ip-acls with the payload and returns the created ACL', async () => {
      const payload = createIpAclPayloadFixture();
      const fixture = ipAclFixture({ name: payload.name });
      http.post.mockResolvedValue(fixture);

      const result = await ipAcls.create(payload);

      expect(http.post).toHaveBeenCalledWith('/sip/ip-acls', payload);
      expect(result).toEqual(fixture);
    });

    it('creates an ACL with multiple addresses', async () => {
      const payload = createIpAclPayloadFixture({
        addresses: [
          { address: '10.0.0.0/8', description: 'Internal' },
          { address: '172.16.0.0/12', description: 'VPN' },
          { address: '192.168.0.0/16', description: 'Office' },
        ],
      });
      http.post.mockResolvedValue(ipAclFixture());

      await ipAcls.create(payload);

      expect(http.post).toHaveBeenCalledWith('/sip/ip-acls', payload);
    });

    it('returns the response object reference unchanged', async () => {
      const fixture = ipAclFixture();
      http.post.mockResolvedValue(fixture);

      const result = await ipAcls.create(createIpAclPayloadFixture());

      expect(result).toBe(fixture);
    });

    it('propagates errors from the http layer', async () => {
      http.post.mockRejectedValue(new Error('Network error'));

      await expect(ipAcls.create(createIpAclPayloadFixture())).rejects.toThrow('Network error');
    });
  });

  describe('list', () => {
    it('gets /sip/ip-acls with undefined when called without filters', async () => {
      http.get.mockResolvedValue(ipAclListFixture());

      await ipAcls.list();

      expect(http.get).toHaveBeenCalledWith('/sip/ip-acls', undefined);
    });

    it('forwards all filter fields to the http layer', async () => {
      http.get.mockResolvedValue(ipAclListFixture());
      const filters = ipAclFiltersFixture();

      await ipAcls.list(filters);

      expect(http.get).toHaveBeenCalledWith('/sip/ip-acls', filters);
    });

    it('forwards search-only filter correctly', async () => {
      http.get.mockResolvedValue(ipAclListFixture());

      await ipAcls.list({ search: 'VPN' });

      expect(http.get).toHaveBeenCalledWith('/sip/ip-acls', { search: 'VPN' });
    });

    it('returns the response object reference unchanged', async () => {
      const response = ipAclListFixture();
      http.get.mockResolvedValue(response);

      const result = await ipAcls.list();

      expect(result).toBe(response);
    });

    it('returns a page with data, cursors, and hasMore', async () => {
      http.get.mockResolvedValue(ipAclListFixture());

      const result = await ipAcls.list();

      expect(result.data).toBeInstanceOf(Array);
      expect(result).toHaveProperty('hasMore');
      expect(result).toHaveProperty('nextCursor');
      expect(result).toHaveProperty('previousCursor');
    });

    it('propagates errors from the http layer', async () => {
      http.get.mockRejectedValue(new Error('Network error'));

      await expect(ipAcls.list()).rejects.toThrow('Network error');
    });
  });

  describe('retrieve', () => {
    it('gets the correct path for a given ACL id', async () => {
      const fixture = ipAclFixture();
      http.get.mockResolvedValue(fixture);

      const result = await ipAcls.retrieve(fixture.id);

      expect(http.get).toHaveBeenCalledWith(`/sip/ip-acls/${fixture.id}`);
      expect(result).toEqual(fixture);
    });

    it('returns an ACL with addresses and trunkCount', async () => {
      const fixture = ipAclFixture();
      http.get.mockResolvedValue(fixture);

      const result = await ipAcls.retrieve(fixture.id);

      expect(result.addresses).toBeInstanceOf(Array);
      expect(result.addresses.length).toBeGreaterThan(0);
      expect(result).toHaveProperty('trunkCount');
    });

    it('returns the response object reference unchanged', async () => {
      const fixture = ipAclFixture();
      http.get.mockResolvedValue(fixture);

      const result = await ipAcls.retrieve(fixture.id);

      expect(result).toBe(fixture);
    });

    it('propagates errors from the http layer', async () => {
      http.get.mockRejectedValue(new Error('Network error'));

      await expect(ipAcls.retrieve('acl_01J5ABCDEFGHJKMNPQRSTVWXYZ')).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('update', () => {
    it('patches the correct path with the update payload', async () => {
      const payload = updateIpAclPayloadFixture();
      const fixture = ipAclFixture({ name: payload.name ?? undefined });
      http.patch.mockResolvedValue(fixture);

      const result = await ipAcls.update('acl_01J5ABCDEFGHJKMNPQRSTVWXYZ', payload);

      expect(http.patch).toHaveBeenCalledWith(
        '/sip/ip-acls/acl_01J5ABCDEFGHJKMNPQRSTVWXYZ',
        payload
      );
      expect(result).toEqual(fixture);
    });

    it('updates only the name without changing addresses', async () => {
      const payload = updateIpAclPayloadFixture({ addresses: undefined });
      http.patch.mockResolvedValue(ipAclFixture());

      await ipAcls.update('acl_01J5ABCDEFGHJKMNPQRSTVWXYZ', payload);

      expect(http.patch).toHaveBeenCalledWith(
        '/sip/ip-acls/acl_01J5ABCDEFGHJKMNPQRSTVWXYZ',
        payload
      );
    });

    it('returns the response object reference unchanged', async () => {
      const fixture = ipAclFixture();
      http.patch.mockResolvedValue(fixture);

      const result = await ipAcls.update(
        'acl_01J5ABCDEFGHJKMNPQRSTVWXYZ',
        updateIpAclPayloadFixture()
      );

      expect(result).toBe(fixture);
    });

    it('propagates errors from the http layer', async () => {
      http.patch.mockRejectedValue(new Error('Network error'));

      await expect(
        ipAcls.update('acl_01J5ABCDEFGHJKMNPQRSTVWXYZ', updateIpAclPayloadFixture())
      ).rejects.toThrow('Network error');
    });
  });

  describe('delete', () => {
    it('deletes the correct path for a given ACL id', async () => {
      const response = { success: true, message: 'IP ACL deleted successfully.' };
      http.delete.mockResolvedValue(response);

      const result = await ipAcls.delete('acl_01J5ABCDEFGHJKMNPQRSTVWXYZ');

      expect(http.delete).toHaveBeenCalledWith('/sip/ip-acls/acl_01J5ABCDEFGHJKMNPQRSTVWXYZ');
      expect(result).toEqual(response);
    });

    it('returns the response object reference unchanged', async () => {
      const response = { success: true, message: 'Deleted.' };
      http.delete.mockResolvedValue(response);

      const result = await ipAcls.delete('acl_01J5ABCDEFGHJKMNPQRSTVWXYZ');

      expect(result).toBe(response);
    });

    it('propagates errors from the http layer', async () => {
      http.delete.mockRejectedValue(new Error('Network error'));

      await expect(
        ipAcls.delete('acl_01J5ABCDEFGHJKMNPQRSTVWXYZ')
      ).rejects.toThrow('Network error');
    });
  });
});
