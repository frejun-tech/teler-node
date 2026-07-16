import { EventDetails, EventFilters, EventRedeliverStatus, EventResponse } from "../types/events";
import { HttpResourceManager } from "./http";
import { RawCursorResponse, toCursorResponse } from "../utils/cursor";


export class EventResourceManager {
    private readonly basePath = '/events';
    constructor(private readonly http: HttpResourceManager){}

    /**
     * List all webhook events.
     * @param params - Optional filters and cursor, which includes call_id, type, occurred_after, delivery_status, limit, cursor_after and cursor_before.
     * @returns A list of webhook events.
     */
    public async list(params?: EventFilters): Promise<EventResponse> {
        const raw = await this.http.get<RawCursorResponse<EventDetails>, EventFilters>(this.basePath, params);
        return toCursorResponse<EventDetails, EventDetails>(raw, (item) => item);
    }

    /**
     * Fetch webhook event.
     * @param eventId - The webhook event ID to fetch
     * @returns Details of the webhook event.
     */
    public async retrieve(eventId: string): Promise<EventDetails> {
        return this.http.get<EventDetails>(`${this.basePath}/${eventId}`);
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