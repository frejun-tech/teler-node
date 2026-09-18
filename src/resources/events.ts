import type {
  EventResponse,
  EventFilters,
  EventRedeliverResponse
} from "../types/events";
import type { HttpResourceManager } from "./http";
import type { CursorResponse } from "../types/common";
import { autoPaginate } from "../lib/pagination";

export class EventResourceManager {
  private readonly basePath = "/events";
  constructor(private readonly http: HttpResourceManager) {}

  /**
   * List all webhook events.
   * Server-side default page size is 50 when `limit` is omitted
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
   * Auto-paginate through all webhook events, fetching further pages on demand
   * as you iterate.
   * @param filters - Optional filters, same as `list()` (`cursorAfter`/`cursorBefore` are managed internally).
   * @returns An async iterable of webhook events.
   */
  public listAutoPagination(
    filters?: EventFilters
  ): AsyncGenerator<EventResponse, void, undefined> {
    return autoPaginate<EventResponse, EventFilters>(
      (f: EventFilters | undefined) => this.list(f),
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
