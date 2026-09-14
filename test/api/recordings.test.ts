import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { createTestClient } from '@test/support/client';
import { server } from '@test/msw/server';
import { TEST_CONFIG } from '@test/support/env';
import { InternalServerErrorException, NotFoundException } from '@/exceptions';

describe('Recordings API (integration)', () => {
  it('returns a Readable stream, not JSON-parsed data', async () => {
    const client = createTestClient();
    const result = await client.recordings.retrieve({
      recordingId: 'rec_01J5ABCDEFGHJKMNPQRSTVWXYZ',
    });

    expect(typeof (result as any).pipe).toBe('function');
    expect(typeof (result as any).on).toBe('function');
  });

  it('follows the 307 redirect to the signed URL and streams the final response', async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/recordings`, () =>
        HttpResponse.redirect('https://s3.example.com/signed-audio-url', 307)
      ),
      http.get('https://s3.example.com/signed-audio-url', () =>
        new HttpResponse('RIFF....WAVEfmt ', {
          status: 200,
          headers: { 'Content-Type': 'audio/wav' },
        })
      )
    );
    const client = createTestClient();
    const result = await client.recordings.retrieve({
      recordingId: 'rec_01J5ABCDEFGHJKMNPQRSTVWXYZ',
    });

    expect(typeof (result as any).pipe).toBe('function');
  });

  it('sends recordingId and expiresIn query params correctly', async () => {
    const captured: { url: URL | null } = { url: null };
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
      recordingId: 'rec_01J5ABCDEFGHJKMNPQRSTVWXYZ',
      expiresIn: 1800,
    });
    expect(captured.url?.searchParams.get('recording_id')).toBe('rec_01J5ABCDEFGHJKMNPQRSTVWXYZ');
    expect(captured.url?.searchParams.get('expires_in')).toBe('1800');
  });

  it('throws NotFoundException when redirect missing Location header', async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/recordings`, () =>
        new HttpResponse(null, { status: 307, headers: {} })
      )
    );
    const client = createTestClient();
    await expect(
      client.recordings.retrieve({ recordingId: 'rec_01J5ABCDEFGHJKMNPQRSTVWXYZ' })
    ).rejects.toThrow(NotFoundException);
  });

  it('propagates 403 Forbidden error when recording does not belong to account', async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/recordings`, () =>
        HttpResponse.json(
          {
            success: false,
            message: 'Recording does not belong to account',
            code: 'ACCESS_FORBIDDEN',
          },
          { status: 403 }
        )
      )
    );
    const client = createTestClient();
    await expect(
      client.recordings.retrieve({ recordingId: 'rec_other_account' })
    ).rejects.toMatchObject({
      name: 'ForbiddenException',
      status: 403,
      message: 'Recording does not belong to account',
      errorCode: 'ACCESS_FORBIDDEN',
    });
  });

  it('propagates 500 Internal Server Error', async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/recordings`, () =>
        HttpResponse.json(
          {
            success: false,
            message: 'Internal server error',
            code: 'INTERNAL_ERROR',
          },
          { status: 500 }
        )
      )
    );
    const client = createTestClient();
    await expect(
      client.recordings.retrieve({ recordingId: 'rec_broken' })
    ).rejects.toMatchObject({
      name: 'InternalServerErrorException',
      status: 500,
      message: 'Internal server error',
      errorCode: 'INTERNAL_ERROR',
    });
  });
});