import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { createTestClient } from '@test/support/client';
import { server } from '@test/msw/server';
import { TEST_CONFIG } from '@test/support/env';
import { InternalServerErrorException } from '@/exceptions';

describe('Recordings API (integration)', () => {
  it('returns a Readable stream, not JSON-parsed data', async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/recordings`, () => {
        return new HttpResponse('RIFF....WAVEfmt ', {
          status: 200,
          headers: { 'Content-Type': 'audio/wav' },
        });
      })
    );
    const client = createTestClient();
    const result = await client.recordings.retrieve({
      recording_id: 'rec_01J5ABCDEFGHJKMNPQRSTVWXYZ',
    });

    expect(typeof (result as any).pipe).toBe('function');
    expect(typeof (result as any).on).toBe('function');
  });

  it('follows the 307 redirect to the signed URL and streams the final response', async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/recordings`, () => {
        return HttpResponse.redirect('https://s3.example.com/signed-audio-url', 307);
      }),
      http.get('https://s3.example.com/signed-audio-url', () => {
        return new HttpResponse('RIFF....WAVEfmt ', {
          status: 200,
          headers: { 'Content-Type': 'audio/wav' },
        });
      })
    );
    const client = createTestClient();
    const result = await client.recordings.retrieve({
      recording_id: 'rec_01J5ABCDEFGHJKMNPQRSTVWXYZ',
    });

    expect(typeof (result as any).pipe).toBe('function');
});

  it('sends recording_id and expires_in query params correctly', async () => {
    const captured: {url: URL | null} = {url: null};
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/recordings`, ({ request }) => {
        captured.url = new URL(request.url);
        return new HttpResponse('RIFF....WAVEfmt ', {
          status: 200,
          headers: { 'Content-Type': 'audio/wav' },
        });
      })
    );
    const client = createTestClient();
    await client.recordings.retrieve({
      recording_id: 'rec_01J5ABCDEFGHJKMNPQRSTVWXYZ',
      expires_in: 1800,
    });
    expect(captured.url?.searchParams.get('recording_id')).toBe('rec_01J5ABCDEFGHJKMNPQRSTVWXYZ');
    expect(captured.url?.searchParams.get('expires_in')).toBe('1800');
  });

  // --- Error Contract Tests ---

  it('propagates 403 Forbidden error when recording does not belong to account', async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/recordings`, () =>
        HttpResponse.json(
          {
            message: 'Request failed with status code 403',
            error: {
              name: 'ForbiddenException',
              code: 403,
              param: '',
              details: 'Request failed with status code 403',
            },
          },
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
      message: 'Request failed with status code 403',
    });
  });

  it('propagates 500 Internal Server Error', async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/recordings`, () =>
        HttpResponse.json(
          {
            message: 'Internal error',
            error: { name: 'InternalServerErrorException', code: 500, param: '', details: 'Internal error' },
          },
          { status: 500 }
        )
      )
    );
    const client = createTestClient();
    await expect(
      client.recordings.retrieve({ recording_id: 'rec_broken' })
    ).rejects.toThrow(InternalServerErrorException);
  });
});