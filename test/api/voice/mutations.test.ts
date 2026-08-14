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
      leg_id: 'cl_01J5ABCDEFGHJKMNPQRSTVWXYZ',
      reason: 'normal_clearing',
    });
    expect(result.request_id).toMatch(/^req_/);
    expect(result.playback_id).toBeDefined();
  });

  it('mutes a call leg through the real http stack', async () => {
    const client = createTestClient();
    const result = await client.voice.mutations.mute('cs_01J5ABCDEFGHJKMNPQRSTVWXYZ', {
      leg_id: 'cl_01J5ABCDEFGHJKMNPQRSTVWXYZ',
      on: true,
    });
    expect(result.request_id).toMatch(/^req_/);
  });

  it('sends DTMF tones through the real http stack', async () => {
    const client = createTestClient();
    const result = await client.voice.mutations.dtmf('cs_01J5ABCDEFGHJKMNPQRSTVWXYZ', {
      leg_id: 'cl_01J5ABCDEFGHJKMNPQRSTVWXYZ',
      digits: '1234#',
      duration_ms: 200,
    });
    expect(result.request_id).toMatch(/^req_/);
  });

  it('plays audio through the real http stack', async () => {
    const client = createTestClient();
    const result = await client.voice.mutations.play('cs_01J5ABCDEFGHJKMNPQRSTVWXYZ', {
      leg_id: 'cl_01J5ABCDEFGHJKMNPQRSTVWXYZ',
      media_url: 'https://example.com/audio.mp3' as any,
    });
    expect(result.request_id).toMatch(/^req_/);
  });

  it('sends custom Idempotency-Key header when provided', async () => {
    let capturedHeaders: Headers | null = null;
    server.use(
      http.post(`${TEST_CONFIG.baseUrl}/voice/calls/:id/hangup`, ({ request }) => {
        capturedHeaders = request.headers;
        return HttpResponse.json({ request_id: 'req_123', playback_id: 'pb_123' }, { status: 202 });
      })
    );
    const client = createTestClient();
    await client.voice.mutations.hangup(
      'cs_01J5ABCDEFGHJKMNPQRSTVWXYZ',
      {},
      'my_custom_idempotency_key'
    );
    expect(capturedHeaders?.get('Idempotency-Key')).toBe('my_custom_idempotency_key');
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
      code: 403,
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
      client.voice.mutations.mute('cs_missing', { leg_id: 'cl_123', on: true })
    ).rejects.toMatchObject({
      name: 'NotFoundException',
      code: 404,
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
      code: 409,
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
});
