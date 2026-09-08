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
  accountId: 'acc_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  name: 'Support Line',
  number: '+18005550199',
  location: {
    id: 'loc_01J5ABCDEFGHJKMNPQRSTVWXYZ',
    name: 'United States',
    regionCode: 'US-NY',
    countryCode: 'US',
    countryName: 'United States',
  },
  voiceApp: { id: 'va_01J5ABCDEFGHJKMNPQRSTVWXYZ', name: 'Support Voice App' },
  sipTrunk: { id: 'st_01J5ABCDEFGHJKMNPQRSTVWXYZ', name: 'Primary Trunk' },
  ...overrides,
});

export const virtualNumberUnassignedFixture = (
  overrides: Partial<VirtualNumberResponse> = {}
): VirtualNumberResponse =>
  virtualNumberFixture({
    voiceApp: undefined,
    sipTrunk: undefined,
    ...overrides,
  });

export const virtualNumberListFixture = (
  overrides: Partial<CursorResponse<VirtualNumberResponse>> = {}
): CursorResponse<VirtualNumberResponse> => ({
  data: [
    virtualNumberFixture({ id: 'vn_01J5AAAAAAAAAAAAAAAAAAAAAA', number: '+18005550101' }),
    virtualNumberFixture({ id: 'vn_01J5BBBBBBBBBBBBBBBBBBBBBB', number: '+18005550102' }),
  ],
  nextCursor: 'eyJpZCI6InZuXzAxSjVBQUFBQUFBQUFBQUFBQUFBQUFBQUEifQ',
  previousCursor: null,
  hasMore: true,
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
  vnIds: ['vn_01J5AAAAAAAAAAAAAAAAAAAAAA'],
  applyToAll: false,
  voiceAppId: 'va_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  sipTrunkId: undefined,
  ...overrides,
});

export const assignToTrunkPayloadFixture = (
  overrides: Partial<AssignVirtualNumberPayload> = {}
): AssignVirtualNumberPayload => ({
  vnIds: ['vn_01J5AAAAAAAAAAAAAAAAAAAAAA'],
  applyToAll: false,
  sipTrunkId: 'st_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  voiceAppId: undefined,
  ...overrides,
});

export const assignAllPayloadFixture = (
  overrides: Partial<AssignVirtualNumberPayload> = {}
): AssignVirtualNumberPayload => ({
  applyToAll: true,
  voiceAppId: 'va_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  ...overrides,
});

export const unassignVirtualNumberPayloadFixture = (
  overrides: Partial<UnassignVirtualNumberPayload> = {}
): UnassignVirtualNumberPayload => ({
  vnIds: ['vn_01J5AAAAAAAAAAAAAAAAAAAAAA'],
  applyToAll: false,
  ...overrides,
});

export const unassignAllPayloadFixture = (
  overrides: Partial<UnassignVirtualNumberPayload> = {}
): UnassignVirtualNumberPayload => ({
  applyToAll: true,
  ...overrides,
});

export const virtualNumberFiltersFixture = (
  overrides: Partial<VirtualNumberFilters> = {}
): VirtualNumberFilters => ({
  search: 'Support',
  location: ['US'],
  limit: 15,
  cursorAfter: 'eyJpZCI6InZuXzAxSjVBQUFBQUFBQUFBQUFBQUFBQUFBQUEifQ',
  cursorBefore: 'eyJpZCI6InZuXzAxSjVCQkJCQkJCQkJCQkJCQkJCQkJCQkJCIn0',
  ...overrides,
});
