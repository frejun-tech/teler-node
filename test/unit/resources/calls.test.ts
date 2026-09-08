import { describe, it, expect, beforeEach } from 'vitest';
import { CallResourceManager } from '@/resources/calls';
import { createMockHttp, asHttp, type MockHttp } from '@test/support/mock-http';

describe('CallResourceManager (unit) [deprecated]', () => {
  let http: MockHttp;
  let calls: CallResourceManager;

  beforeEach(() => {
    http = createMockHttp();
    calls = new CallResourceManager(asHttp(http));
  });

  it('posts to /voice/calls/initiate with payload', async () => {
    const fixture = { callId: 'cs_123', status: 'initiated' };
    http.post.mockResolvedValue(fixture);

    const result = await calls.create({
      fromNumber: '+18005550100',
      toNumber: '+18005550200',
      flowUrl: 'https://example.com/flow',
      statusCallbackUrl: "https://example.com/webhook"
    });

    expect(http.post).toHaveBeenCalledWith('/voice/calls/initiate', {
        fromNumber: '+18005550100',
        toNumber: '+18005550200',
        flowUrl: 'https://example.com/flow',
        statusCallbackUrl: "https://example.com/webhook",
    });
    expect(result).toEqual(fixture);
});

it('propagates errors from the http layer', async () => {
    http.post.mockRejectedValue(new Error('Network error'));
    
    await expect(
        calls.create({
        fromNumber: '+18005550100',
        toNumber: '+18005550200',
        flowUrl: 'https://example.com/flow',
        statusCallbackUrl: "https://example.com/webhook"
      })
    ).rejects.toThrow('Network error');
  });
});