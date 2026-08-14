import { describe, it, expect, beforeEach } from 'vitest';
import { SipCallResourceManager } from '@/resources/sip/calls';
import { createMockHttp, asHttp, type MockHttp } from '@test/support/mock-http';
import {
  sipCallFixture,
  sipCallInProgressFixture,
  sipCallUnansweredFixture,
  sipCallListFixture,
  sipCallFiltersFixture,
} from '@test/support/fixtures/sip';

describe('SipCallResourceManager (unit)', () => {
  let http: MockHttp;
  let sipCalls: SipCallResourceManager;

  beforeEach(() => {
    http = createMockHttp();
    sipCalls = new SipCallResourceManager(asHttp(http));
  });

  describe('list', () => {
    it('gets /sip/calls with undefined when called without filters', async () => {
      http.get.mockResolvedValue(sipCallListFixture());

      await sipCalls.list();

      expect(http.get).toHaveBeenCalledWith('/sip/calls', undefined);
    });

    it('forwards all filter fields to the http layer', async () => {
      http.get.mockResolvedValue(sipCallListFixture());
      const filters = sipCallFiltersFixture();

      await sipCalls.list(filters);

      expect(http.get).toHaveBeenCalledWith('/sip/calls', filters);
    });

    it('forwards trunk_id filter correctly', async () => {
      http.get.mockResolvedValue(sipCallListFixture());

      await sipCalls.list({ trunk_id: 'st_01J5ABCDEFGHJKMNPQRSTVWXYZ' });

      expect(http.get).toHaveBeenCalledWith('/sip/calls', {
        trunk_id: 'st_01J5ABCDEFGHJKMNPQRSTVWXYZ',
      });
    });

    it('forwards date range filters correctly', async () => {
      http.get.mockResolvedValue(sipCallListFixture());
      const filters = {
        created_after: '2026-08-01T00:00:00.000Z',
        created_before: '2026-08-14T23:59:59.000Z',
      };

      await sipCalls.list(filters);

      expect(http.get).toHaveBeenCalledWith('/sip/calls', filters);
    });

    it('returns the response object reference unchanged', async () => {
      const response = sipCallListFixture();
      http.get.mockResolvedValue(response);

      const result = await sipCalls.list();

      expect(result).toBe(response);
    });

    it('returns a page with data, cursors, and has_more', async () => {
      http.get.mockResolvedValue(sipCallListFixture());

      const result = await sipCalls.list();

      expect(result.data).toBeInstanceOf(Array);
      expect(result).toHaveProperty('has_more');
      expect(result).toHaveProperty('next_cursor');
      expect(result).toHaveProperty('previous_cursor');
    });

    it('returns SIP calls with cs_ id prefix', async () => {
      http.get.mockResolvedValue(sipCallListFixture());

      const result = await sipCalls.list();

      result.data.forEach((call) => expect(call.id).toMatch(/^cs_/));
    });

    it('propagates errors from the http layer', async () => {
      http.get.mockRejectedValue(new Error('Network error'));

      await expect(sipCalls.list()).rejects.toThrow('Network error');
    });
  });

  describe('retrieve', () => {
    it('gets the correct path for a given call id', async () => {
      const fixture = sipCallFixture();
      http.get.mockResolvedValue(fixture);

      const result = await sipCalls.retrieve(fixture.id);

      expect(http.get).toHaveBeenCalledWith(`/sip/calls/${fixture.id}`);
      expect(result).toEqual(fixture);
    });

    it('returns a completed call with all fields populated', async () => {
      const fixture = sipCallFixture();
      http.get.mockResolvedValue(fixture);

      const result = await sipCalls.retrieve(fixture.id);

      expect(result.state).toBe('completed');
      expect(result.answered_at).not.toBeNull();
      expect(result.ended_at).not.toBeNull();
      expect(result.duration_seconds).toBeGreaterThan(0);
    });

    it('returns an in-progress call with null end fields', async () => {
      const fixture = sipCallInProgressFixture();
      http.get.mockResolvedValue(fixture);

      const result = await sipCalls.retrieve(fixture.id);

      expect(result.state).toBe('in_progress');
      expect(result.ended_at).toBeNull();
      expect(result.duration_seconds).toBeNull();
    });

    it('returns an unanswered call with null answer time', async () => {
      const fixture = sipCallUnansweredFixture();
      http.get.mockResolvedValue(fixture);

      const result = await sipCalls.retrieve(fixture.id);

      expect(result.state).toBe('no_answer');
      expect(result.answered_at).toBeNull();
      expect(result.duration_seconds).toBeNull();
    });

    it('returns the response object reference unchanged', async () => {
      const fixture = sipCallFixture();
      http.get.mockResolvedValue(fixture);

      const result = await sipCalls.retrieve(fixture.id);

      expect(result).toBe(fixture);
    });

    it('propagates errors from the http layer', async () => {
      http.get.mockRejectedValue(new Error('Network error'));

      await expect(sipCalls.retrieve('cs_01J5ABCDEFGHJKMNPQRSTVWXYZ')).rejects.toThrow(
        'Network error'
      );
    });
  });
});
