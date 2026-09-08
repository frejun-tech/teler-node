import { describe, it, expect, beforeEach } from 'vitest';
import { OperationResourceManager } from '@/resources/voice/operations';
import { createMockHttp, asHttp, type MockHttp } from '@test/support/mock-http';
import {
  transferPayloadFixture,
  transferResponseFixture,
} from '@test/support/fixtures/voice';

describe('OperationResourceManager (unit)', () => {
  let http: MockHttp;
  let operations: OperationResourceManager;

  beforeEach(() => {
    http = createMockHttp();
    operations = new OperationResourceManager(asHttp(http));
  });

  // --- transfer ---

  describe('transfer', () => {
    it('posts to /voice/calls/:id/transfer with payload and default Idempotency-Key header', async () => {
      const payload = transferPayloadFixture();
      const fixture = transferResponseFixture();
      http.post.mockResolvedValue(fixture);

      const result = await operations.transfer('cs_01J5ABCDEFGHJKMNPQRSTVWXYZ', payload);

      expect(http.post).toHaveBeenCalledWith(
        '/voice/calls/cs_01J5ABCDEFGHJKMNPQRSTVWXYZ/transfer',
        payload,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Idempotency-Key': expect.any(String),
          }),
        })
      );
      expect(result).toEqual(fixture);
    });

    it('passes custom idempotencyKey when provided', async () => {
      const payload = transferPayloadFixture();
      http.post.mockResolvedValue(transferResponseFixture());

      await operations.transfer(
        'cs_01J5ABCDEFGHJKMNPQRSTVWXYZ',
        payload,
        'transfer_idem_123'
      );

      expect(http.post).toHaveBeenCalledWith(
        '/voice/calls/cs_01J5ABCDEFGHJKMNPQRSTVWXYZ/transfer',
        payload,
        expect.objectContaining({
          headers: { 'Idempotency-Key': 'transfer_idem_123' },
        })
      );
    });

    it('passes retry and baseRetryDelayMs through when provided', async () => {
      const payload = transferPayloadFixture();
      http.post.mockResolvedValue(transferResponseFixture());

      await operations.transfer(
        'cs_01J5ABCDEFGHJKMNPQRSTVWXYZ',
        payload,
        'transfer_idem_123',
        true,
        3000
      );

      expect(http.post).toHaveBeenCalledWith(
        '/voice/calls/cs_01J5ABCDEFGHJKMNPQRSTVWXYZ/transfer',
        payload,
        expect.objectContaining({
          headers: { 'Idempotency-Key': 'transfer_idem_123' },
          retry: true,
          baseRetryDelayMs: 3000,
        })
      );
    });

    it('returns a transfer response containing req_ requestId', async () => {
      const fixture = transferResponseFixture();
      http.post.mockResolvedValue(fixture);

      const result = await operations.transfer(
        'cs_01J5ABCDEFGHJKMNPQRSTVWXYZ',
        transferPayloadFixture()
      );

      expect(result.requestId).toMatch(/^req_/);
    });

    it('returns the response object reference unchanged', async () => {
      const fixture = transferResponseFixture();
      http.post.mockResolvedValue(fixture);

      const result = await operations.transfer(
        'cs_01J5ABCDEFGHJKMNPQRSTVWXYZ',
        transferPayloadFixture()
      );

      expect(result).toBe(fixture);
    });

    it('propagates errors from the http layer', async () => {
      http.post.mockRejectedValue(new Error('Network error'));

      await expect(
        operations.transfer('cs_01J5ABCDEFGHJKMNPQRSTVWXYZ', transferPayloadFixture())
      ).rejects.toThrow('Network error');
    });
  });
});