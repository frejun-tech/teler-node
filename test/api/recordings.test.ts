import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { createTestClient } from '@test/support/client';
import { server } from '@test/msw/server';
import { TEST_CONFIG } from '@test/support/env';
import { InternalServerErrorException } from '@/exceptions';

describe('Recordings API (integration)', () => {
  it('retrieves recording stream through the real http stack', async () => {
    const client = createTestClient();
    const result = await client.recordings.retrieve({
      recording_id: 'rec_01J5ABCDEFGHJKMNPQRSTVWXYZ',
      expires_in: 900,
    });
    expect(result).toBeDefined();
  });

  it('sends recording_id and expires_in query params correctly', async () => {
    let capturedUrl: URL | null = null;
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/recordings`, ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json({ url: 'https://storage.example.com/rec.mp3' });
      })
    );
    const client = createTestClient();
    await client.recordings.retrieve({
      recording_id: 'rec_01J5ABCDEFGHJKMNPQRSTVWXYZ',
      expires_in: 1800,
    });
    expect(capturedUrl?.searchParams.get('recording_id')).toBe('rec_01J5ABCDEFGHJKMNPQRSTVWXYZ');
    expect(capturedUrl?.searchParams.get('expires_in')).toBe('1800');
  });

  // --- Error Contract Tests ---

  it('propagates 403 Forbidden error when recording does not belong to account', async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/recordings`, () =>
        HttpResponse.json(
          { success: false, message: 'You do not have permission to access this recording.' },
          { status: 403 }
        )
      )
    );
    const client = createTestClient();
    await expect(
      client.recordings.retrieve({ recording_id: 'rec_other_account' })
    ).rejects.toMatchObject({
      name: 'ForbiddenException',
      code: 403,
      message: 'You do not have permission to access this recording.',
    });
  });

  it('propagates 404 Not Found error when recording audio is not available', async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/recordings`, () =>
        HttpResponse.json(
          { success: false, message: 'The requested recording was not found.' },
          { status: 404 }
        )
      )
    );
    const client = createTestClient();
    await expect(
      client.recordings.retrieve({ recording_id: 'rec_missing' })
    ).rejects.toMatchObject({
      name: 'NotFoundException',
      code: 404,
      message: 'The requested recording was not found.',
    });
  });

  it('propagates 500 Internal Server Error', async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/recordings`, () =>
        HttpResponse.json({ success: false, message: 'Internal error' }, { status: 500 })
      )
    );
    const client = createTestClient();
    await expect(
      client.recordings.retrieve({ recording_id: 'rec_broken' })
    ).rejects.toThrow(InternalServerErrorException);
  });
});
