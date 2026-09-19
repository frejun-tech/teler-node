/**
 * Common Types
 *
 */

export enum Status {
  ACTIVE = "active",
  INACTIVE = "inactive"
}

export type DefaultResponse = {
  success: boolean;
  message: string;
};

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type WebhookApiVersion = "2026-06-01" | "2025-08-01";

export type CallDirection = "inbound" | "outbound";

export interface CursorFilters {
  limit?: number;
  cursorAfter?: string;
  cursorBefore?: string;
}

export interface CursorResponse<T> {
  data: T[];
  nextCursor: string | null;
  previousCursor: string | null;
  hasMore: boolean;
}

export type RingbackMode = "suppress" | "passthrough";

export type RecordingType = "stereo" | "mono" | "per_leg";

export type DialNestedAction = PlayAction | HangupAction;

interface PlayAction {
  action: "play";
  mediaUrl: string;
  loop?: boolean;
}

interface HangupAction {
  action: "hangup";
}
