import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { createTestClient } from '@test/support/client';
import { server } from '@test/msw/server';
import { TEST_CONFIG } from '@test/support/env';
import {
  BadParametersException,
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
    expect(result.call_id).toBe('cs_01J5ABCDEFGHJKMNPQRSTVWXYZ');
    expect(result.request_id).toMatch(/^req_/);
  });

  it('sends custom Idempotency-Key header on transfer', async () => {
    const captured: { headers: Headers | null } = { headers: null };
    server.use(
      http.post(`${TEST_CONFIG.baseUrl}/voice/calls/:id/transfer`, ({ request }) => {
        captured.headers = request.headers;
        return HttpResponse.json(
          {
            id: 'tr_123',
            call_id: 'cs_123',
            status: 'completed',
            target_leg_id: 'cl_123',
            mode: 'cold',
            request_id: 'req_123',
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
      code: 403,
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
      code: 404,
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
      code: 409,
    });
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
});
