import type { RecordingParams } from '@/types/core';

export const recordingParamsFixture = (
  overrides: Partial<RecordingParams> = {}
): RecordingParams => ({
  recording_id: 'rec_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  expires_in: 900,
  ...overrides,
});
