import { CursorFilters, CursorResponse } from "./common";
import { Status } from "./core";

/**
 * SIP Trunk Types
 */


export enum AuthenticationType {
  CREDENTIAL = "credential",
  IP = "IP"
};


export type SipAuthCredentialInput = {
  username: string;
  password: string
};


export type SipAuthAddressInput = {
  name: string;
  address: string
};


export type InboundRoute = {
  name: string;
  sip_url: string;
  sip_user?: string
};


export interface CreateTrunkPayload {
  name: string;
  domain_name: string;
  channel_limit?: number;
  recording?: boolean;
  secure?: boolean;
  webhook_url?: string;
  authentication_type: AuthenticationType;
  auth_credential?: SipAuthCredentialInput;
  auth_addresses?: SipAuthAddressInput[];
  inbound_route: InboundRoute;
  secret_id?: string;
};


export interface UpdateTrunkPayload {
  name?: string;
  channel_limit?: number;
  recording?: boolean;
  secure?: boolean;
  is_active?: boolean;
  webhook_url?: string;
  authentication_type?: AuthenticationType;
  auth_credential?: SipAuthCredentialInput;
  auth_addresses?: SipAuthAddressInput[];
  inbound_route?: InboundRoute;
  secret_id?: string;
};


export interface SIPTrunkResponse extends CursorResponse {
  id: string;
  account_id: string;
  cps_limit: number;
  name: string;
  domain_name: string;
  recording_enabled: boolean;
  channel_limit: number;
  secure: boolean;
  is_active: boolean;
  auth_ip_addresses?: string[];
  auth_credential_usernames?: string[];
  sip_route: InboundRoute;
  webhook_url?: string;
  webhook_api_version?: string;
  created_at?: string;
  updated_at?: string;
  secret_id?: string;
  secret_name?: string;
};


export interface ListTrunkFilters extends CursorFilters {
  search?: string;
  status?: Status[];
}


export interface SIPTrunkListResponse {
  id: string;
  name: string;
}