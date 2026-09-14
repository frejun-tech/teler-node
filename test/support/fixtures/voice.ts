import {
  type CreateVoiceAppPayload,
  type UpdateVoiceAppPayload,
  type VoiceAppResponse,
  type VoiceAppFilters,
  type CreateCallPayload,
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
import { Status } from '@/types/common';

// Voice Apps

export const voiceAppFixture = (
  overrides: Partial<VoiceAppResponse> = {}
): VoiceAppResponse => ({
  id: 'va_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  accountId: 'acc_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  name: 'Customer Support App',
  flowUrl: 'https://example.com/flow',
  webhookUrl: 'https://example.com/webhook',
  fallbackUrl: 'https://example.com/fallback',
  status: Status.ACTIVE,
  channelLimit: 50,
  vnCount: 2,
  secretId: 'sk_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  secretName: 'App Secret',
  webhookApiVersion: '2026-06-01',
  ...overrides,
});

export const voiceAppListFixture = (
  overrides: Partial<CursorResponse<VoiceAppResponse>> = {}
): CursorResponse<VoiceAppResponse> => ({
  data: [
    voiceAppFixture({ id: 'va_01J5AAAAAAAAAAAAAAAAAAAAAA', name: 'App One' }),
    voiceAppFixture({ id: 'va_01J5BBBBBBBBBBBBBBBBBBBBBB', name: 'App Two' }),
  ],
  nextCursor: 'eyJpZCI6InZhXzAxSjVBQUFBQUFBQUFBQUFBQUFBQUFBQUEifQ',
  previousCursor: null,
  hasMore: true,
  ...overrides,
});

export const createVoiceAppPayloadFixture = (
  overrides: Partial<CreateVoiceAppPayload> = {}
): CreateVoiceAppPayload => ({
  name: 'Customer Support App',
  flowUrl: 'https://example.com/flow',
  webhookUrl: 'https://example.com/webhook',
  fallbackUrl: 'https://example.com/fallback',
  vnIds: ['vn_01J5ABCDEFGHJKMNPQRSTVWXYZ'],
  secretId: 'sk_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  webhookApiVersion: '2026-06-01',
  ...overrides,
});

export const updateVoiceAppPayloadFixture = (
  overrides: Partial<UpdateVoiceAppPayload> = {}
): UpdateVoiceAppPayload => ({
  name: 'Updated App Name',
  status: Status.ACTIVE,
  flowUrl: 'https://example.com/new-flow',
  webhookUrl: 'https://example.com/new-webhook',
  fallbackUrl: 'https://example.com/new-fallback',
  channelLimit: 100,
  secretId: 'sk_01J5BBBBBBBBBBBBBBBBBBBBBB',
  webhookApiVersion: '2026-06-01',
  ...overrides,
});

export const voiceAppFiltersFixture = (
  overrides: Partial<VoiceAppFilters> = {}
): VoiceAppFilters => ({
  search: 'Support',
  status: [Status.ACTIVE],
  limit: 10,
  cursorAfter: 'eyJpZCI6InZhXzAxSjVBQUFBQUFBQUFBQUFBQUFBQUFBQUEifQ',
  cursorBefore: 'eyJpZCI6InZhXzAxSjVCQkJCQkJCQkJCQkJCQkJCQkJCQkJCIn0',
  ...overrides,
});

// Voice Calls

export const CreateCallPayloadFixture = (
  overrides: Partial<CreateCallPayload> = {}
): CreateCallPayload => ({
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
    fromNumber: '+18005550100',
    toNumber: '+18005550200',
    statusCallbackUrl: 'https://example.com/status',
    record: true,
  },
  ...overrides,
});

