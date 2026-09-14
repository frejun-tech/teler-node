import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { createTestClient } from '@test/support/client';
import { server } from '@test/msw/server';
import { TEST_CONFIG } from '@test/support/env';
import {
  BadParametersException,
  GoneException,
  InternalServerErrorException,
} from '@/exceptions';

describe('Voice Operations API (integration)', () => {
  it('transfers a call through the real http stack', async () => {
    const client = createTestClient();
    const result = await client.voice.operations.transfer('cs_01J5ABCDEFGHJKMNPQRSTVWXYZ', {
      target: {
        kind: 'pstn',
        number: '+18005550300',
      },
      mode: 'cold',
    });
    expect(result.id).toBeDefined();
    expect(result.callId).toBe('cs_01J5ABCDEFGHJKMNPQRSTVWXYZ');
    expect(result.requestId).toMatch(/^req_/);
  });

  it('sends custom Idempotency-Key header on transfer', async () => {
    const captured: { headers: Headers | null } = { headers: null };
    server.use(
      http.post(`${TEST_CONFIG.baseUrl}/voice/calls/:id/transfer`, ({ request }) => {
        captured.headers = request.headers;
        return HttpResponse.json(
          {
            id: 'tr_123',
            callId: 'cs_123',
            status: 'initiated',
            targetLegId: 'cl_123',
            mode: 'cold',
            requestId: 'req_123',
          },
          { status: 202 }
        );
      })
    );
    const client = createTestClient();
    await client.voice.operations.transfer(
      'cs_01J5ABCDEFGHJKMNPQRSTVWXYZ',
      {
        target: { kind: 'pstn', number: '+18005550300' },
        mode: 'cold',
      },
      'transfer_custom_key'
    );
    expect(captured.headers?.get('Idempotency-Key')).toBe('transfer_custom_key');
  });

  it('round-trips customHeaders through request body without mangling SIP header names', async () => {
    const captured: { body: unknown } = { body: null };
    server.use(
      http.post(`${TEST_CONFIG.baseUrl}/voice/calls/:id/transfer`, async ({ request }) => {
        captured.body = await request.json();
        return HttpResponse.json(
          {
            id: 'tr_123',
            callId: 'cs_123',
            status: 'initiated',
            targetLegId: 'cl_123',
            mode: 'cold',
            requestId: 'req_123',
          },
          { status: 202 }
        );
      })
    );
    const client = createTestClient();
    await client.voice.operations.transfer(
      'cs_01J5ABCDEFGHJKMNPQRSTVWXYZ',
      {
        target: {
          kind: 'pstn',
          number: '+18005550300',
          customHeaders: { 'X-Trace-Id': 'abc123', 'X-Call-Reason': 'sales' }
        },
        mode: 'cold',
      }
    );
    expect(captured.body).toMatchObject({
      target: {
        kind: 'pstn',
        number: '+18005550300',
        custom_headers: {
          'X-Trace-Id': 'abc123',
          'X-Call-Reason': 'sales'
        }
      }
    });
  });

  // --- Error Contract Tests ---

  it('propagates 400 Bad Parameters on invalid transfer target or mode', async () => {
    server.use(
      http.post(`${TEST_CONFIG.baseUrl}/voice/calls/:id/transfer`, () =>
        HttpResponse.json(
          {
            success: false,
            message: 'target.number is required when kind="pstn".',
            code: 'invalid_target',
          },
          { status: 400 }
        )
      )
    );
    const client = createTestClient();
    await expect(
      client.voice.operations.transfer('cs_123', {
        target: { kind: 'pstn', number: '' },
        mode: 'cold',
      })
    ).rejects.toThrow(BadParametersException);
  });

  it('propagates 403 Forbidden error', async () => {
    server.use(
      http.post(`${TEST_CONFIG.baseUrl}/voice/calls/:id/transfer`, () =>
        HttpResponse.json(
          { success: false, message: 'Invalid API Key.' },
          { status: 403 }
        )
      )
    );
    const client = createTestClient();
    await expect(
      client.voice.operations.transfer('cs_123', {
        target: { kind: 'pstn', number: '+18005550300' },
        mode: 'cold',
      })
    ).rejects.toMatchObject({
      name: 'ForbiddenException',
      status: 403,
      message: 'Invalid API Key.',
    });
  });

  it('propagates 404 Not Found error', async () => {
    server.use(
      http.post(`${TEST_CONFIG.baseUrl}/voice/calls/:id/transfer`, () =>
        HttpResponse.json(
          { success: false, message: 'The requested call was not found.' },
          { status: 404 }
        )
      )
    );
    const client = createTestClient();
    await expect(
      client.voice.operations.transfer('cs_missing', {
        target: { kind: 'pstn', number: '+18005550300' },
        mode: 'cold',
      })
    ).rejects.toMatchObject({
      name: 'NotFoundException',
      status: 404,
      message: 'The requested call was not found.',
    });
  });

  it('propagates 409 Conflict error when a transfer is already in progress', async () => {
    server.use(
      http.post(`${TEST_CONFIG.baseUrl}/voice/calls/:id/transfer`, () =>
        HttpResponse.json(
          {
            success: false,
            message: 'A transfer is already in progress for this call.',
            code: 'transfer_in_progress',
            type: 'invalid_state',
          },
          { status: 409 }
        )
      )
    );
    const client = createTestClient();
    await expect(
      client.voice.operations.transfer('cs_transferring', {
        target: { kind: 'pstn', number: '+18005550300' },
        mode: 'cold',
      })
    ).rejects.toMatchObject({
      name: 'ConflictException',
      status: 409,
    });
  });

  it('propagates 410 Gone error when call session has ended', async () => {
    server.use(
      http.post(`${TEST_CONFIG.baseUrl}/voice/calls/:id/transfer`, () =>
        HttpResponse.json(
          {
            success: false,
            message: 'The requested call session has ended or is gone.',
          },
          { status: 410 }
        )
      )
    );
    const client = createTestClient();
    await expect(
      client.voice.operations.transfer('cs_ended', {
        target: { kind: 'pstn', number: '+18005550300' },
        mode: 'cold',
      })
    ).rejects.toThrow(GoneException);
  });

  it('propagates 500 Internal Server Error', async () => {
    server.use(
      http.post(`${TEST_CONFIG.baseUrl}/voice/calls/:id/transfer`, () =>
        HttpResponse.json({ success: false, message: 'Internal error' }, { status: 500 })
      )
    );
    const client = createTestClient();
    await expect(
      client.voice.operations.transfer('cs_broken', {
        target: { kind: 'pstn', number: '+18005550300' },
        mode: 'cold',
      })
    ).rejects.toThrow(InternalServerErrorException);
  });

  it('call-control operations retry with 300ms base delay and jitter on 503', async () => {
    let attempts = 0;
    const startTime = Date.now();
    server.use(
      http.post(`${TEST_CONFIG.baseUrl}/voice/calls/:id/transfer`, () => {
        attempts++;
        if (attempts < 2) {
          return HttpResponse.json({ message: 'unavailable' }, { status: 503 });
        }
        return HttpResponse.json(
          {
            id: 'tr_123',
            callId: 'cs_123',
            status: 'initiated',
            targetLegId: 'cl_123',
            mode: 'cold',
            requestId: 'req_123',
          },
          { status: 202 }
        );
      })
    );
    const client = createTestClient();

    const result = await client.voice.operations.transfer(
      'cs_123',
      { target: { kind: 'pstn', number: '+18005550300' }, mode: 'cold' },
      undefined,
      true
    );
    const duration = Date.now() - startTime;

    expect(attempts).toBe(2);
    expect(result.id).toBe('tr_123');
    expect(duration).toBeLessThan(500);
  });
});

