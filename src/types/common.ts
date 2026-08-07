/**
 * Common Types
 * 
 */

export type DefaultResponse = {
  success: boolean;
  message: string;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type WebhookApiVersion = "2026-06-01" | "2025-08-01";

export type CallDirection = 'inbound' | 'outbound';

export interface CursorFilters {
  limit?: number;
  cursor_after?: string;
  cursor_before?: string;
}

export interface CursorResponse<T> {
  data: T[];
  next_cursor: string | null;
  previous_cursor: string | null;
  has_more: boolean;
}

export type RingbackMode = 'suppress' | 'passthrough';

export type RecordingType = "stereo" | "mono" | "per_leg";

export type DialNestedAction = PlayAction | HangupAction;

interface PlayAction {
  action: "play";
  media_url: string;
  loop?: boolean;
}

interface HangupAction {
  action: "hangup";
}

