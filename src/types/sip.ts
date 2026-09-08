import type { CallDirection, CursorFilters, WebhookApiVersion } from "./common";
import { Status } from "./common";

/**
 * Sip Trunk Types
 */

export enum AuthenticationType {
  CREDENTIAL = "credential",
  IP = "IP"
}

export enum Transport {
  TLS = "tls",
  TCP = "tcp",
  UDP = "udp"
}

export type SipAuthCredentialInput = {
  username: string;
  password: string;
};

export type SipAuthAddressInput = {
  name: string;
  address: string;
};

export type InboundRoute = {
  name: string;
  sipUrl: string;
  sipUser?: string;
};

export interface CreateSipTrunkPayload {
  name: string;
  secure?: boolean;
  transport?: Transport;
  domainName: string;
  secretId?: string;
  recording?: boolean;
  webhookUrl?: string;
  channelLimit?: number;
  authenticationType: AuthenticationType;
  authCredential?: SipAuthCredentialInput;
  authAddresses?: SipAuthAddressInput[];
  ipAclId?: string;
  inboundRoute?: InboundRoute;
  webhookApiVersion?: WebhookApiVersion;
}

export interface UpdateSipTrunkPayload {
  name?: string;
  channelLimit?: number;
  recording?: boolean;
  secure?: boolean;
  transport?: Transport;
  isActive?: boolean;
  webhookUrl?: string;
  authenticationType?: AuthenticationType;
  authCredential?: SipAuthCredentialInput;
  authAddresses?: SipAuthAddressInput[];
  ipAclId?: string;
  inboundRoute?: InboundRoute;
  secretId?: string;
  webhookApiVersion?: WebhookApiVersion;
}

export interface SipTrunkResponse {
  id: string;
  accountId: string;
  cpsLimit: number;
  name: string;
  domainName: string;
  recordingEnabled: boolean;
  channelLimit?: number | null;
  secure: boolean;
  transport?: Transport;
  isActive: boolean;
  authenticationType?: AuthenticationType;
  authIpAddresses?: string[];
  authCredentialUsernames?: string[];
  ipAclId?: string;
  ipAclName?: string;
  sipRoute?: InboundRoute | null;
  webhookUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  secretId?: string;
  secretName?: string;
  webhookApiVersion: WebhookApiVersion;
}

export interface SipTrunkFilters extends CursorFilters {
  search?: string;
  status?: Status[];
}

export interface SipTrunkListResponse {
  id: string;
  name: string;
}

/**
 *
 * SIP IP Access Control Lists
 */

export interface IpAclEntryInput {
  address: string;
  description?: string | null;
}

export interface CreateIpAclPayload {
  name: string;
  addresses: IpAclEntryInput[];
}

export interface UpdateIpAclPayload {
  name?: string | null;
  addresses?: IpAclEntryInput[] | null;
}

export interface IpAclEntryResponse {
  address: string;
  description?: string | null;
}

export interface IpAclResponse {
  id: string;
  name: string;
  addresses: IpAclEntryResponse[];
  trunkCount: number;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface IpAclListResponse {
  id: string;
  name: string;
  addressCount: number;
  trunkCount: number;
  createdAt?: string | null;
}

export interface IpAclFilters extends CursorFilters {
  search?: string;
}

/**
 *
 * Sip Call Types
 */

export interface SipCallFilters extends CursorFilters {
  trunkId?: string;
  fromNumber?: string;
  toNumber?: string;
  createdAfter?: string;
  createdBefore?: string;
}

export interface SipCallResponse {
  id: string;
  accountId: string;
  sipTrunkId: string;
  state: string;
  direction: CallDirection;
  fromNumber: string | null;
  toNumber: string | null;
  createdAt: string;
  answeredAt: string | null;
  endedAt: string | null;
  durationSeconds: number | null;
  reason: string | null;
  endedBy: string | null;
  recordings: string[];
}
