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
  secretValue: string;
  rotatedAt?: string | null;
  createdAt: string;
  needsRotation: boolean;
  voiceApps: VoiceAppListResponse[];
  sipTrunks: SipTrunkListResponse[];
}

export interface SecretListResponse {
  id: string;
  name: string;
}
