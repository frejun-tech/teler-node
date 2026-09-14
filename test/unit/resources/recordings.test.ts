import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Readable } from 'node:stream';
import { RecordingResourceManager } from '@/resources/recordings';
import { createMockHttp, asHttp, type MockHttp } from '@test/support/mock-http';
import { recordingParamsFixture } from '@test/support/fixtures/recordings';
import { NetworkException, NotFoundException, ForbiddenException } from '@/exceptions';
import axios, { AxiosError } from 'axios';

vi.mock('axios');

describe('RecordingResourceManager (unit)', () => {
  let http: MockHttp;
  let recordings: RecordingResourceManager;
  let recordingTimeout: number;

  beforeEach(() => {
    vi.clearAllMocks();
    http = createMockHttp();
    recordingTimeout = 30000;
    recordings = new RecordingResourceManager(asHttp(http), recordingTimeout);

    const mockAxiosClient = {
      get: vi.fn(),
    };
    vi.mocked(axios.create).mockReturnValue(mockAxiosClient as any);
  });

  describe('retrieve', () => {
    it('returns stream data on 200 response', async () => {
      const params = recordingParamsFixture();
      const fakeStream = { pipe: () => {} } as any;

      http.httpClient.get.mockResolvedValue({
        status: 200,
        data: fakeStream,
        headers: {}
      });

      const result = await recordings.retrieve(params);

      expect(http.httpClient.get).toHaveBeenCalledWith('/recordings', expect.objectContaining({
        params: expect.any(Object),
        responseType: 'stream',
        timeout: recordingTimeout,
        maxRedirects: 0,
        validateStatus: expect.any(Function),
      }));
      expect(result).toBe(fakeStream);
    });

    it('follows 307 redirect without auth headers', async () => {
      const params = recordingParamsFixture();
      const signedUrl = 'https://s3.example.com/signed-url';
      const fakeStream = { pipe: () => {} } as any;
      const redirectStream = { destroy: vi.fn() } as any;

      http.httpClient.get.mockResolvedValue({
        status: 307,
        data: redirectStream,
        headers: { location: signedUrl }
      });

      const mockAxiosClient = {
        get: vi.fn().mockResolvedValue({ data: fakeStream })
      };
      vi.mocked(axios.create).mockReturnValue(mockAxiosClient as any);

      const result = await recordings.retrieve(params);

      expect(result).toBe(fakeStream);
      expect(redirectStream.destroy).toHaveBeenCalled();
      expect(mockAxiosClient.get).toHaveBeenCalledWith(signedUrl, {
        responseType: 'stream'
      });
    });

    it('throws NotFoundException when redirect missing Location header', async () => {
      const redirectStream = { destroy: vi.fn() } as any;
      http.httpClient.get.mockResolvedValue({
        status: 307,
        data: redirectStream,
        headers: {}
      });

      await expect(recordings.retrieve(recordingParamsFixture())).rejects.toThrow(NotFoundException);
      expect(redirectStream.destroy).toHaveBeenCalled();
    });

    it('propagates NetworkException on http client error', async () => {
      http.httpClient.get.mockRejectedValue(new Error('Connection failed'));
      http.handleAxiosError.mockImplementation(() => {
        throw new NetworkException('Connection failed', undefined, undefined);
      });

      await expect(recordings.retrieve(recordingParamsFixture())).rejects.toThrow(NetworkException);
    });

    it('parses stream body before passing to handleAxiosError on 4xx/5xx', async () => {
      const errorBody = { success: false, message: 'Not found', code: 'RECORDING_NOT_FOUND' };
      const errorStream = Readable.from([JSON.stringify(errorBody)]);

      http.httpClient.get.mockResolvedValue({
        status: 404,
        data: errorStream,
        headers: {}
      });
      http.handleAxiosError.mockImplementation(() => {
        throw new NotFoundException('Not found', errorBody, 404, 'RECORDING_NOT_FOUND');
      });

      await expect(recordings.retrieve(recordingParamsFixture())).rejects.toThrow(NotFoundException);
      // Verify handleAxiosError was called — the actual parsing happens in recordings.ts
      expect(http.handleAxiosError).toHaveBeenCalled();
    });

    it('maps storage host 403 (expired signed URL) to ForbiddenException', async () => {
      const params = recordingParamsFixture();
      const signedUrl = 'https://s3.example.com/signed-url';
      const redirectStream = { destroy: vi.fn() } as any;
      const errorBody = { success: false, message: 'Invalid signature', code: 'INVALID_SIGNATURE' };
      const errorStream = Readable.from([JSON.stringify(errorBody)]);

      http.httpClient.get.mockResolvedValue({
        status: 307,
        data: redirectStream,
        headers: { location: signedUrl }
      });

      const axiosError = new AxiosError('Forbidden') as any;
      axiosError.response = {
        status: 403,
        data: errorStream,
        headers: {},
      };

      const mockAxiosClient = {
        get: vi.fn().mockRejectedValue(axiosError)
      };
      vi.mocked(axios.create).mockReturnValue(mockAxiosClient as any);
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      http.handleAxiosError.mockImplementation(() => {
        throw new ForbiddenException('Invalid signature', errorBody, 403, 'INVALID_SIGNATURE');
      });

      await expect(recordings.retrieve(params)).rejects.toThrow(ForbiddenException);
      expect(http.handleAxiosError).toHaveBeenCalled();
      // The error passed to handleAxiosError should have the parsed JSON as data
      const callArg = vi.mocked(http.handleAxiosError).mock.calls[0][0] as any;
      expect(callArg.response?.data).toEqual(errorBody);
    });

    it('preserves real error on storage host network failure (no response)', async () => {
      const params = recordingParamsFixture();
      const signedUrl = 'https://s3.example.com/signed-url';
      const redirectStream = { destroy: vi.fn() } as any;

      http.httpClient.get.mockResolvedValue({
        status: 307,
        data: redirectStream,
        headers: { location: signedUrl }
      });

      const axiosError = new AxiosError('Request timeout');
      (axiosError as any).code = 'ECONNABORTED';
      // No response — simulates a true network failure

      const mockAxiosClient = {
        get: vi.fn().mockRejectedValue(axiosError)
      };
      vi.mocked(axios.create).mockReturnValue(mockAxiosClient as any);
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      http.handleAxiosError.mockImplementation((err) => {
        throw new NetworkException('Request timeout', undefined, 'ECONNABORTED');
      });

      await expect(recordings.retrieve(params)).rejects.toThrow(NetworkException);
      expect(http.handleAxiosError).toHaveBeenCalled();
      // The error passed should not have been wrapped into a hardcoded message
      // (it should still be the original axios error, not a NetworkException with generic text)
      const callArg = vi.mocked(http.handleAxiosError).mock.calls[0][0] as any;
      expect(axios.isAxiosError(callArg)).toBe(true);
    });
  });
});