import { AuthenticationType } from '@/types/sip';
import type {
  SipCallResponse,
  SipCallFilters,
  IpAclResponse,
  IpAclListResponse,
  CreateIpAclPayload,
  UpdateIpAclPayload,
  IpAclFilters,
  SipTrunkResponse,
  CreateSipTrunkPayload,
  UpdateSipTrunkPayload,
  SipTrunkFilters,
} from '@/types/sip';
import type { CursorResponse } from '@/types/common';
import { Status } from '@/types/core';

// SIP Calls

export const sipCallFixture = (
  overrides: Partial<SipCallResponse> = {}
): SipCallResponse => ({
  id: 'cs_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  account_id: 'acc_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  sip_trunk_id: 'st_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  state: 'completed',
  direction: 'inbound',
  from_number: '+18005550100',
  to_number: '+18005550200',
  created_at: '2026-08-14T00:00:00.000Z',
  answered_at: '2026-08-14T00:00:02.000Z',
  ended_at: '2026-08-14T00:01:00.000Z',
  duration_seconds: 58,
  reason: 'normal_clearing',
  ended_by: 'caller',
  recordings: ['rec_01J5ABCDEFGHJKMNPQRSTVWXYZ'],
  ...overrides,
});

export const sipCallInProgressFixture = (
  overrides: Partial<SipCallResponse> = {}
): SipCallResponse =>
  sipCallFixture({
    state: 'in_progress',
    answered_at: '2026-08-14T00:00:02.000Z',
    ended_at: null,
    duration_seconds: null,
    reason: null,
    ended_by: null,
    recordings: [],
    ...overrides,
  });

export const sipCallUnansweredFixture = (
  overrides: Partial<SipCallResponse> = {}
): SipCallResponse =>
  sipCallFixture({
    state: 'no_answer',
    answered_at: null,
    ended_at: '2026-08-14T00:00:30.000Z',
    duration_seconds: null,
    reason: 'no_answer',
    ended_by: 'system',
    recordings: [],
    ...overrides,
  });

export const sipCallListFixture = (
  overrides: Partial<CursorResponse<SipCallResponse>> = {}
): CursorResponse<SipCallResponse> => ({
  data: [
    sipCallFixture({ id: 'cs_01J5AAAAAAAAAAAAAAAAAAAAAA' }),
    sipCallFixture({ id: 'cs_01J5BBBBBBBBBBBBBBBBBBBBBB', direction: 'outbound' }),
  ],
  next_cursor: 'eyJpZCI6ImNzXzAxSjVBQUFBQUFBQUFBQUFBQUFBQUFBQUEifQ',
  previous_cursor: null,
  has_more: true,
  ...overrides,
});

export const sipCallFiltersFixture = (
  overrides: Partial<SipCallFilters> = {}
): SipCallFilters => ({
  trunk_id: 'st_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  from_number: '+18005550100',
  to_number: '+18005550200',
  created_after: '2026-08-01T00:00:00.000Z',
  created_before: '2026-08-14T23:59:59.000Z',
  limit: 20,
  cursor_after: 'eyJpZCI6ImNzXzAxSjVBQUFBQUFBQUFBQUFBQUFBQUFBQUEifQ',
  cursor_before: 'eyJpZCI6ImNzXzAxSjVCQkJCQkJCQkJCQkJCQkJCQkJCQkJCIn0',
  ...overrides,
});

// SIP IP ACLs

export const ipAclFixture = (
  overrides: Partial<IpAclResponse> = {}
): IpAclResponse => ({
  id: 'acl_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  name: 'Office IP ACL',
  addresses: [
    { address: '192.168.1.0/24', description: 'Office HQ' },
    { address: '10.0.0.1/32', description: 'VPN Gateway' },
  ],
  trunk_count: 1,
  created_at: '2026-08-14T00:00:00.000Z',
  updated_at: '2026-08-14T00:00:00.000Z',
  ...overrides,
});

export const ipAclUnusedFixture = (
  overrides: Partial<IpAclResponse> = {}
): IpAclResponse =>
  ipAclFixture({
    trunk_count: 0,
    ...overrides,
  });

