import { EventResponse, EventFilters, EventRedeliverStatus } from "../types/events";
import { HttpResourceManager } from "./http";
import { CursorResponse } from "../types/common";


export class EventResourceManager {
    private readonly basePath = '/events';
    constructor(private readonly http: HttpResourceManager){}

    /**
     * List all webhook events.
     * @param filters - Optional filters and cursor, which includes call_id, type, occurred_after, delivery_status, limit, cursor_after and cursor_before.
     * @returns A list of webhook events.
     */
    public async list(filters?: EventFilters): Promise<CursorResponse<EventResponse>> {
        return this.http.get<CursorResponse<EventResponse>, EventFilters>(this.basePath, filters);
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
    public async redeliver(eventId: string): Promise<EventRedeliverStatus> {
        return this.http.post<EventRedeliverStatus>(`${this.basePath}/${eventId}/redeliver`);
    }
}