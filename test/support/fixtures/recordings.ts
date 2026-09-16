import type { RecordingParams } from "@/types/core";

export const recordingParamsFixture = (
  overrides: Partial<RecordingParams> = {}
): RecordingParams => ({
  recordingId: "rec_01J5ABCDEFGHJKMNPQRSTVWXYZ",
  expiresIn: 900,
  ...overrides
});
