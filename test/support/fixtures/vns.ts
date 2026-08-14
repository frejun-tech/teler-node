import type {
  VirtualNumberResponse,
  VirtualNumberFilters,
  UpdateVirtualNumberPayload,
  AssignVirtualNumberPayload,
  UnassignVirtualNumberPayload,
} from '@/types/core';
import type { CursorResponse } from '@/types/common';

export const virtualNumberFixture = (
  overrides: Partial<VirtualNumberResponse> = {}
): VirtualNumberResponse => ({
  id: 'vn_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  account_id: 'acc_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  name: 'Support Line',
  number: '+18005550199',
  location: {
    id: 'loc_01J5ABCDEFGHJKMNPQRSTVWXYZ',
    name: 'United States',
    region_code: 'US-NY',
    country_code: 'US',
    country_name: 'United States',
  },
  voice_app: { id: 'va_01J5ABCDEFGHJKMNPQRSTVWXYZ', name: 'Support Voice App' },
  sip_trunk: { id: 'st_01J5ABCDEFGHJKMNPQRSTVWXYZ', name: 'Primary Trunk' },
  ...overrides,
});

export const virtualNumberUnassignedFixture = (
  overrides: Partial<VirtualNumberResponse> = {}
): VirtualNumberResponse =>
  virtualNumberFixture({
    voice_app: undefined,
    sip_trunk: undefined,
    ...overrides,
  });

export const virtualNumberListFixture = (
  overrides: Partial<CursorResponse<VirtualNumberResponse>> = {}
): CursorResponse<VirtualNumberResponse> => ({
  data: [
    virtualNumberFixture({ id: 'vn_01J5AAAAAAAAAAAAAAAAAAAAAA', number: '+18005550101' }),
    virtualNumberFixture({ id: 'vn_01J5BBBBBBBBBBBBBBBBBBBBBB', number: '+18005550102' }),
  ],
  next_cursor: 'eyJpZCI6InZuXzAxSjVBQUFBQUFBQUFBQUFBQUFBQUFBQUEifQ',
  previous_cursor: null,
  has_more: true,
  ...overrides,
});

export const updateVirtualNumberPayloadFixture = (
  overrides: Partial<UpdateVirtualNumberPayload> = {}
): UpdateVirtualNumberPayload => ({
  name: 'Updated Support Line',
  ...overrides,
});

export const assignVirtualNumberPayloadFixture = (
  overrides: Partial<AssignVirtualNumberPayload> = {}
): AssignVirtualNumberPayload => ({
  vn_ids: ['vn_01J5AAAAAAAAAAAAAAAAAAAAAA'],
  apply_to_all: false,
  voice_app_id: 'va_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  sip_trunk_id: undefined,
  ...overrides,
});

export const assignToTrunkPayloadFixture = (
  overrides: Partial<AssignVirtualNumberPayload> = {}
): AssignVirtualNumberPayload => ({
  vn_ids: ['vn_01J5AAAAAAAAAAAAAAAAAAAAAA'],
  apply_to_all: false,
  sip_trunk_id: 'st_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  voice_app_id: undefined,
  ...overrides,
});

export const assignAllPayloadFixture = (
  overrides: Partial<AssignVirtualNumberPayload> = {}
): AssignVirtualNumberPayload => ({
  apply_to_all: true,
  voice_app_id: 'va_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  ...overrides,
});

export const unassignVirtualNumberPayloadFixture = (
  overrides: Partial<UnassignVirtualNumberPayload> = {}
): UnassignVirtualNumberPayload => ({
  vn_ids: ['vn_01J5AAAAAAAAAAAAAAAAAAAAAA'],
  apply_to_all: false,
  ...overrides,
});

export const unassignAllPayloadFixture = (
  overrides: Partial<UnassignVirtualNumberPayload> = {}
): UnassignVirtualNumberPayload => ({
  apply_to_all: true,
  ...overrides,
});

export const virtualNumberFiltersFixture = (
  overrides: Partial<VirtualNumberFilters> = {}
): VirtualNumberFilters => ({
  search: 'Support',
  location: ['US'],
  limit: 15,
  cursor_after: 'eyJpZCI6InZuXzAxSjVBQUFBQUFBQUFBQUFBQUFBQUFBQUEifQ',
  cursor_before: 'eyJpZCI6InZuXzAxSjVCQkJCQkJCQkJCQkJCQkJCQkJCQkJCIn0',
  ...overrides,
});
