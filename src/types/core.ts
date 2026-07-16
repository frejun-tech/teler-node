import { VoiceAppListResponse } from "./app";
import { CursorFilters, CursorResponse } from "./common";
import { SipTrunkListResponse } from "./trunk";

/**
 * Core Types
 */


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

export interface VNFilters extends CursorFilters {
  search?: string;
  location?: string[];
}

export interface VNDetails {
  id: string;
  account_id: string;
  name: string;
  number: string;
  location: LocationResponse;
  voice_app?: VoiceAppListResponse;
  sip_trunk?: SipTrunkListResponse;
}

export interface VNResponse extends CursorResponse {
  data: VNDetails[];
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

export interface RecordingParams {
  recording_id: string;
  expires_in?: number;
}