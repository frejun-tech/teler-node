import type {
  CreateSecretPayload,
  UpdateSecretPayload,
  SecretFilters,
  SecretResponse,
  SecretListResponse,
} from '@/types/secrets';
import type { CursorResponse } from '@/types/common';

export const secretFixture = (
  overrides: Partial<SecretResponse> = {}
): SecretResponse => ({
  id: 'sk_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  name: 'Test Secret',
  secret_value: 'tsk_live_xK9mN2pQ8rVwL4jH7cF',
  rotated_at: null,
  created_at: '2026-08-14T00:00:00.000Z',
  needs_rotation: false,
  voice_apps: [{ id: 'va_01J5ABCDEFGHJKMNPQRSTVWXYZ', name: 'Support Voice App' }],
  sip_trunks: [{ id: 'st_01J5ABCDEFGHJKMNPQRSTVWXYZ', name: 'Primary Trunk' }],
  ...overrides,
});

export const secretRotatedFixture = (
  overrides: Partial<SecretResponse> = {}
): SecretResponse =>
  secretFixture({
    needs_rotation: true,
    rotated_at: '2026-07-01T00:00:00.000Z',
    ...overrides,
  });

export const secretListFixture = (
  overrides: Partial<CursorResponse<SecretListResponse>> = {}
): CursorResponse<SecretListResponse> => ({
  data: [
    { id: 'sk_01J5AAAAAAAAAAAAAAAAAAAAAA', name: 'Secret One' },
    { id: 'sk_01J5BBBBBBBBBBBBBBBBBBBBBB', name: 'Secret Two' },
  ],
  next_cursor: 'eyJpZCI6InNrXzAxSjVBQUFBQUFBQUFBQUFBQUFBQUFBQUEifQ',
  previous_cursor: null,
  has_more: true,
  ...overrides,
});

export const createSecretPayloadFixture = (
  overrides: Partial<CreateSecretPayload> = {}
): CreateSecretPayload => ({
  name: 'New Secret',
  ...overrides,
});

export const updateSecretPayloadFixture = (
  overrides: Partial<UpdateSecretPayload> = {}
): UpdateSecretPayload => ({
  name: 'Updated Secret Name',
  rotate: false,
  ...overrides,
});

export const rotateSecretPayloadFixture = (
  overrides: Partial<UpdateSecretPayload> = {}
): UpdateSecretPayload => ({
  rotate: true,
  ...overrides,
});

export const secretFiltersFixture = (
  overrides: Partial<SecretFilters> = {}
): SecretFilters => ({
  search: 'Test',
  limit: 10,
  cursor_after: 'eyJpZCI6InNrXzAxSjVBQUFBQUFBQUFBQUFBQUFBQUFBQUEifQ',
  cursor_before: 'eyJpZCI6InNrXzAxSjVCQkJCQkJCQkJCQkJCQkJCQkJCQkJCIn0',
  ...overrides,
});
