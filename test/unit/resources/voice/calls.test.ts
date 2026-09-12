import { describe, it, expect, beforeEach } from 'vitest';
import { CallResourceManager } from '@/resources/voice/calls';
import { createMockHttp, asHttp, type MockHttp } from '@test/support/mock-http';
import { toCamelCase } from '@/lib/utils';
import {
  callResponseFixture,
  CreateCallPayloadFixture,
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
      const params = CreateCallPayloadFixture();
      const fixture = callResponseFixture();
      http.post.mockResolvedValue(toCamelCase(fixture));

      const result = await calls.create(params);

      expect(http.post).toHaveBeenCalledWith('/voice/calls/initiate', {
        fromNumber: params.fromNumber,
        toNumber: params.toNumber,
        flowUrl: params.flowUrl,
        statusCallbackUrl: params.statusCallbackUrl,
        record: true,
      });
      expect(result.data.fromNumber).toBe(params.fromNumber);
      expect(result.data.toNumber).toBe(params.toNumber);
      expect(result.message).toBe(fixture.message);
    });

    it('defaults record to true if record is not provided', async () => {
      const params = CreateCallPayloadFixture({ record: undefined });
      http.post.mockResolvedValue(toCamelCase(callResponseFixture()));

      await calls.create(params);

      expect(http.post).toHaveBeenCalledWith(
        '/voice/calls/initiate',
        expect.objectContaining({ record: true })
      );
    });

    it('honors record = false when explicitly specified', async () => {
      const params = CreateCallPayloadFixture({ record: false });
      http.post.mockResolvedValue(toCamelCase(callResponseFixture()));

      await calls.create(params);

      expect(http.post).toHaveBeenCalledWith(
        '/voice/calls/initiate',
        expect.objectContaining({ record: false })
      );
    });

    it('returns a call response containing cs_ id prefix', async () => {
      const fixture = callResponseFixture();
      http.post.mockResolvedValue(fixture);

      const result = await calls.create(CreateCallPayloadFixture());

      expect(result.data.id).toMatch(/^cs_/);
    });

    it('transforms snake_case response to camelCase', async () => {
      const fixture = callResponseFixture();
      http.post.mockResolvedValue(toCamelCase(fixture));

      const result = await calls.create(CreateCallPayloadFixture());

      expect(result.data).toHaveProperty('fromNumber');
      expect(result.data).toHaveProperty('toNumber');
      expect(result.data).not.toHaveProperty('from_number');
      expect(result.data).not.toHaveProperty('to_number');
    });

    it('propagates errors from the http layer', async () => {
      http.post.mockRejectedValue(new Error('Network error'));

      await expect(calls.create(CreateCallPayloadFixture())).rejects.toThrow('Network error');
    });
  });

  describe('list', () => {
    it('gets /voice/calls with undefined when called without filters', async () => {
      http.get.mockResolvedValue(toCamelCase(voiceCallListFixture()));

      await calls.list();

      expect(http.get).toHaveBeenCalledWith('/voice/calls', undefined);
    });

    it('forwards all filter fields to the http layer', async () => {
      http.get.mockResolvedValue(toCamelCase(voiceCallListFixture()));
      const filters = voiceCallFiltersFixture();

      await calls.list(filters);

      expect(http.get).toHaveBeenCalledWith('/voice/calls', filters);
    });

    it('transforms snake_case response to camelCase', async () => {
      const response = voiceCallListFixture();
      http.get.mockResolvedValue(toCamelCase(response));

      const result = await calls.list();

      expect(result.data[0]).toHaveProperty('fromNumber');
      expect(result.data[0]).toHaveProperty('toNumber');
      expect(result.data[0]).not.toHaveProperty('from_number');
      expect(result.data[0]).not.toHaveProperty('to_number');
    });

    it('returns voice calls with cs_ id prefix', async () => {
      http.get.mockResolvedValue(toCamelCase(voiceCallListFixture()));

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
      http.get.mockResolvedValue(toCamelCase(fixture));

      const result = await calls.retrieve(fixture.id);

      expect(http.get).toHaveBeenCalledWith(`/voice/calls/${fixture.id}`);
      expect(result.id).toBe(fixture.id);
    });

    it('transforms snake_case response to camelCase', async () => {
      const fixture = voiceCallFixture();
      http.get.mockResolvedValue(toCamelCase(fixture));

      const result = await calls.retrieve(fixture.id);

      expect(result).toHaveProperty('fromNumber');
      expect(result).toHaveProperty('toNumber');
      expect(result).toHaveProperty('voiceAppId');
      expect(result).not.toHaveProperty('from_number');
      expect(result).not.toHaveProperty('to_number');
      expect(result).not.toHaveProperty('voice_app_id');
    });

    it('preserves properties keys without case conversion', async () => {
      const fixture = voiceCallFixture();
      http.get.mockResolvedValue(toCamelCase(fixture));

      const result = await calls.retrieve(fixture.id);

      expect(result.properties).toEqual(fixture.properties);
    });

    it('propagates errors from the http layer', async () => {
      http.get.mockRejectedValue(new Error('Network error'));

      await expect(calls.retrieve('cs_01J5ABCDEFGHJKMNPQRSTVWXYZ')).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('listLegs', () => {
    it('gets the legs sub-resource path for a given call id', async () => {
      const legResponse = voiceCallLegListFixture();
      http.get.mockResolvedValue(legResponse);

      const result = await calls.listLegs('cs_01J5ABCDEFGHJKMNPQRSTVWXYZ');

      expect(http.get).toHaveBeenCalledWith('/voice/calls/cs_01J5ABCDEFGHJKMNPQRSTVWXYZ/legs');
      expect(result.data.length).toBe(legResponse.data.length);
    });

    it('returns legs with cl_ id prefix', async () => {
      http.get.mockResolvedValue(toCamelCase(voiceCallLegListFixture()));

      const result = await calls.listLegs('cs_01J5ABCDEFGHJKMNPQRSTVWXYZ');

      result.data.forEach((leg) => expect(leg.id).toMatch(/^cl_/));
    });

    it('transforms snake_case response to camelCase', async () => {
      const response = voiceCallLegListFixture();
      http.get.mockResolvedValue(toCamelCase(response));

      const result = await calls.listLegs('cs_01J5ABCDEFGHJKMNPQRSTVWXYZ');

      expect(result.data[0]).toHaveProperty('fromNumber');
      expect(result.data[0]).toHaveProperty('toNumber');
      expect(result.data[0]).not.toHaveProperty('from_number');
      expect(result.data[0]).not.toHaveProperty('to_number');
    });

    it('propagates errors from the http layer', async () => {
      http.get.mockRejectedValue(new Error('Network error'));

      await expect(calls.listLegs('cs_01J5ABCDEFGHJKMNPQRSTVWXYZ')).rejects.toThrow(
        'Network error'
      );
    });
  });
});
