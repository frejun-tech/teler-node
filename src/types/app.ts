import { CursorFilters } from "./common";
import { Status } from "./core";
/**
 * Voice Apps Types
 * 
 */

interface VoiceAppBase {
  name: string;
  flow_url: string;
  webhook_url: string;
  fallback_url?: string | null;
}

export interface CreateAppPayload extends VoiceAppBase {
  vn_ids?: string[];
  secret_id?: string | null;
}

export type UpdateAppPayload = {
  name?: string;
  status?: Status;
  flow_url?: string;
  webhook_url?: string;
  fallback_url?: string | null;
  channel_limit?: number;
  secret_id?: string | null;
}

export interface VoiceAppResponse extends VoiceAppBase {
  id: string;
  status: Status;
  channel_limit: number;
  vn_count: number;
  secret_id?: string | null;
  secret_name?: string | null;
}

export interface ListAppFilters extends CursorFilters {
  search?: string;
  status?: Status[];
}

export interface VoiceAppListResponse {
  id: string;
  name: string;
}