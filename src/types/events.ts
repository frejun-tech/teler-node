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
  callId: string;
  sipTrunkId: string;
  legId: string;
  type: string;
  apiVersion: string;
  occurredAt: string;
  payload: Record<string, unknown>;
  deliveryStatus: string;
  attemptCount: number;
  lastAttemptAt: string;
  lastStatusCode: number;
  lastError: string;
  deliveredAt: string;
  createdAt: string;
}

export interface EventRedeliverResponse {
  eventId: string;
  redeliveredAt: string;
}
