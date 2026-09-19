import { AuthenticationType, Transport } from "@/types/sip";
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
  SipTrunkFilters
} from "@/types/sip";
import type { CursorResponse } from "@/types/common";
import { Status } from "@/types/common";

// SIP Calls

export const sipCallFixture = (
  overrides: Partial<SipCallResponse> = {}
): SipCallResponse => ({
  id: "cs_01J5ABCDEFGHJKMNPQRSTVWXYZ",
  accountId: "acc_01J5ABCDEFGHJKMNPQRSTVWXYZ",
  sipTrunkId: "st_01J5ABCDEFGHJKMNPQRSTVWXYZ",
  state: "completed",
  direction: "inbound",
  fromNumber: "+18005550100",
  toNumber: "+18005550200",
  createdAt: "2026-08-14T00:00:00.000Z",
  answeredAt: "2026-08-14T00:00:02.000Z",
  endedAt: "2026-08-14T00:01:00.000Z",
  durationSeconds: 58,
  reason: "normal_clearing",
  endedBy: "caller",
  recordings: ["rec_01J5ABCDEFGHJKMNPQRSTVWXYZ"],
  ...overrides
});

export const sipCallInProgressFixture = (
  overrides: Partial<SipCallResponse> = {}
): SipCallResponse =>
  sipCallFixture({
    state: "in_progress",
    answeredAt: "2026-08-14T00:00:02.000Z",
    endedAt: null,
    durationSeconds: null,
    reason: null,
    endedBy: null,
    recordings: [],
    ...overrides
  });

export const sipCallUnansweredFixture = (
  overrides: Partial<SipCallResponse> = {}
): SipCallResponse =>
  sipCallFixture({
    state: "no_answer",
    answeredAt: null,
    endedAt: "2026-08-14T00:00:30.000Z",
    durationSeconds: null,
    reason: "no_answer",
    endedBy: "system",
    recordings: [],
    ...overrides
  });

export const sipCallListFixture = (
  overrides: Partial<CursorResponse<SipCallResponse>> = {}
): CursorResponse<SipCallResponse> => ({
  data: [
    sipCallFixture({ id: "cs_01J5AAAAAAAAAAAAAAAAAAAAAA" }),
    sipCallFixture({
      id: "cs_01J5BBBBBBBBBBBBBBBBBBBBBB",
      direction: "outbound"
    })
  ],
  nextCursor: "eyJpZCI6ImNzXzAxSjVBQUFBQUFBQUFBQUFBQUFBQUFBQUEifQ",
  previousCursor: null,
  hasMore: true,
  ...overrides
});

export const sipCallFiltersFixture = (
  overrides: Partial<SipCallFilters> = {}
): SipCallFilters => ({
  trunkId: "st_01J5ABCDEFGHJKMNPQRSTVWXYZ",
  fromNumber: "+18005550100",
  toNumber: "+18005550200",
  createdAfter: "2026-08-01T00:00:00.000Z",
  createdBefore: "2026-08-14T23:59:59.000Z",
  limit: 20,
  cursorAfter: "eyJpZCI6ImNzXzAxSjVBQUFBQUFBQUFBQUFBQUFBQUFBQUEifQ",
  cursorBefore: "eyJpZCI6ImNzXzAxSjVCQkJCQkJCQkJCQkJCQkJCQkJCQkJCIn0",
  ...overrides
});

// SIP IP ACLs

export const ipAclFixture = (
  overrides: Partial<IpAclResponse> = {}
): IpAclResponse => ({
  id: "acl_01J5ABCDEFGHJKMNPQRSTVWXYZ",
  name: "Office IP ACL",
  addresses: [
    { address: "192.168.1.0/24", description: "Office HQ" },
    { address: "10.0.0.1/32", description: "VPN Gateway" }
  ],
  trunkCount: 1,
  createdAt: "2026-08-14T00:00:00.000Z",
  updatedAt: "2026-08-14T00:00:00.000Z",
  ...overrides
});

export const ipAclUnusedFixture = (
  overrides: Partial<IpAclResponse> = {}
): IpAclResponse =>
  ipAclFixture({
    trunkCount: 0,
    ...overrides
  });

