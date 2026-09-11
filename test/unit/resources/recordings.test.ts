import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RecordingResourceManager } from '@/resources/recordings';
import { createMockHttp, asHttp, type MockHttp } from '@test/support/mock-http';
import { recordingParamsFixture } from '@test/support/fixtures/recordings';
import { NetworkException, NotFoundException } from '@/exceptions';
import axios from 'axios';

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

      http.httpClient.get.mockResolvedValue({
        status: 307,
        data: null,
        headers: { location: signedUrl }
      });

      const mockAxiosClient = {
        get: vi.fn().mockResolvedValue({ data: fakeStream })
      };
      vi.mocked(axios.create).mockReturnValue(mockAxiosClient as any);

      const result = await recordings.retrieve(params);

      expect(result).toBe(fakeStream);
      expect(mockAxiosClient.get).toHaveBeenCalledWith(signedUrl, {
        responseType: 'stream'
      });
    });

    it('throws NotFoundException when redirect missing Location header', async () => {
      http.httpClient.get.mockResolvedValue({
        status: 307,
        data: null,
        headers: {}
      });

      await expect(recordings.retrieve(recordingParamsFixture())).rejects.toThrow(NotFoundException);
    });

    it('propagates NetworkException on http client error', async () => {
      http.httpClient.get.mockRejectedValue(new Error('Connection failed'));
      http.handleAxiosError.mockImplementation(() => {
        throw new NetworkException('Connection failed', undefined, undefined);
      });

      await expect(recordings.retrieve(recordingParamsFixture())).rejects.toThrow(NetworkException);
    });

    it('propagates API errors via throwForStatus', async () => {
      const errorBody = { message: 'Not found', errors: 'Recording not found' };

      http.httpClient.get.mockResolvedValue({
        status: 404,
        data: errorBody,
        headers: {}
      });
      http.throwForStatus.mockImplementation(() => {
        throw new NotFoundException('Not found', 'Recording not found');
      });

      await expect(recordings.retrieve(recordingParamsFixture())).rejects.toThrow(NotFoundException);
    });
  });
});