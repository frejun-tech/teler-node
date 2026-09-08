import type {
  EventResponse,
  EventFilters,
  EventRedeliverResponse
} from "../types/events";
import type { HttpResourceManager } from "./http";
import type { CursorResponse } from "../types/common";

export class EventResourceManager {
  private readonly basePath = "/events";
  constructor(private readonly http: HttpResourceManager) {}

  /**
   * List all webhook events.
   * @param filters - Optional filters and cursor, which includes callId, type, occurredAfter, deliveryStatus, limit, cursorAfter and cursorBefore.
   * @returns A list of webhook events.
   */
  public async list(
    filters?: EventFilters
  ): Promise<CursorResponse<EventResponse>> {
    return this.http.get<CursorResponse<EventResponse>, EventFilters>(
      this.basePath,
      filters
    );
  }

  /**
   * Fetch webhook event.
   * @param eventId - The webhook event ID to fetch
   * @returns Details of the webhook event.
   */
  public async retrieve(eventId: string): Promise<EventResponse> {
    return this.http.get<EventResponse>(`${this.basePath}/${eventId}`);
  }

  /**
   * Redeliver webhook event.
   * @param eventId - The webhook event ID to redeliver
   * @returns Details of the redelivery.
   */
  public async redeliver(eventId: string): Promise<EventRedeliverResponse> {
    return this.http.post<EventRedeliverResponse>(
      `${this.basePath}/${eventId}/redeliver`
    );
  }
}
