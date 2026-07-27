import type { CursorFilters } from "./common";
import type { SipTrunkListResponse } from "./sip";
import type { VoiceAppListResponse } from "./voice";

/**
 * 
 * Secret Types
 *
 */


export interface CreateSecretPayload {
  name: string;
}

export interface UpdateSecretPayload {
  name?: string;
  rotate?: boolean;
}

export interface SecretFilters extends CursorFilters {
  search?: string;
}

export interface SecretResponse {
  id: string;
  name: string;
  secret_value: string;
  rotated_at?: string | null;
  created_at: string;
  needs_rotation: boolean;
  voice_apps: VoiceAppListResponse[];
  sip_trunks: SipTrunkListResponse[];
}

export interface SecretListResponse {
  id: string;
  name: string;
}