export const voiceCallLegFixture = (
  overrides: Partial<VoiceCallLegResponse> = {}
): VoiceCallLegResponse => ({
  id: 'cl_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  callSessionId: 'cs_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  direction: 'outbound',
  role: 'primary',
  state: 'answered',
  fromNumber: '+18005550100',
  toNumber: '+18005550200',
  parentLegId: '',
  recordings: ['rec_01J5ABCDEFGHJKMNPQRSTVWXYZ'],
  createdAt: '2026-08-14T00:00:00.000Z',
  answeredAt: '2026-08-14T00:00:02.000Z',
  endedAt: '2026-08-14T00:01:00.000Z',
  reason: 'normal_clearing',
  endedBy: 'caller',
  ...overrides,
});

export const voiceCallLegListFixture = (
  overrides: Partial<CursorResponse<VoiceCallLegResponse>> = {}
): CursorResponse<VoiceCallLegResponse> => ({
  data: [
    voiceCallLegFixture({ id: 'cl_01J5AAAAAAAAAAAAAAAAAAAAAA' }),
    voiceCallLegFixture({ id: 'cl_01J5BBBBBBBBBBBBBBBBBBBBBB', role: 'dial_target' }),
  ],
  nextCursor: null,
  previousCursor: null,
  hasMore: false,
  ...overrides,
});

export const voiceCallFixture = (
  overrides: Partial<VoiceCallResponse> = {}
): VoiceCallResponse => ({
  id: 'cs_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  accountId: 'acc_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  voiceAppId: 'va_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  state: 'completed',
  direction: 'outbound',
  fromNumber: '+18005550100',
  toNumber: '+18005550200',
  properties: { custom_tag: 'test' },
  createdAt: '2026-08-14T00:00:00.000Z',
  answeredAt: '2026-08-14T00:00:02.000Z',
  endedAt: '2026-08-14T00:01:00.000Z',
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
  nextCursor: 'eyJpZCI6ImNzXzAxSjVBQUFBQUFBQUFBQUFBQUFBQUFBQUEifQ',
  previousCursor: null,
  hasMore: true,
  ...overrides,
});

export const voiceCallFiltersFixture = (
  overrides: Partial<VoiceCallFilters> = {}
): VoiceCallFilters => ({
  state: 'completed',
  fromNumber: '+18005550100',
  toNumber: '+18005550200',
  createdAfter: '2026-08-01T00:00:00.000Z',
  createdBefore: '2026-08-14T23:59:59.000Z',
  limit: 10,
  cursorAfter: 'eyJpZCI6ImNzXzAxSjVBQUFBQUFBQUFBQUFBQUFBQUFBQUEifQ',
  cursorBefore: 'eyJpZCI6ImNzXzAxSjVCQkJCQkJCQkJCQkJCQkJCQkJCQkJCIn0',
  ...overrides,
});

// Mutations & Operations

export const hangupPayloadFixture = (
  overrides: Partial<HangupPayload> = {}
): HangupPayload => ({
  legId: 'cl_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  reason: 'normal_clearing',
  ...overrides,
});

export const mutePayloadFixture = (
  overrides: Partial<MutePayload> = {}
): MutePayload => ({
  legId: 'cl_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  on: true,
  ...overrides,
});

export const dtmfPayloadFixture = (
  overrides: Partial<DTMFPayload> = {}
): DTMFPayload => ({
  legId: 'cl_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  digits: '1234#',
  durationMs: 250,
  ...overrides,
});

export const playPayloadFixture = (
  overrides: Partial<PlayPayload> = {}
): PlayPayload => ({
  legId: 'cl_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  mediaUrl: 'https://example.com/audio.mp3',
  loop: 1,
  onDtmf: 'stop',
  ...overrides,
});

export const mutationResponseFixture = (
  overrides: Partial<MutationResponse> = {}
): MutationResponse => ({
  requestId: 'req_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  playbackId: 'pb_01J5ABCDEFGHJKMNPQRSTVWXYZ',
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
  callId: 'cs_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  status: 'initiated',
  targetLegId: 'cl_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  mode: 'cold',
  requestId: 'req_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  ...overrides,
});
