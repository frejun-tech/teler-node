/**
 * Core Types
 */

import { VoiceAppListResponse } from "./app";
import { CursorFilters } from "./common";
import { SIPTrunkListResponse } from "./trunk";

export enum Status {
  ACTIVE = "active",
  INACTIVE = "inactive"
}

type LocationResponse = {
  id: string;
  name: string;
  region_code: string;
  country_code: string;
  country_name?: string | null;
}

export interface ListVNFilters extends CursorFilters {
  search?: string;
  location?: string[];
}

export interface VNListResponse {
  id: string;
  account_id: string;
  name: string;
  number: string;
  location: LocationResponse;
  voice_app?: VoiceAppListResponse;
  sip_trunk?: SIPTrunkListResponse;
}

export interface UpdateVNPayload {
  name: string;
}

export interface AssignVNPayload {
  vn_ids?: string[];
  apply_to_all?: boolean;
  voice_app_id?: string;
  sip_trunk_id?: string;
}

export interface UnassignVNPayload {
  vn_ids?: string[];
  apply_to_all?: boolean;
}