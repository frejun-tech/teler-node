/**
 * Common Types
 * 
 */

export type DefaultResponse = {
  success: boolean;
  message: string;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface CursorFilters {
  limit?: number;
  cursor_after?: string;
  cursor_before?: string;
}

export interface CursorResponse {
  next_cursor: string | null;
  previous_cursor: string | null;
  has_more: boolean;
}