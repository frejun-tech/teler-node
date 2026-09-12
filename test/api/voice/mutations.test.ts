import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { createTestClient } from '@test/support/client';
import { server } from '@test/msw/server';
import { TEST_CONFIG } from '@test/support/env';
import {
  InternalServerErrorException,
} from '@/exceptions';

describe('Voice Mutations API (integration)', () => {
  it('hangs up a call through the real http stack', async () => {
    const client = createTestClient();
    const result = await client.voice.mutations.hangup('cs_01J5ABCDEFGHJKMNPQRSTVWXYZ', {
      legId: 'cl_01J5ABCDEFGHJKMNPQRSTVWXYZ',
      reason: 'normal_clearing',
    });
    expect(result.requestId).toMatch(/^req_/);
    expect(result.playbackId).toBeDefined();
  });

  it('mutes a call leg through the real http stack', async () => {
    const client = createTestClient();
    const result = await client.voice.mutations.mute('cs_01J5ABCDEFGHJKMNPQRSTVWXYZ', {
      legId: 'cl_01J5ABCDEFGHJKMNPQRSTVWXYZ',
      on: true,
    });
    expect(result.requestId).toMatch(/^req_/);
  });

  it('sends DTMF tones through the real http stack', async () => {
    const client = createTestClient();
    const result = await client.voice.mutations.dtmf('cs_01J5ABCDEFGHJKMNPQRSTVWXYZ', {
      legId: 'cl_01J5ABCDEFGHJKMNPQRSTVWXYZ',
      digits: '1234#',
      durationMs: 200,
    });
    expect(result.requestId).toMatch(/^req_/);
  });

  it('plays audio through the real http stack', async () => {
    const client = createTestClient();
    const result = await client.voice.mutations.play('cs_01J5ABCDEFGHJKMNPQRSTVWXYZ', {
      legId: 'cl_01J5ABCDEFGHJKMNPQRSTVWXYZ',
      mediaUrl: 'https://example.com/audio.mp3',
    });
    expect(result.requestId).toMatch(/^req_/);
  });

  it('sends custom Idempotency-Key header when provided', async () => {
    const captured: { headers: Headers | null } = { headers: null };
    server.use(
      http.post(`${TEST_CONFIG.baseUrl}/voice/calls/:id/hangup`, ({ request }) => {
        captured.headers = request.headers;
        return HttpResponse.json({ requestId: 'req_123', playbackId: 'pb_123' }, { status: 202 });
      })
    );
    const client = createTestClient();
    await client.voice.mutations.hangup(
      'cs_01J5ABCDEFGHJKMNPQRSTVWXYZ',
      {},
      'my_custom_idempotency_key'
    );
    expect(captured.headers?.get('Idempotency-Key')).toBe('my_custom_idempotency_key');
  });

  // --- Error Contract Tests ---

  it('propagates 403 Forbidden error', async () => {
    server.use(
      http.post(`${TEST_CONFIG.baseUrl}/voice/calls/:id/hangup`, () =>
        HttpResponse.json(
          { success: false, message: 'Invalid API Key.' },
          { status: 403 }
        )
      )
    );
    const client = createTestClient();
    await expect(client.voice.mutations.hangup('cs_123', {})).rejects.toMatchObject({
      name: 'ForbiddenException',
      status: 403,
      message: 'Invalid API Key.',
    });
  });

  it('propagates 404 Not Found error', async () => {
    server.use(
      http.post(`${TEST_CONFIG.baseUrl}/voice/calls/:id/mute`, () =>
        HttpResponse.json(
          { success: false, message: 'The requested call was not found.' },
          { status: 404 }
        )
      )
    );
    const client = createTestClient();
    await expect(
      client.voice.mutations.mute('cs_missing', { legId: 'cl_123', on: true })
    ).rejects.toMatchObject({
      name: 'NotFoundException',
      status: 404,
      message: 'The requested call was not found.',
    });
  });

  it('propagates 409 Conflict error when call is not in a controllable state', async () => {
    server.use(
      http.post(`${TEST_CONFIG.baseUrl}/voice/calls/:id/hangup`, () =>
        HttpResponse.json(
          {
            success: false,
            message: 'The call is not in a state that accepts controls.',
            code: 'call_not_live',
            type: 'invalid_state',
          },
          { status: 409 }
        )
      )
    );
    const client = createTestClient();
    await expect(client.voice.mutations.hangup('cs_ended', {})).rejects.toMatchObject({
      name: 'ConflictException',
      status: 409,
    });
  });

  it('propagates 500 Internal Server Error', async () => {
    server.use(
      http.post(`${TEST_CONFIG.baseUrl}/voice/calls/:id/dtmf`, () =>
        HttpResponse.json({ success: false, message: 'Internal error' }, { status: 500 })
      )
    );
    const client = createTestClient();
    await expect(
      client.voice.mutations.dtmf('cs_broken', { digits: '1' })
    ).rejects.toThrow(InternalServerErrorException);
  });

  it('call-control mutations retry with 300ms base delay and jitter on 503', async () => {
    let attempts = 0;
    const startTime = Date.now();
    server.use(
      http.post(`${TEST_CONFIG.baseUrl}/voice/calls/:id/hangup`, () => {
        attempts++;
        if (attempts < 2) {
          return HttpResponse.json({ message: 'unavailable' }, { status: 503 });
        }
        return HttpResponse.json({ requestId: 'req_123', playbackId: 'pb_123' }, { status: 202 });
      })
    );
    const client = createTestClient();

    const result = await client.voice.mutations.hangup('cs_123', {}, undefined, true);
    const duration = Date.now() - startTime;

    expect(attempts).toBe(2);
    expect(result.requestId).toBe('req_123');
    expect(duration).toBeLessThan(500);
  });
});

