import { CursorFilters, CursorResponse, type WebhookApiVersion } from "./common";
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

export interface UpdateAppPayload {
  name?: string;
  status?: Status;
  flow_url?: string;
  webhook_url?: string;
  fallback_url?: string | null;
  channel_limit?: number | null;
  secret_id?: string | null;
  webhook_api_version: WebhookApiVersion;
}

export interface VoiceAppDetails extends VoiceAppBase {
  id: string;
  status: Status;
  channel_limit: number | null;
  vn_count: number;
  secret_id?: string | null;
  secret_name?: string | null;
  webhook_api_version: WebhookApiVersion;
  account_id: string;
}

export interface VoiceAppResponse extends CursorResponse {
  data: VoiceAppDetails[];
}

export interface AppFilters extends CursorFilters {
  search?: string;
  status?: Status[];
}

export interface VoiceAppListResponse {
  id: string;
  name: string;
}