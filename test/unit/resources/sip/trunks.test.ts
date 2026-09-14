import { describe, it, expect, beforeEach } from 'vitest';
import { TrunkResourceManager } from '@/resources/sip/trunks';
import { createMockHttp, asHttp, type MockHttp } from '@test/support/mock-http';
import {
  sipTrunkFixture,
  sipTrunkInactiveFixture,
  sipTrunkListFixture,
  createSipTrunkPayloadFixture,
  createSipTrunkCredentialPayloadFixture,
  updateSipTrunkPayloadFixture,
  sipTrunkFiltersFixture,
} from '@test/support/fixtures/sip';
import {
  virtualNumberListFixture,
  virtualNumberFiltersFixture,
} from '@test/support/fixtures/vns';
import { Status } from '@/types/common';
import { Transport } from '@/types/sip';

describe('TrunkResourceManager (unit)', () => {
  let http: MockHttp;
  let trunks: TrunkResourceManager;

  beforeEach(() => {
    http = createMockHttp();
    trunks = new TrunkResourceManager(asHttp(http));
  });

  describe('create', () => {
    it('posts to /sip/trunks with an IP-auth payload and returns the trunk', async () => {
      const payload = createSipTrunkPayloadFixture();
      const fixture = sipTrunkFixture({ name: payload.name });
      http.post.mockResolvedValue(fixture);

      const result = await trunks.create(payload);

      expect(http.post).toHaveBeenCalledWith('/sip/trunks', payload);
      expect(result).toEqual(fixture);
    });

    it('creates a credential-auth trunk', async () => {
      const payload = createSipTrunkCredentialPayloadFixture();
      const fixture = sipTrunkFixture({ name: payload.name });
      http.post.mockResolvedValue(fixture);

      await trunks.create(payload);

      expect(http.post).toHaveBeenCalledWith('/sip/trunks', {
        ...payload,
        webhookApiVersion: '2026-06-01',
      });
    });

    it('handles transport tls when secure is passed as true', async () => {
      const payload = createSipTrunkPayloadFixture({ secure: true });
      const fixture = sipTrunkFixture({ secure: true, transport: Transport.TLS });
      http.post.mockResolvedValue(fixture);

      const result = await trunks.create(payload);

      expect(http.post).toHaveBeenCalledWith('/sip/trunks', payload);
      expect(result.transport).toBe(Transport.TLS);
      expect(result.secure).toBe(true);
    });

    it('handles transport tcp when secure is passed as false', async () => {
      const payload = createSipTrunkPayloadFixture({ secure: false });
      const fixture = sipTrunkFixture({ secure: false, transport: Transport.TCP });
      http.post.mockResolvedValue(fixture);

      const result = await trunks.create(payload);

      expect(http.post).toHaveBeenCalledWith('/sip/trunks', payload);
      expect(result.transport).toBe(Transport.TCP);
      expect(result.secure).toBe(false);
    });

    it('handles transport when passed explicitly', async () => {
      const payload = createSipTrunkCredentialPayloadFixture({ transport: Transport.UDP });
      const fixture = sipTrunkFixture({ transport: Transport.UDP });
      http.post.mockResolvedValue(fixture);

      const result = await trunks.create(payload);

      expect(http.post).toHaveBeenCalledWith('/sip/trunks', {
        ...payload,
        webhookApiVersion: '2026-06-01',
      });
      expect(result.transport).toBe(Transport.UDP);
    });

    it('defaults webhookApiVersion to 2026-06-01 if not provided', async () => {
      const payload = createSipTrunkCredentialPayloadFixture({ webhookApiVersion: undefined });
      const fixture = sipTrunkFixture({ name: payload.name });
      http.post.mockResolvedValue(fixture);

      await trunks.create(payload);

      expect(http.post).toHaveBeenCalledWith(
        '/sip/trunks',
        expect.objectContaining({ webhookApiVersion: '2026-06-01' })
      );
    });

    it('honors webhookApiVersion when explicitly specified', async () => {
      const payload = createSipTrunkPayloadFixture({ webhookApiVersion: '2025-08-01' });
      const fixture = sipTrunkFixture({ name: payload.name });
      http.post.mockResolvedValue(fixture);

      await trunks.create(payload);

      expect(http.post).toHaveBeenCalledWith(
        '/sip/trunks',
        expect.objectContaining({ webhookApiVersion: '2025-08-01' })
      );
    });

    it('returns a trunk with the st_ id prefix', async () => {
      const fixture = sipTrunkFixture();
      http.post.mockResolvedValue(fixture);

      const result = await trunks.create(createSipTrunkPayloadFixture());

      expect(result.id).toMatch(/^st_/);
    });

    it('returns the response object reference unchanged', async () => {
      const fixture = sipTrunkFixture();
      http.post.mockResolvedValue(fixture);

      const result = await trunks.create(createSipTrunkPayloadFixture());

      expect(result).toBe(fixture);
    });

    it('propagates errors from the http layer', async () => {
      http.post.mockRejectedValue(new Error('Network error'));

      await expect(trunks.create(createSipTrunkPayloadFixture())).rejects.toThrow('Network error');
    });
  });

  describe('retrieve', () => {
    it('gets the correct path for a given trunk id', async () => {
      const fixture = sipTrunkFixture();
      http.get.mockResolvedValue(fixture);

      const result = await trunks.retrieve(fixture.id);

      expect(http.get).toHaveBeenCalledWith(`/sip/trunks/${fixture.id}`);
      expect(result).toEqual(fixture);
    });

    it('returns an active trunk', async () => {
      const fixture = sipTrunkFixture({ isActive: true });
      http.get.mockResolvedValue(fixture);

      const result = await trunks.retrieve(fixture.id);

      expect(result.isActive).toBe(true);
    });

    it('returns an inactive trunk', async () => {
      const fixture = sipTrunkInactiveFixture();
      http.get.mockResolvedValue(fixture);

      const result = await trunks.retrieve(fixture.id);

      expect(result.isActive).toBe(false);
    });

    it('returns the response object reference unchanged', async () => {
      const fixture = sipTrunkFixture();
      http.get.mockResolvedValue(fixture);

      const result = await trunks.retrieve(fixture.id);

      expect(result).toBe(fixture);
    });

    it('propagates errors from the http layer', async () => {
      http.get.mockRejectedValue(new Error('Network error'));

      await expect(trunks.retrieve('st_01J5ABCDEFGHJKMNPQRSTVWXYZ')).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('list', () => {
    it('gets /sip/trunks with undefined when called without filters', async () => {
      http.get.mockResolvedValue(sipTrunkListFixture());

      await trunks.list();

      expect(http.get).toHaveBeenCalledWith('/sip/trunks', undefined);
    });

    it('forwards all filter fields to the http layer', async () => {
      http.get.mockResolvedValue(sipTrunkListFixture());
      const filters = sipTrunkFiltersFixture();

      await trunks.list(filters);

      expect(http.get).toHaveBeenCalledWith('/sip/trunks', filters);
    });

    it('forwards status filter as an array correctly', async () => {
      http.get.mockResolvedValue(sipTrunkListFixture());

      await trunks.list({ status: [Status.ACTIVE, Status.INACTIVE] });

      expect(http.get).toHaveBeenCalledWith('/sip/trunks', {
        status: [Status.ACTIVE, Status.INACTIVE],
      });
    });

    it('returns the response object reference unchanged', async () => {
      const response = sipTrunkListFixture();
      http.get.mockResolvedValue(response);

      const result = await trunks.list();

      expect(result).toBe(response);
    });

    it('returns trunks with the st_ id prefix', async () => {
      http.get.mockResolvedValue(sipTrunkListFixture());

      const result = await trunks.list();

      result.data.forEach((trunk) => expect(trunk.id).toMatch(/^st_/));
    });

    it('propagates errors from the http layer', async () => {
      http.get.mockRejectedValue(new Error('Network error'));

      await expect(trunks.list()).rejects.toThrow('Network error');
    });
  });

  describe('update', () => {
    it('patches the correct path with the update payload', async () => {
      const payload = updateSipTrunkPayloadFixture();
      const fixture = sipTrunkFixture({ name: payload.name });
      http.patch.mockResolvedValue(fixture);

      const result = await trunks.update('st_01J5ABCDEFGHJKMNPQRSTVWXYZ', payload);

      expect(http.patch).toHaveBeenCalledWith(
        '/sip/trunks/st_01J5ABCDEFGHJKMNPQRSTVWXYZ',
        payload,
        { retry: undefined, baseRetryDelayMs: undefined }
      );
      expect(result).toEqual(fixture);
    });

    it('deactivates a trunk by setting isActive to false', async () => {
      const payload = updateSipTrunkPayloadFixture({ isActive: false });
      http.patch.mockResolvedValue(sipTrunkInactiveFixture());

      await trunks.update('st_01J5ABCDEFGHJKMNPQRSTVWXYZ', payload);

      expect(http.patch).toHaveBeenCalledWith(
        '/sip/trunks/st_01J5ABCDEFGHJKMNPQRSTVWXYZ',
        payload,
        { retry: undefined, baseRetryDelayMs: undefined }
      );
    });

    it('updates transport on a trunk', async () => {
      const payload = updateSipTrunkPayloadFixture({ transport: Transport.TCP, secure: false });
      const fixture = sipTrunkFixture({ transport: Transport.TCP, secure: false });
      http.patch.mockResolvedValue(fixture);

      const result = await trunks.update('st_01J5ABCDEFGHJKMNPQRSTVWXYZ', payload);

      expect(http.patch).toHaveBeenCalledWith(
        '/sip/trunks/st_01J5ABCDEFGHJKMNPQRSTVWXYZ',
        payload,
        { retry: undefined, baseRetryDelayMs: undefined }
      );
      expect(result.transport).toBe(Transport.TCP);
      expect(result.secure).toBe(false);
    });

    it('returns the response object reference unchanged', async () => {
      const fixture = sipTrunkFixture();
      http.patch.mockResolvedValue(fixture);

      const result = await trunks.update(
        'st_01J5ABCDEFGHJKMNPQRSTVWXYZ',
        updateSipTrunkPayloadFixture()
      );

      expect(result).toBe(fixture);
    });

    it('propagates errors from the http layer', async () => {
      http.patch.mockRejectedValue(new Error('Network error'));

      await expect(
        trunks.update('st_01J5ABCDEFGHJKMNPQRSTVWXYZ', updateSipTrunkPayloadFixture())
      ).rejects.toThrow('Network error');
    });
  });

  describe('delete', () => {
    it('deletes the correct path for a given trunk id', async () => {
      const response = { success: true, message: 'Trunk deleted successfully.' };
      http.delete.mockResolvedValue(response);

      const result = await trunks.delete('st_01J5ABCDEFGHJKMNPQRSTVWXYZ');

      expect(http.delete).toHaveBeenCalledWith(
        '/sip/trunks/st_01J5ABCDEFGHJKMNPQRSTVWXYZ',
        { retry: undefined, baseRetryDelayMs: undefined }
      );
      expect(result).toEqual(response);
    });

    it('returns the response object reference unchanged', async () => {
      const response = { success: true, message: 'Deleted.' };
      http.delete.mockResolvedValue(response);

      const result = await trunks.delete('st_01J5ABCDEFGHJKMNPQRSTVWXYZ');

      expect(result).toBe(response);
    });

    it('propagates errors from the http layer', async () => {
      http.delete.mockRejectedValue(new Error('Network error'));

      await expect(trunks.delete('st_01J5ABCDEFGHJKMNPQRSTVWXYZ')).rejects.toThrow('Network error');
    });
  });

  describe('listVirtualNumbers', () => {
    it('gets the correct sub-resource path with no params', async () => {
      const vnResponse = virtualNumberListFixture();
      http.get.mockResolvedValue(vnResponse);

      const result = await trunks.listVirtualNumbers('st_01J5ABCDEFGHJKMNPQRSTVWXYZ');

      expect(http.get).toHaveBeenCalledWith(
        '/sip/trunks/st_01J5ABCDEFGHJKMNPQRSTVWXYZ/virtual-numbers',
        undefined
      );
      expect(result).toEqual(vnResponse);
    });

    it('forwards virtual-number filter params correctly', async () => {
      const filters = virtualNumberFiltersFixture();
      http.get.mockResolvedValue(virtualNumberListFixture());

      await trunks.listVirtualNumbers('st_01J5ABCDEFGHJKMNPQRSTVWXYZ', filters);

      expect(http.get).toHaveBeenCalledWith(
        '/sip/trunks/st_01J5ABCDEFGHJKMNPQRSTVWXYZ/virtual-numbers',
        filters
      );
    });

    it('returns the response object reference unchanged', async () => {
      const response = virtualNumberListFixture();
      http.get.mockResolvedValue(response);

      const result = await trunks.listVirtualNumbers('st_01J5ABCDEFGHJKMNPQRSTVWXYZ');

      expect(result).toBe(response);
    });

    it('propagates errors from the http layer', async () => {
      http.get.mockRejectedValue(new Error('Network error'));

      await expect(
        trunks.listVirtualNumbers('st_01J5ABCDEFGHJKMNPQRSTVWXYZ')
      ).rejects.toThrow('Network error');
    });
  });
});
