import { describe, it, expect, beforeEach } from 'vitest';
import { AppResourceManager } from '@/resources/voice/apps';
import { createMockHttp, asHttp, type MockHttp } from '@test/support/mock-http';
import {
  voiceAppFixture,
  voiceAppListFixture,
  createVoiceAppPayloadFixture,
  updateVoiceAppPayloadFixture,
  voiceAppFiltersFixture,
} from '@test/support/fixtures/voice';
import { virtualNumberListFixture, virtualNumberFiltersFixture } from '@test/support/fixtures/vns';
import { Status } from '@/types/common';

describe('AppResourceManager (unit)', () => {
  let http: MockHttp;
  let apps: AppResourceManager;

  beforeEach(() => {
    http = createMockHttp();
    apps = new AppResourceManager(asHttp(http));
  });

  describe('create', () => {
    it('posts to /voice/apps with payload and returns created app', async () => {
      const payload = createVoiceAppPayloadFixture();
      const fixture = voiceAppFixture({ name: payload.name });
      http.post.mockResolvedValue(fixture);

      const result = await apps.create(payload);

      expect(http.post).toHaveBeenCalledWith('/voice/apps', payload);
      expect(result).toEqual(fixture);
    });

    it('returns a voice app with va_ id prefix', async () => {
      const fixture = voiceAppFixture();
      http.post.mockResolvedValue(fixture);

      const result = await apps.create(createVoiceAppPayloadFixture());

      expect(result.id).toMatch(/^va_/);
    });

    it('returns the response object reference unchanged', async () => {
      const fixture = voiceAppFixture();
      http.post.mockResolvedValue(fixture);

      const result = await apps.create(createVoiceAppPayloadFixture());

      expect(result).toBe(fixture);
    });

    it('propagates errors from the http layer', async () => {
      http.post.mockRejectedValue(new Error('Network error'));

      await expect(apps.create(createVoiceAppPayloadFixture())).rejects.toThrow('Network error');
    });

    it('defaults webhookApiVersion to 2026-06-01 if not provided', async () => {
      const payload = createVoiceAppPayloadFixture({ webhookApiVersion: undefined });
      http.post.mockResolvedValue(voiceAppFixture());

      await apps.create(payload);

      expect(http.post).toHaveBeenCalledWith(
        '/voice/apps',
        expect.objectContaining({ webhookApiVersion: '2026-06-01' })
      );
    });

    it('honors webhookApiVersion when explicitly specified', async () => {
      const payload = createVoiceAppPayloadFixture({ webhookApiVersion: '2025-08-01' });
      http.post.mockResolvedValue(voiceAppFixture());

      await apps.create(payload);

      expect(http.post).toHaveBeenCalledWith(
        '/voice/apps',
        expect.objectContaining({ webhookApiVersion: '2025-08-01' })
      );
    });
  });

  describe('list', () => {
    it('gets /voice/apps with undefined when called without filters', async () => {
      http.get.mockResolvedValue(voiceAppListFixture());

      await apps.list();

      expect(http.get).toHaveBeenCalledWith('/voice/apps', undefined);
    });

    it('forwards all filter fields to the http layer', async () => {
      http.get.mockResolvedValue(voiceAppListFixture());
      const filters = voiceAppFiltersFixture();

      await apps.list(filters);

      expect(http.get).toHaveBeenCalledWith('/voice/apps', filters);
    });

    it('forwards status filter as an array correctly', async () => {
      http.get.mockResolvedValue(voiceAppListFixture());

      await apps.list({ status: [Status.ACTIVE] });

      expect(http.get).toHaveBeenCalledWith('/voice/apps', { status: [Status.ACTIVE] });
    });

    it('returns the response object reference unchanged', async () => {
      const response = voiceAppListFixture();
      http.get.mockResolvedValue(response);

      const result = await apps.list();

      expect(result).toBe(response);
    });

    it('returns voice apps with va_ id prefix', async () => {
      http.get.mockResolvedValue(voiceAppListFixture());

      const result = await apps.list();

      result.data.forEach((app) => expect(app.id).toMatch(/^va_/));
    });

    it('propagates errors from the http layer', async () => {
      http.get.mockRejectedValue(new Error('Network error'));

      await expect(apps.list()).rejects.toThrow('Network error');
    });
  });

  describe('retrieve', () => {
    it('gets the correct path for a given voice app id', async () => {
      const fixture = voiceAppFixture();
      http.get.mockResolvedValue(fixture);

      const result = await apps.retrieve(fixture.id);

      expect(http.get).toHaveBeenCalledWith(`/voice/apps/${fixture.id}`);
      expect(result).toEqual(fixture);
    });

    it('returns the response object reference unchanged', async () => {
      const fixture = voiceAppFixture();
      http.get.mockResolvedValue(fixture);

      const result = await apps.retrieve(fixture.id);

      expect(result).toBe(fixture);
    });

    it('propagates errors from the http layer', async () => {
      http.get.mockRejectedValue(new Error('Network error'));

      await expect(apps.retrieve('va_01J5ABCDEFGHJKMNPQRSTVWXYZ')).rejects.toThrow('Network error');
    });
  });

  describe('update', () => {
    it('patches the correct path with the update payload', async () => {
      const payload = updateVoiceAppPayloadFixture();
      const fixture = voiceAppFixture({ name: payload.name });
      http.patch.mockResolvedValue(fixture);

      const result = await apps.update('va_01J5ABCDEFGHJKMNPQRSTVWXYZ', payload);

      expect(http.patch).toHaveBeenCalledWith(
        '/voice/apps/va_01J5ABCDEFGHJKMNPQRSTVWXYZ',
        payload,
        { retry: undefined, baseRetryDelayMs: undefined }
      );
      expect(result).toEqual(fixture);
    });

    it('returns the response object reference unchanged', async () => {
      const fixture = voiceAppFixture();
      http.patch.mockResolvedValue(fixture);

      const result = await apps.update(
        'va_01J5ABCDEFGHJKMNPQRSTVWXYZ',
        updateVoiceAppPayloadFixture()
      );

      expect(result).toBe(fixture);
    });

    it('propagates errors from the http layer', async () => {
      http.patch.mockRejectedValue(new Error('Network error'));

      await expect(
        apps.update('va_01J5ABCDEFGHJKMNPQRSTVWXYZ', updateVoiceAppPayloadFixture())
      ).rejects.toThrow('Network error');
    });
  });

  describe('delete', () => {
    it('deletes the correct path for a given voice app id', async () => {
      const response = { success: true, message: 'Voice app deleted successfully.' };
      http.delete.mockResolvedValue(response);

      const result = await apps.delete('va_01J5ABCDEFGHJKMNPQRSTVWXYZ');

      expect(http.delete).toHaveBeenCalledWith(
        '/voice/apps/va_01J5ABCDEFGHJKMNPQRSTVWXYZ',
        { retry: undefined, baseRetryDelayMs: undefined }
      );
      expect(result).toEqual(response);
    });

    it('returns the response object reference unchanged', async () => {
      const response = { success: true, message: 'Deleted.' };
      http.delete.mockResolvedValue(response);

      const result = await apps.delete('va_01J5ABCDEFGHJKMNPQRSTVWXYZ');

      expect(result).toBe(response);
    });

    it('propagates errors from the http layer', async () => {
      http.delete.mockRejectedValue(new Error('Network error'));

      await expect(apps.delete('va_01J5ABCDEFGHJKMNPQRSTVWXYZ')).rejects.toThrow('Network error');
    });
  });

  describe('listVirtualNumbers', () => {
    it('gets the correct sub-resource path with no params', async () => {
      const vnResponse = virtualNumberListFixture();
      http.get.mockResolvedValue(vnResponse);

      const result = await apps.listVirtualNumbers('va_01J5ABCDEFGHJKMNPQRSTVWXYZ');

      expect(http.get).toHaveBeenCalledWith(
        '/voice/apps/va_01J5ABCDEFGHJKMNPQRSTVWXYZ/virtual-numbers',
        undefined
      );
      expect(result).toEqual(vnResponse);
    });

    it('forwards virtual-number filter params correctly', async () => {
      const filters = virtualNumberFiltersFixture();
      http.get.mockResolvedValue(virtualNumberListFixture());

      await apps.listVirtualNumbers('va_01J5ABCDEFGHJKMNPQRSTVWXYZ', filters);

      expect(http.get).toHaveBeenCalledWith(
        '/voice/apps/va_01J5ABCDEFGHJKMNPQRSTVWXYZ/virtual-numbers',
        filters
      );
    });

    it('returns the response object reference unchanged', async () => {
      const response = virtualNumberListFixture();
      http.get.mockResolvedValue(response);

      const result = await apps.listVirtualNumbers('va_01J5ABCDEFGHJKMNPQRSTVWXYZ');

      expect(result).toBe(response);
    });

    it('propagates errors from the http layer', async () => {
      http.get.mockRejectedValue(new Error('Network error'));

      await expect(
        apps.listVirtualNumbers('va_01J5ABCDEFGHJKMNPQRSTVWXYZ')
      ).rejects.toThrow('Network error');
    });
  });
});
