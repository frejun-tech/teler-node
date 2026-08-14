import {
  type CreateVoiceAppPayload,
  type UpdateVoiceAppPayload,
  type VoiceAppResponse,
  type VoiceAppFilters,
  type CreateCallParams,
  type CallResponse,
  type VoiceCallResponse,
  type VoiceCallLegResponse,
  type VoiceCallFilters,
  type HangupPayload,
  type MutePayload,
  type DTMFPayload,
  type PlayPayload,
  type MutationResponse,
  type TransferPayload,
  type TransferResponse,
} from '@/types/voice';
import type { CursorResponse } from '@/types/common';
import { Status } from '@/types/core';

// Voice Apps

export const voiceAppFixture = (
  overrides: Partial<VoiceAppResponse> = {}
): VoiceAppResponse => ({
  id: 'va_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  account_id: 'acc_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  name: 'Customer Support App',
  flow_url: 'https://example.com/flow',
  webhook_url: 'https://example.com/webhook',
  fallback_url: 'https://example.com/fallback',
  status: Status.ACTIVE,
  channel_limit: 50,
  vn_count: 2,
  secret_id: 'sk_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  secret_name: 'App Secret',
  webhook_api_version: '2026-06-01',
  ...overrides,
});

export const voiceAppListFixture = (
  overrides: Partial<CursorResponse<VoiceAppResponse>> = {}
): CursorResponse<VoiceAppResponse> => ({
  data: [
    voiceAppFixture({ id: 'va_01J5AAAAAAAAAAAAAAAAAAAAAA', name: 'App One' }),
    voiceAppFixture({ id: 'va_01J5BBBBBBBBBBBBBBBBBBBBBB', name: 'App Two' }),
  ],
  next_cursor: 'eyJpZCI6InZhXzAxSjVBQUFBQUFBQUFBQUFBQUFBQUFBQUEifQ',
  previous_cursor: null,
  has_more: true,
  ...overrides,
});

export const createVoiceAppPayloadFixture = (
  overrides: Partial<CreateVoiceAppPayload> = {}
): CreateVoiceAppPayload => ({
  name: 'Customer Support App',
  flow_url: 'https://example.com/flow',
  webhook_url: 'https://example.com/webhook',
  fallback_url: 'https://example.com/fallback',
  vn_ids: ['vn_01J5ABCDEFGHJKMNPQRSTVWXYZ'],
  secret_id: 'sk_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  webhook_api_version: '2026-06-01',
  ...overrides,
});

export const updateVoiceAppPayloadFixture = (
  overrides: Partial<UpdateVoiceAppPayload> = {}
): UpdateVoiceAppPayload => ({
  name: 'Updated App Name',
  status: Status.ACTIVE,
  flow_url: 'https://example.com/new-flow',
  webhook_url: 'https://example.com/new-webhook',
  fallback_url: 'https://example.com/new-fallback',
  channel_limit: 100,
  secret_id: 'sk_01J5BBBBBBBBBBBBBBBBBBBBBB',
  webhook_api_version: '2026-06-01',
  ...overrides,
});

export const voiceAppFiltersFixture = (
  overrides: Partial<VoiceAppFilters> = {}
): VoiceAppFilters => ({
  search: 'Support',
  status: [Status.ACTIVE],
  limit: 10,
  cursor_after: 'eyJpZCI6InZhXzAxSjVBQUFBQUFBQUFBQUFBQUFBQUFBQUEifQ',
  cursor_before: 'eyJpZCI6InZhXzAxSjVCQkJCQkJCQkJCQkJCQkJCQkJCQkJCIn0',
  ...overrides,
});

// Voice Calls

export const createCallParamsFixture = (
  overrides: Partial<CreateCallParams> = {}
): CreateCallParams => ({
  fromNumber: '+18005550100',
  toNumber: '+18005550200',
  flowUrl: 'https://example.com/flow',
  statusCallbackUrl: 'https://example.com/status',
  record: true,
  ...overrides,
});

export const callResponseFixture = (
  overrides: Partial<CallResponse> = {}
): CallResponse => ({
  message: 'The call was accepted and is being placed.',
  data: {
    id: 'cs_01J5ABCDEFGHJKMNPQRSTVWXYZ',
    from_number: '+18005550100',
    to_number: '+18005550200',
    status_callback_url: 'https://example.com/status',
    record: true,
  },
  ...overrides,
});