export const ipAclListFixture = (
  overrides: Partial<CursorResponse<IpAclListResponse>> = {}
): CursorResponse<IpAclListResponse> => ({
  data: [
    {
      id: "acl_01J5AAAAAAAAAAAAAAAAAAAAAA",
      name: "ACL 1",
      addressCount: 2,
      trunkCount: 1,
      createdAt: "2026-08-14T00:00:00.000Z"
    },
    {
      id: "acl_01J5BBBBBBBBBBBBBBBBBBBBBB",
      name: "ACL 2",
      addressCount: 1,
      trunkCount: 0,
      createdAt: "2026-08-13T00:00:00.000Z"
    }
  ],
  nextCursor: "eyJpZCI6ImFjbF8wMUo1QUFBQUFBQUFBQUFBQUFBQUFBQUFBQSJ9",
  previousCursor: null,
  hasMore: false,
  ...overrides
});

export const createIpAclPayloadFixture = (
  overrides: Partial<CreateIpAclPayload> = {}
): CreateIpAclPayload => ({
  name: "Office IP ACL",
  addresses: [
    { address: "192.168.1.0/24", description: "Office HQ" },
    { address: "10.0.0.1/32", description: "VPN Gateway" }
  ],
  ...overrides
});

export const updateIpAclPayloadFixture = (
  overrides: Partial<UpdateIpAclPayload> = {}
): UpdateIpAclPayload => ({
  name: "Updated Office IP ACL",
  addresses: [{ address: "172.16.0.0/12", description: "Branch Network" }],
  ...overrides
});

export const ipAclFiltersFixture = (
  overrides: Partial<IpAclFilters> = {}
): IpAclFilters => ({
  search: "Office",
  limit: 10,
  cursorAfter: "eyJpZCI6ImFjbF8wMUo1QUFBQUFBQUFBQUFBQUFBQUFBQUFBQSJ9",
  cursorBefore: "eyJpZCI6ImFjbF8wMUo1QkJCQkJCQkJCQkJCQkJCQkJCQkJCQkIifQ",
  ...overrides
});

// SIP Trunks

export const sipTrunkFixture = (
  overrides: Partial<SipTrunkResponse> = {}
): SipTrunkResponse => ({
  id: "st_01J5ABCDEFGHJKMNPQRSTVWXYZ",
  accountId: "acc_01J5ABCDEFGHJKMNPQRSTVWXYZ",
  cpsLimit: 10,
  name: "Primary Trunk",
  domainName: "trunk1.pstn.teler.io",
  recordingEnabled: false,
  channelLimit: 100,
  secure: true,
  transport: Transport.TLS,
  isActive: true,
  authenticationType: AuthenticationType.IP,
  authIpAddresses: ["192.168.1.1"],
  authCredentialUsernames: ["sipuser1"],
  sipRoute: {
    name: "Primary Route",
    sipUrl: "sip:primary@example.com",
    sipUser: "primary_user"
  },
  webhookUrl: "https://example.com/webhook",
  createdAt: "2026-08-14T00:00:00.000Z",
  updatedAt: "2026-08-14T00:00:00.000Z",
  secretId: "sk_01J5ABCDEFGHJKMNPQRSTVWXYZ",
  secretName: "Trunk Secret",
  webhookApiVersion: "2026-06-01",
  ...overrides
});

export const sipTrunkInactiveFixture = (
  overrides: Partial<SipTrunkResponse> = {}
): SipTrunkResponse =>
  sipTrunkFixture({
    isActive: false,
    ...overrides
  });

export const sipTrunkListFixture = (
  overrides: Partial<CursorResponse<SipTrunkResponse>> = {}
): CursorResponse<SipTrunkResponse> => ({
  data: [
    sipTrunkFixture({ id: "st_01J5AAAAAAAAAAAAAAAAAAAAAA", name: "Trunk One" }),
    sipTrunkFixture({ id: "st_01J5BBBBBBBBBBBBBBBBBBBBBB", name: "Trunk Two" })
  ],
  nextCursor: "eyJpZCI6InN0XzAxSjVBQUFBQUFBQUFBQUFBQUFBQUFBQUEifQ",
  previousCursor: null,
  hasMore: true,
  ...overrides
});

const mergeSipPayload = <T extends { secure?: boolean; transport?: Transport }>(
  base: T,
  overrides: Partial<T>
): T => {
  const result = { ...base, ...overrides };
  if ("transport" in overrides && !("secure" in overrides)) {
    delete result.secure;
  }
  return result;
};

