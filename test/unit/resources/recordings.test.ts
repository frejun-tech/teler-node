import { describe, it, expect, beforeEach } from 'vitest';
import { RecordingResourceManager } from '@/resources/recordings';
import { createMockHttp, asHttp, type MockHttp } from '@test/support/mock-http';
import { recordingParamsFixture } from '@test/support/fixtures/recordings';

describe('RecordingResourceManager (unit)', () => {
  let http: MockHttp;
  let recordings: RecordingResourceManager;

  beforeEach(() => {
    http = createMockHttp();
    recordings = new RecordingResourceManager(asHttp(http));
  });

  describe('retrieve', () => {
    it('gets /recordings with recording params', async () => {
      const params = recordingParamsFixture();
      const fakeStream = {} as any;
      http.get.mockResolvedValue(fakeStream);

      const result = await recordings.retrieve(params);

      expect(http.get).toHaveBeenCalledWith('/recordings', params);
      expect(result).toBe(fakeStream);
    });

    it('handles rec_ prefix in recording_id', async () => {
      const params = recordingParamsFixture({ recording_id: 'rec_01J5ABCDEFGHJKMNPQRSTVWXYZ' });
      http.get.mockResolvedValue({});

      await recordings.retrieve(params);

      expect(http.get).toHaveBeenCalledWith('/recordings', expect.objectContaining({
        recording_id: 'rec_01J5ABCDEFGHJKMNPQRSTVWXYZ',
      }));
    });

    it('propagates errors from the http layer', async () => {
      http.get.mockRejectedValue(new Error('Network error'));

      await expect(recordings.retrieve(recordingParamsFixture())).rejects.toThrow(
        'Network error'
      );
    });
  });
});
