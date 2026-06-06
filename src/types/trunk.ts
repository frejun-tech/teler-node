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
  username: string,
  password: string
};


export type SipAuthAddressInput = {
  name: string,
  address: string
};


export type InboundRoute = {
  name: string,
  sip_url: string,
  sip_user?: string
};


export interface SIPTrunkBase {
  name: string,
  domain_name: string,
  channel_limit?: number,
  recording?: boolean,
  secure?: boolean,
  webhook_url?: string,
  authentication_type: AuthenticationType,
  auth_credential?: SipAuthCredentialInput,
  auth_addresses?: SipAuthAddressInput[],
  inbound_route: InboundRoute,
  secret_id?: string
};

export interface CreateTrunkPayload extends SIPTrunkBase {};


export interface UpdateTrunkPayload extends SIPTrunkBase {};


export interface SIPTrunkResponse extends SIPTrunkBase, CursorResponse {};


export interface ListTrunkFilters extends CursorFilters {
  search?: string;
  status?: Status[];
}