export const createSipTrunkPayloadFixture = (
  overrides: Partial<CreateSipTrunkPayload> = {}
): CreateSipTrunkPayload =>
  mergeSipPayload(
    {
      name: "Primary Trunk",
      domainName: "trunk1.pstn.teler.io",
      authenticationType: AuthenticationType.IP,
      inboundRoute: {
        name: "Primary Route",
        sipUrl: "sip:primary@example.com",
        sipUser: "primary_user"
      },
      secure: true,
      secretId: "sk_01J5ABCDEFGHJKMNPQRSTVWXYZ",
      recording: false,
      webhookUrl: "https://example.com/webhook",
      channelLimit: 100,
      authAddresses: [{ name: "Office Router", address: "192.168.1.1" }],
      webhookApiVersion: "2026-06-01"
    },
    overrides
  );

export const createSipTrunkIpAclPayloadFixture = (
  overrides: Partial<CreateSipTrunkPayload> = {}
): CreateSipTrunkPayload =>
  mergeSipPayload(
    {
      name: "ACL-based Trunk",
      domainName: "trunk3.pstn.teler.io",
      authenticationType: AuthenticationType.IP,
      inboundRoute: {
        name: "ACL Route",
        sipUrl: "sip:acl@example.com",
        sipUser: "acl_user"
      },
      secure: true,
      ipAclId: "acl_01J5ABCDEFGHJKMNPQRSTVWXYZ",
      channelLimit: 100,
      webhookApiVersion: "2026-06-01"
    },
    overrides
  );

export const createSipTrunkCredentialPayloadFixture = (
  overrides: Partial<CreateSipTrunkPayload> = {}
): CreateSipTrunkPayload =>
  mergeSipPayload(
    {
      name: "Credential Trunk",
      domainName: "trunk2.pstn.teler.io",
      authenticationType: AuthenticationType.CREDENTIAL,
      inboundRoute: {
        name: "Credential Route",
        sipUrl: "sip:cred@example.com"
      },
      authCredential: {
        username: "sipuser1",
        password: "str0ngP@ssw0rd"
      },
      secure: true
    },
    overrides
  );

export const updateSipTrunkPayloadFixture = (
  overrides: Partial<UpdateSipTrunkPayload> = {}
): UpdateSipTrunkPayload =>
  mergeSipPayload(
    {
      name: "Updated Trunk Name",
      channelLimit: 200,
      recording: true,
      secure: true,
      isActive: true,
      webhookUrl: "https://example.com/webhook-updated",
      authenticationType: AuthenticationType.CREDENTIAL,
      authCredential: {
        username: "sipuser_updated",
        password: "n3wStr0ngP@ss"
      },
      inboundRoute: {
        name: "Updated Route",
        sipUrl: "sip:updated@example.com",
        sipUser: "updated_user"
      },
      secretId: "sk_01J5BBBBBBBBBBBBBBBBBBBBBB",
      webhookApiVersion: "2026-06-01"
    },
    overrides
  );

export const updateSipTrunkIpAclPayloadFixture = (
  overrides: Partial<UpdateSipTrunkPayload> = {}
): UpdateSipTrunkPayload =>
  mergeSipPayload(
    {
      name: "Updated Trunk Name",
      channelLimit: 200,
      recording: true,
      secure: true,
      isActive: true,
      webhookUrl: "https://example.com/webhook-updated",
      authenticationType: AuthenticationType.IP,
      ipAclId: "acl_01J5BBBBBBBBBBBBBBBBBBBBBB",
      inboundRoute: {
        name: "Updated Route",
        sipUrl: "sip:updated@example.com",
        sipUser: "updated_user"
      },
      secretId: "sk_01J5BBBBBBBBBBBBBBBBBBBBBB",
      webhookApiVersion: "2026-06-01"
    },
    overrides
  );

export const sipTrunkFiltersFixture = (
  overrides: Partial<SipTrunkFilters> = {}
): SipTrunkFilters => ({
  search: "Primary",
  status: [Status.ACTIVE],
  limit: 10,
  cursorAfter: "eyJpZCI6InN0XzAxSjVBQUFBQUFBQUFBQUFBQUFBQUFBQUEifQ",
  cursorBefore: "eyJpZCI6InN0XzAxSjVCQkJCQkJCQkJCQkJCQkJCQkJCQkJCIn0",
  ...overrides
});
