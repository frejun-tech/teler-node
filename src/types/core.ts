import type { VoiceAppListResponse } from "./voice";
import type { CursorFilters } from "./common";
import type { SipTrunkListResponse } from "./sip";

/**
 * Core Types
 */

export enum Status {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

type LocationResponse = {
  id: string;
  name: string;
  region_code: string;
  country_code: string;
  country_name?: string | null;
};

export interface VirtualNumberFilters extends CursorFilters {
  search?: string;
  location?: string[];
}

export interface VirtualNumberResponse {
  id: string;
  account_id: string;
  name: string;
  number: string;
  location: LocationResponse;
  voice_app?: VoiceAppListResponse;
  sip_trunk?: SipTrunkListResponse;
}

export interface UpdateVirtualNumberPayload {
  name: string;
}

export interface AssignVirtualNumberPayload {
  vn_ids?: string[];
  apply_to_all?: boolean;
  voice_app_id?: string;
  sip_trunk_id?: string;
}

export interface UnassignVirtualNumberPayload {
  vn_ids?: string[];
  apply_to_all?: boolean;
}

export interface RecordingParams {
  recording_id: string;
  expires_in?: number;
}