export const ipAclListFixture = (
  overrides: Partial<CursorResponse<IpAclListResponse>> = {}
): CursorResponse<IpAclListResponse> => ({
  data: [
    {
      id: 'acl_01J5AAAAAAAAAAAAAAAAAAAAAA',
      name: 'ACL 1',
      address_count: 2,
      trunk_count: 1,
      created_at: '2026-08-14T00:00:00.000Z',
    },
    {
      id: 'acl_01J5BBBBBBBBBBBBBBBBBBBBBB',
      name: 'ACL 2',
      address_count: 1,
      trunk_count: 0,
      created_at: '2026-08-13T00:00:00.000Z',
    },
  ],
  next_cursor: 'eyJpZCI6ImFjbF8wMUo1QUFBQUFBQUFBQUFBQUFBQUFBQUFBQSJ9',
  previous_cursor: null,
  has_more: false,
  ...overrides,
});

export const createIpAclPayloadFixture = (
  overrides: Partial<CreateIpAclPayload> = {}
): CreateIpAclPayload => ({
  name: 'Office IP ACL',
  addresses: [
    { address: '192.168.1.0/24', description: 'Office HQ' },
    { address: '10.0.0.1/32', description: 'VPN Gateway' },
  ],
  ...overrides,
});

export const updateIpAclPayloadFixture = (
  overrides: Partial<UpdateIpAclPayload> = {}
): UpdateIpAclPayload => ({
  name: 'Updated Office IP ACL',
  addresses: [{ address: '172.16.0.0/12', description: 'Branch Network' }],
  ...overrides,
});

export const ipAclFiltersFixture = (
  overrides: Partial<IpAclFilters> = {}
): IpAclFilters => ({
  search: 'Office',
  limit: 10,
  cursor_after: 'eyJpZCI6ImFjbF8wMUo1QUFBQUFBQUFBQUFBQUFBQUFBQUFBQSJ9',
  cursor_before: 'eyJpZCI6ImFjbF8wMUo1QkJCQkJCQkJCQkJCQkJCQkJCQkJCQkIifQ',
  ...overrides,
});

// SIP Trunks

export const sipTrunkFixture = (
  overrides: Partial<SipTrunkResponse> = {}
): SipTrunkResponse => ({
  id: 'st_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  account_id: 'acc_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  cps_limit: 10,
  name: 'Primary Trunk',
  domain_name: 'trunk1.pstn.teler.io',
  recording_enabled: false,
  channel_limit: 100,
  secure: true,
  is_active: true,
  authentication_type: AuthenticationType.IP,
  auth_ip_addresses: ['192.168.1.1'],
  auth_credential_usernames: ['sipuser1'],
  sip_route: {
    name: 'Primary Route',
    sip_url: 'sip:primary@example.com',
    sip_user: 'primary_user',
  },
  webhook_url: 'https://example.com/webhook',
  created_at: '2026-08-14T00:00:00.000Z',
  updated_at: '2026-08-14T00:00:00.000Z',
  secret_id: 'sk_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  secret_name: 'Trunk Secret',
  webhook_api_version: '2026-06-01',
  ...overrides,
});

export const sipTrunkInactiveFixture = (
  overrides: Partial<SipTrunkResponse> = {}
): SipTrunkResponse =>
  sipTrunkFixture({
    is_active: false,
    ...overrides,
  });

export const sipTrunkListFixture = (
  overrides: Partial<CursorResponse<SipTrunkResponse>> = {}
): CursorResponse<SipTrunkResponse> => ({
  data: [
    sipTrunkFixture({ id: 'st_01J5AAAAAAAAAAAAAAAAAAAAAA', name: 'Trunk One' }),
    sipTrunkFixture({ id: 'st_01J5BBBBBBBBBBBBBBBBBBBBBB', name: 'Trunk Two' }),
  ],
  next_cursor: 'eyJpZCI6InN0XzAxSjVBQUFBQUFBQUFBQUFBQUFBQUFBQUEifQ',
  previous_cursor: null,
  has_more: true,
  ...overrides,
});