export const voiceCallLegFixture = (
  overrides: Partial<VoiceCallLegResponse> = {}
): VoiceCallLegResponse => ({
  id: 'cl_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  call_session_id: 'cs_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  direction: 'outbound',
  role: 'primary',
  state: 'answered',
  from_number: '+18005550100',
  to_number: '+18005550200',
  parent_leg_id: '',
  recordings: ['rec_01J5ABCDEFGHJKMNPQRSTVWXYZ'],
  created_at: '2026-08-14T00:00:00.000Z',
  answered_at: '2026-08-14T00:00:02.000Z',
  ended_at: '2026-08-14T00:01:00.000Z',
  reason: 'normal_clearing',
  ended_by: 'caller',
  ...overrides,
});

export const voiceCallLegListFixture = (
  overrides: Partial<CursorResponse<VoiceCallLegResponse>> = {}
): CursorResponse<VoiceCallLegResponse> => ({
  data: [
    voiceCallLegFixture({ id: 'cl_01J5AAAAAAAAAAAAAAAAAAAAAA' }),
    voiceCallLegFixture({ id: 'cl_01J5BBBBBBBBBBBBBBBBBBBBBB', role: 'dial_target' }),
  ],
  next_cursor: null,
  previous_cursor: null,
  has_more: false,
  ...overrides,
});

export const voiceCallFixture = (
  overrides: Partial<VoiceCallResponse> = {}
): VoiceCallResponse => ({
  id: 'cs_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  account_id: 'acc_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  voice_app_id: 'va_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  state: 'completed',
  direction: 'outbound',
  from_number: '+18005550100',
  to_number: '+18005550200',
  properties: { custom_tag: 'test' },
  created_at: '2026-08-14T00:00:00.000Z',
  answered_at: '2026-08-14T00:00:02.000Z',
  ended_at: '2026-08-14T00:01:00.000Z',
  reason: 'normal_clearing',
  legs: [voiceCallLegFixture()],
  ...overrides,
});

export const voiceCallListFixture = (
  overrides: Partial<CursorResponse<VoiceCallResponse>> = {}
): CursorResponse<VoiceCallResponse> => ({
  data: [
    voiceCallFixture({ id: 'cs_01J5AAAAAAAAAAAAAAAAAAAAAA' }),
    voiceCallFixture({ id: 'cs_01J5BBBBBBBBBBBBBBBBBBBBBB', state: 'ringing' }),
  ],
  next_cursor: 'eyJpZCI6ImNzXzAxSjVBQUFBQUFBQUFBQUFBQUFBQUFBQUEifQ',
  previous_cursor: null,
  has_more: true,
  ...overrides,
});

export const voiceCallFiltersFixture = (
  overrides: Partial<VoiceCallFilters> = {}
): VoiceCallFilters => ({
  state: 'completed',
  from_number: '+18005550100',
  to_number: '+18005550200',
  created_after: '2026-08-01T00:00:00.000Z',
  created_before: '2026-08-14T23:59:59.000Z',
  limit: 10,
  cursor_after: 'eyJpZCI6ImNzXzAxSjVBQUFBQUFBQUFBQUFBQUFBQUFBQUEifQ',
  cursor_before: 'eyJpZCI6ImNzXzAxSjVCQkJCQkJCQkJCQkJCQkJCQkJCQkJCIn0',
  ...overrides,
});

// Mutations & Operations

export const hangupPayloadFixture = (
  overrides: Partial<HangupPayload> = {}
): HangupPayload => ({
  leg_id: 'cl_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  reason: 'normal_clearing',
  ...overrides,
});

export const mutePayloadFixture = (
  overrides: Partial<MutePayload> = {}
): MutePayload => ({
  leg_id: 'cl_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  on: true,
  ...overrides,
});

export const dtmfPayloadFixture = (
  overrides: Partial<DTMFPayload> = {}
): DTMFPayload => ({
  leg_id: 'cl_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  digits: '1234#',
  duration_ms: 250,
  ...overrides,
});

export const playPayloadFixture = (
  overrides: Partial<PlayPayload> = {}
): PlayPayload => ({
  leg_id: 'cl_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  media_url: 'https://example.com/audio.mp3' as any,
  loop: 1,
  on_dtmf: 'stop',
  ...overrides,
});

export const mutationResponseFixture = (
  overrides: Partial<MutationResponse> = {}
): MutationResponse => ({
  request_id: 'req_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  playback_id: 'pb_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  ...overrides,
});

export const transferPayloadFixture = (
  overrides: Partial<TransferPayload> = {}
): TransferPayload => ({
  target: {
    kind: 'pstn',
    number: '+18005550300',
  },
  mode: 'cold',
  timeout: 30,
  record: true,
  ringback: 'passthrough',
  ...overrides,
});

export const transferResponseFixture = (
  overrides: Partial<TransferResponse> = {}
): TransferResponse => ({
  id: 'tr_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  call_id: 'cs_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  status: 'completed',
  target_leg_id: 'cl_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  mode: 'cold',
  request_id: 'req_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  ...overrides,
});
