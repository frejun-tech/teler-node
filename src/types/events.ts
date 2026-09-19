import type { CursorFilters } from "./common";

/**
 * Event types
 */

export enum DeliveryStatus {
  PENDING = "pending",
  DELIVERED = "delivered",
  FAILED_PERMANENT = "failed_permanent"
}

export interface EventFilters extends CursorFilters {
  callId?: string;
  type?: string;
  occurredAfter?: string;
  deliveryStatus?: DeliveryStatus;
}

export interface EventResponse {
  id: string;
  accountId: string;
  callId?: string | null;
  sipTrunkId?: string | null;
  legId?: string | null;
  type: string;
  apiVersion?: string | null;
  occurredAt: string;
  payload: Record<string, unknown>;
  deliveryStatus: string;
  attemptCount: number;
  lastAttemptAt?: string | null;
  lastStatusCode?: number | null;
  lastError?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
}

export interface EventRedeliverResponse {
  eventId: string;
  redeliveredAt: string;
}
