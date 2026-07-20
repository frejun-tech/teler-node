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