import { describe, it, expect, beforeEach } from 'vitest';
import { CallResourceManager } from '@/resources/voice/calls';
import { createMockHttp, asHttp, type MockHttp } from '@test/support/mock-http';
import {
  callResponseFixture,
  createCallParamsFixture,
  voiceCallFixture,
  voiceCallListFixture,
  voiceCallLegListFixture,
  voiceCallFiltersFixture,
} from '@test/support/fixtures/voice';

describe('CallResourceManager (unit)', () => {
  let http: MockHttp;
  let calls: CallResourceManager;

  beforeEach(() => {
    http = createMockHttp();
    calls = new CallResourceManager(asHttp(http));
  });

  describe('create', () => {
    it('posts to /voice/calls/initiate with mapped payload and returns response', async () => {
      const params = createCallParamsFixture();
      const fixture = callResponseFixture();
      http.post.mockResolvedValue(fixture);

      const result = await calls.create(params);

      expect(http.post).toHaveBeenCalledWith('/voice/calls/initiate', {
        from_number: params.fromNumber,
        to_number: params.toNumber,
        flow_url: params.flowUrl,
        status_callback_url: params.statusCallbackUrl,
        record: true,
      });
      expect(result).toEqual(fixture);
    });

    it('defaults record to true if record is not provided', async () => {
      const params = createCallParamsFixture({ record: undefined });
      http.post.mockResolvedValue(callResponseFixture());

      await calls.create(params);

      expect(http.post).toHaveBeenCalledWith(
        '/voice/calls/initiate',
        expect.objectContaining({ record: true })
      );
    });

    it('honors record = false when explicitly specified', async () => {
      const params = createCallParamsFixture({ record: false });
      http.post.mockResolvedValue(callResponseFixture());

      await calls.create(params);

      expect(http.post).toHaveBeenCalledWith(
        '/voice/calls/initiate',
        expect.objectContaining({ record: false })
      );
    });

    it('returns a call response containing cs_ id prefix', async () => {
      const fixture = callResponseFixture();
      http.post.mockResolvedValue(fixture);

      const result = await calls.create(createCallParamsFixture());

      expect(result.data.id).toMatch(/^cs_/);
    });

    it('returns the response object reference unchanged', async () => {
      const fixture = callResponseFixture();
      http.post.mockResolvedValue(fixture);

      const result = await calls.create(createCallParamsFixture());

      expect(result).toBe(fixture);
    });

    it('propagates errors from the http layer', async () => {
      http.post.mockRejectedValue(new Error('Network error'));

      await expect(calls.create(createCallParamsFixture())).rejects.toThrow('Network error');
    });
  });

  describe('list', () => {
    it('gets /voice/calls with undefined when called without filters', async () => {
      http.get.mockResolvedValue(voiceCallListFixture());

      await calls.list();

      expect(http.get).toHaveBeenCalledWith('/voice/calls', undefined);
    });

    it('forwards all filter fields to the http layer', async () => {
      http.get.mockResolvedValue(voiceCallListFixture());
      const filters = voiceCallFiltersFixture();

      await calls.list(filters);

      expect(http.get).toHaveBeenCalledWith('/voice/calls', filters);
    });

    it('returns the response object reference unchanged', async () => {
      const response = voiceCallListFixture();
      http.get.mockResolvedValue(response);

      const result = await calls.list();

      expect(result).toBe(response);
    });

    it('returns voice calls with cs_ id prefix', async () => {
      http.get.mockResolvedValue(voiceCallListFixture());

      const result = await calls.list();

      result.data.forEach((call) => expect(call.id).toMatch(/^cs_/));
    });

    it('propagates errors from the http layer', async () => {
      http.get.mockRejectedValue(new Error('Network error'));

      await expect(calls.list()).rejects.toThrow('Network error');
    });
  });

  describe('retrieve', () => {
    it('gets the correct path for a given voice call id', async () => {
      const fixture = voiceCallFixture();
      http.get.mockResolvedValue(fixture);

      const result = await calls.retrieve(fixture.id);

      expect(http.get).toHaveBeenCalledWith(`/voice/calls/${fixture.id}`);
      expect(result).toEqual(fixture);
    });

    it('returns the response object reference unchanged', async () => {
      const fixture = voiceCallFixture();
      http.get.mockResolvedValue(fixture);

      const result = await calls.retrieve(fixture.id);

      expect(result).toBe(fixture);
    });

    it('propagates errors from the http layer', async () => {
      http.get.mockRejectedValue(new Error('Network error'));

      await expect(calls.retrieve('cs_01J5ABCDEFGHJKMNPQRSTVWXYZ')).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('getLegs', () => {
    it('gets the legs sub-resource path for a given call id', async () => {
      const legResponse = voiceCallLegListFixture();
      http.get.mockResolvedValue(legResponse);

      const result = await calls.getLegs('cs_01J5ABCDEFGHJKMNPQRSTVWXYZ');

      expect(http.get).toHaveBeenCalledWith('/voice/calls/cs_01J5ABCDEFGHJKMNPQRSTVWXYZ/legs');
      expect(result).toEqual(legResponse);
    });

    it('returns legs with cl_ id prefix', async () => {
      http.get.mockResolvedValue(voiceCallLegListFixture());

      const result = await calls.getLegs('cs_01J5ABCDEFGHJKMNPQRSTVWXYZ');

      result.data.forEach((leg) => expect(leg.id).toMatch(/^cl_/));
    });

    it('returns the response object reference unchanged', async () => {
      const response = voiceCallLegListFixture();
      http.get.mockResolvedValue(response);

      const result = await calls.getLegs('cs_01J5ABCDEFGHJKMNPQRSTVWXYZ');

      expect(result).toBe(response);
    });

    it('propagates errors from the http layer', async () => {
      http.get.mockRejectedValue(new Error('Network error'));

      await expect(calls.getLegs('cs_01J5ABCDEFGHJKMNPQRSTVWXYZ')).rejects.toThrow(
        'Network error'
      );
    });
  });
});