export const createSipTrunkPayloadFixture = (
  overrides: Partial<CreateSipTrunkPayload> = {}
): CreateSipTrunkPayload => ({
  name: 'Primary Trunk',
  domain_name: 'trunk1.pstn.teler.io',
  authentication_type: AuthenticationType.IP,
  inbound_route: {
    name: 'Primary Route',
    sip_url: 'sip:primary@example.com',
    sip_user: 'primary_user',
  },
  secure: true,
  secret_id: 'sk_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  recording: false,
  webhook_url: 'https://example.com/webhook',
  channel_limit: 100,
  auth_addresses: [{ name: 'Office Router', address: '192.168.1.1' }],
  webhook_api_version: '2026-06-01',
  ...overrides,
});

export const createSipTrunkIpAclPayloadFixture = (
  overrides: Partial<CreateSipTrunkPayload> = {}
): CreateSipTrunkPayload => ({
  name: 'ACL-based Trunk',
  domain_name: 'trunk3.pstn.teler.io',
  authentication_type: AuthenticationType.IP,
  inbound_route: {
    name: 'ACL Route',
    sip_url: 'sip:acl@example.com',
    sip_user: 'acl_user',
  },
  secure: true,
  ip_acl_id: 'acl_01J5ABCDEFGHJKMNPQRSTVWXYZ',
  channel_limit: 100,
  webhook_api_version: '2026-06-01',
  ...overrides,
});

export const createSipTrunkCredentialPayloadFixture = (
  overrides: Partial<CreateSipTrunkPayload> = {}
): CreateSipTrunkPayload => ({
  name: 'Credential Trunk',
  domain_name: 'trunk2.pstn.teler.io',
  authentication_type: AuthenticationType.CREDENTIAL,
  inbound_route: {
    name: 'Credential Route',
    sip_url: 'sip:cred@example.com',
  },
  auth_credential: {
    username: 'sipuser1',
    password: 'str0ngP@ssw0rd',
  },
  ...overrides,
});

export const updateSipTrunkPayloadFixture = (
  overrides: Partial<UpdateSipTrunkPayload> = {}
): UpdateSipTrunkPayload => ({
  name: 'Updated Trunk Name',
  channel_limit: 200,
  recording: true,
  secure: true,
  is_active: true,
  webhook_url: 'https://example.com/webhook-updated',
  authentication_type: AuthenticationType.CREDENTIAL,
  auth_credential: {
    username: 'sipuser_updated',
    password: 'n3wStr0ngP@ss',
  },
  inbound_route: {
    name: 'Updated Route',
    sip_url: 'sip:updated@example.com',
    sip_user: 'updated_user',
  },
  secret_id: 'sk_01J5BBBBBBBBBBBBBBBBBBBBBB',
  webhook_api_version: '2026-06-01',
  ...overrides,
});

export const updateSipTrunkIpAclPayloadFixture = (
  overrides: Partial<UpdateSipTrunkPayload> = {}
): UpdateSipTrunkPayload => ({
  name: 'Updated Trunk Name',
  channel_limit: 200,
  recording: true,
  secure: true,
  is_active: true,
  webhook_url: 'https://example.com/webhook-updated',
  authentication_type: AuthenticationType.IP,
  ip_acl_id: 'acl_01J5BBBBBBBBBBBBBBBBBBBBBB',
  inbound_route: {
    name: 'Updated Route',
    sip_url: 'sip:updated@example.com',
    sip_user: 'updated_user',
  },
  secret_id: 'sk_01J5BBBBBBBBBBBBBBBBBBBBBB',
  webhook_api_version: '2026-06-01',
  ...overrides,
});

export const sipTrunkFiltersFixture = (
  overrides: Partial<SipTrunkFilters> = {}
): SipTrunkFilters => ({
  search: 'Primary',
  status: [Status.ACTIVE],
  limit: 10,
  cursor_after: 'eyJpZCI6InN0XzAxSjVBQUFBQUFBQUFBQUFBQUFBQUFBQUEifQ',
  cursor_before: 'eyJpZCI6InN0XzAxSjVCQkJCQkJCQkJCQkJCQkJCQkJCQkJCIn0',
  ...overrides,
});