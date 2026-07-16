import { CursorFilters, CursorResponse } from "./common";

/**
 * Event types
 */


// export enum CallWebhookEvents  {
//   CALL_INITIATED = 'call.initated',
//   CALL_ANSWERED = 'call.answered',
//   CALL_COMPLETED = 'call.completed',
//   CALL_FAILED = 'call.failed'
// }

// export enum StreamWebhookEvents {
//   STREAM_INITATED = 'stream.initiated',
//   STREAM_COMPLETED = 'stream.completed'
// }

export enum DeliveryStatus {
  PENDING = "pending", 
  DELIVERED = "delivered", 
  FAILED_PERMANENT = "failed_permanent"
}

export interface EventFilters extends CursorFilters {
  call_id?: string;
  type?: string;
  occurred_after?: string;
  delivery_status?: DeliveryStatus;
  limit?: number;
}

export interface EventDetails {
  id: string;
  account_id: string;
  call_id: string;
  sip_trunk_id: string;
  leg_id: string;
  type: string;
  api_version: string;
  occurred_at: string;
  payload: Record<string, any>;
  delivery_status: string;
  attempt_count: number;
  last_attempt_at: string;
  last_status_code: number;
  last_error: string;
  delivered_at: string;
  created_at: string;
}

export interface EventResponse extends CursorResponse {
  data: EventDetails[];
}

export interface EventRedeliverStatus {
  event_id: string;
  redelivered_at: string;
}