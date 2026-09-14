import type { VoiceAppListResponse } from "./voice";
import type { CursorFilters } from "./common";
import type { SipTrunkListResponse } from "./sip";

/**
 * Core Types
 */

type LocationResponse = {
  id: string;
  name: string;
  regionCode: string;
  countryCode: string;
  countryName?: string | null;
};

export interface VirtualNumberFilters extends CursorFilters {
  search?: string;
  location?: string[];
}

export interface VirtualNumberResponse {
  id: string;
  name: string;
  number: string;
  location: LocationResponse;
  voiceApp?: VoiceAppListResponse;
  sipTrunk?: SipTrunkListResponse;
}

export interface VirtualNumberListResponse extends VirtualNumberResponse {
  accountId: string;
}

export interface UpdateVirtualNumberPayload {
  name: string;
}

export interface AssignVirtualNumberPayload {
  vnIds?: string[];
  applyToAll?: boolean;
  voiceAppId?: string;
  sipTrunkId?: string;
}

export interface UnassignVirtualNumberPayload {
  vnIds?: string[];
  applyToAll?: boolean;
}

export interface RecordingParams {
  recordingId: string;
  expiresIn?: number;
}
