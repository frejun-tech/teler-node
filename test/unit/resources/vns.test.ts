import { describe, it, expect, beforeEach } from 'vitest';
import { VirtualNumberResourceManager } from '@/resources/vns';
import { createMockHttp, asHttp, type MockHttp } from '@test/support/mock-http';
import {
  virtualNumberFixture,
  virtualNumberListFixture,
  updateVirtualNumberPayloadFixture,
  assignVirtualNumberPayloadFixture,
  assignToTrunkPayloadFixture,
  assignAllPayloadFixture,
  unassignVirtualNumberPayloadFixture,
  unassignAllPayloadFixture,
  virtualNumberFiltersFixture,
} from '@test/support/fixtures/vns';

describe('VirtualNumberResourceManager (unit)', () => {
  let http: MockHttp;
  let virtualNumbers: VirtualNumberResourceManager;

  beforeEach(() => {
    http = createMockHttp();
    virtualNumbers = new VirtualNumberResourceManager(asHttp(http));
  });

  describe('list', () => {
    it('gets /virtual-numbers with undefined when called without filters', async () => {
      http.get.mockResolvedValue(virtualNumberListFixture());

      await virtualNumbers.list();

      expect(http.get).toHaveBeenCalledWith('/virtual-numbers', undefined);
    });

    it('forwards all filter fields to the http layer', async () => {
      http.get.mockResolvedValue(virtualNumberListFixture());
      const filters = virtualNumberFiltersFixture();

      await virtualNumbers.list(filters);

      expect(http.get).toHaveBeenCalledWith('/virtual-numbers', filters);
    });

    it('forwards search-only filter correctly', async () => {
      http.get.mockResolvedValue(virtualNumberListFixture());

      await virtualNumbers.list({ search: '800' });

      expect(http.get).toHaveBeenCalledWith('/virtual-numbers', { search: '800' });
    });

    it('forwards location array filter correctly', async () => {
      http.get.mockResolvedValue(virtualNumberListFixture());

      await virtualNumbers.list({ location: ['US', 'IN'] });

      expect(http.get).toHaveBeenCalledWith('/virtual-numbers', { location: ['US', 'IN'] });
    });

    it('returns the response object reference unchanged', async () => {
      const response = virtualNumberListFixture();
      http.get.mockResolvedValue(response);

      const result = await virtualNumbers.list();

      expect(result).toBe(response);
    });

    it('returns a page with data, cursors, and has_more', async () => {
      http.get.mockResolvedValue(virtualNumberListFixture());

      const result = await virtualNumbers.list();

      expect(result.data).toBeInstanceOf(Array);
      expect(result).toHaveProperty('has_more');
      expect(result).toHaveProperty('next_cursor');
      expect(result).toHaveProperty('previous_cursor');
    });

    it('returns virtual numbers with vn_ id prefix', async () => {
      http.get.mockResolvedValue(virtualNumberListFixture());

      const result = await virtualNumbers.list();

      result.data.forEach((vn) => expect(vn.id).toMatch(/^vn_/));
    });

    it('propagates errors from the http layer', async () => {
      http.get.mockRejectedValue(new Error('Network error'));

      await expect(virtualNumbers.list()).rejects.toThrow('Network error');
    });
  });

  describe('update', () => {
    it('patches the correct path with the update payload', async () => {
      const payload = updateVirtualNumberPayloadFixture();
      const fixture = virtualNumberFixture({ name: payload.name });
      http.patch.mockResolvedValue(fixture);

      const result = await virtualNumbers.update('vn_01J5ABCDEFGHJKMNPQRSTVWXYZ', payload);

      expect(http.patch).toHaveBeenCalledWith(
        '/virtual-numbers/vn_01J5ABCDEFGHJKMNPQRSTVWXYZ',
        payload
      );
      expect(result).toEqual(fixture);
    });

    it('returns the response object reference unchanged', async () => {
      const fixture = virtualNumberFixture();
      http.patch.mockResolvedValue(fixture);

      const result = await virtualNumbers.update(
        'vn_01J5ABCDEFGHJKMNPQRSTVWXYZ',
        updateVirtualNumberPayloadFixture()
      );

      expect(result).toBe(fixture);
    });

    it('propagates errors from the http layer', async () => {
      http.patch.mockRejectedValue(new Error('Network error'));

      await expect(
        virtualNumbers.update('vn_01J5ABCDEFGHJKMNPQRSTVWXYZ', updateVirtualNumberPayloadFixture())
      ).rejects.toThrow('Network error');
    });
  });

  describe('assign', () => {
    it('posts to /virtual-numbers/assign with the payload', async () => {
      const payload = assignVirtualNumberPayloadFixture();
      const response = { success: true, message: 'Virtual numbers assigned successfully.' };
      http.post.mockResolvedValue(response);

      const result = await virtualNumbers.assign(payload);

      expect(http.post).toHaveBeenCalledWith('/virtual-numbers/assign', payload);
      expect(result).toEqual(response);
    });

    it('assigns to a SIP trunk instead of a voice app', async () => {
      const payload = assignToTrunkPayloadFixture();
      http.post.mockResolvedValue({ success: true, message: 'Assigned.' });

      await virtualNumbers.assign(payload);

      expect(http.post).toHaveBeenCalledWith('/virtual-numbers/assign', payload);
    });

    it('assigns all virtual numbers via apply_to_all flag', async () => {
      const payload = assignAllPayloadFixture();
      http.post.mockResolvedValue({ success: true, message: 'Assigned.' });

      await virtualNumbers.assign(payload);

      expect(http.post).toHaveBeenCalledWith('/virtual-numbers/assign', payload);
    });

    it('returns the response object reference unchanged', async () => {
      const response = { success: true, message: 'Assigned.' };
      http.post.mockResolvedValue(response);

      const result = await virtualNumbers.assign(assignVirtualNumberPayloadFixture());

      expect(result).toBe(response);
    });

    it('propagates errors from the http layer', async () => {
      http.post.mockRejectedValue(new Error('Network error'));

      await expect(
        virtualNumbers.assign(assignVirtualNumberPayloadFixture())
      ).rejects.toThrow('Network error');
    });
  });

  describe('unassign', () => {
    it('posts to /virtual-numbers/unassign with the payload', async () => {
      const payload = unassignVirtualNumberPayloadFixture();
      const response = { success: true, message: 'Virtual numbers unassigned successfully.' };
      http.post.mockResolvedValue(response);

      const result = await virtualNumbers.unassign(payload);

      expect(http.post).toHaveBeenCalledWith('/virtual-numbers/unassign', payload);
      expect(result).toEqual(response);
    });

    it('unassigns all virtual numbers via apply_to_all flag', async () => {
      const payload = unassignAllPayloadFixture();
      http.post.mockResolvedValue({ success: true, message: 'Unassigned.' });

      await virtualNumbers.unassign(payload);

      expect(http.post).toHaveBeenCalledWith('/virtual-numbers/unassign', payload);
    });

    it('returns the response object reference unchanged', async () => {
      const response = { success: true, message: 'Unassigned.' };
      http.post.mockResolvedValue(response);

      const result = await virtualNumbers.unassign(unassignVirtualNumberPayloadFixture());

      expect(result).toBe(response);
    });

    it('propagates errors from the http layer', async () => {
      http.post.mockRejectedValue(new Error('Network error'));

      await expect(
        virtualNumbers.unassign(unassignVirtualNumberPayloadFixture())
      ).rejects.toThrow('Network error');
    });
  });
});
