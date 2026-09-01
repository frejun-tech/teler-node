import type { CallDirection, CursorFilters, WebhookApiVersion } from "./common";
import { Status } from "./core";

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
  sip_url: string;
  sip_user?: string;
};

export interface CreateSipTrunkPayload {
  name: string;
  secure?: boolean;
  transport?: Transport;
  secret_id?: string;
  domain_name: string;
  recording?: boolean;
  webhook_url?: string;
  channel_limit?: number;
  authentication_type: AuthenticationType;
  auth_credential?: SipAuthCredentialInput;
  auth_addresses?: SipAuthAddressInput[];
  ip_acl_id?: string;
  inbound_route?: InboundRoute;
  webhook_api_version?: WebhookApiVersion;
}

export interface UpdateSipTrunkPayload {
  name?: string;
  channel_limit?: number;
  recording?: boolean;
  secure?: boolean;
  transport?: Transport;
  is_active?: boolean;
  webhook_url?: string;
  authentication_type?: AuthenticationType;
  auth_credential?: SipAuthCredentialInput;
  auth_addresses?: SipAuthAddressInput[];
  ip_acl_id?: string;
  inbound_route?: InboundRoute;
  secret_id?: string;
  webhook_api_version?: WebhookApiVersion;
}

export interface SipTrunkResponse {
  id: string;
  account_id: string;
  cps_limit: number;
  name: string;
  domain_name: string;
  recording_enabled: boolean;
  channel_limit?: number | null;
  secure: boolean;
  transport?: Transport;
  is_active: boolean;
  authentication_type?: AuthenticationType;
  auth_ip_addresses?: string[];
  auth_credential_usernames?: string[];
  ip_acl_id?: string;
  ip_acl_name?: string;
  sip_route?: InboundRoute | null;
  webhook_url?: string;
  created_at?: string;
  updated_at?: string;
  secret_id?: string;
  secret_name?: string;
  webhook_api_version: WebhookApiVersion;
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
  trunk_count: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface IpAclListResponse {
  id: string;
  name: string;
  address_count: number;
  trunk_count: number;
  created_at?: string | null;
}

export interface IpAclFilters extends CursorFilters {
  search?: string;
}

/**
 *
 * Sip Call Types
 */

export interface SipCallFilters extends CursorFilters {
  trunk_id?: string;
  from_number?: string;
  to_number?: string;
  created_after?: string;
  created_before?: string;
}

export interface SipCallResponse {
  id: string;
  account_id: string;
  sip_trunk_id: string;
  state: string;
  direction: CallDirection;
  from_number: string | null;
  to_number: string | null;
  created_at: string;
  answered_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  reason: string | null;
  ended_by: string | null;
  recordings: string[];
}
