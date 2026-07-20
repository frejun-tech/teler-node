import type { CursorResponse, DefaultResponse } from "../../types/common";
import { CreateTrunkPayload, UpdateTrunkPayload, TrunkFilters, SipTrunkResponse } from "../../types/sip";
import { HttpResourceManager } from "../http";
import { VNResponse, VNFilters } from "../../types/core";

export class TrunkResourceManager {
    private readonly basePath = '/sip/trunks';
    constructor(private readonly http: HttpResourceManager) {}

    /**
     * Create a new sip trunk
     * @param payload - CreateTrunkPayload.
     * @returns Details of the sip trunk.
     */
    public async create(payload: CreateTrunkPayload): Promise<SipTrunkResponse> {
        return this.http.post<SipTrunkResponse, CreateTrunkPayload>(`${this.basePath}`, payload);
    }

    /**
     * Fetch a sip trunk.
     * @param sipTrunkId - The sip trunk ID to fetch
     * @returns Details of the sip trunk.
     */
    public async retrieve(sipTrunkId: string): Promise<SipTrunkResponse> {
        return this.http.get<SipTrunkResponse>(`${this.basePath}/${sipTrunkId}`);
    }
    
    /**
     * List all sip trunks.
     * @param filters - Optional filters and cursor, which includes search, status, limit, cursor_after and cursor_before.
     * @returns A list of sip trunks.
     */
    public async list(filters?: TrunkFilters): Promise<CursorResponse<SipTrunkResponse>> {
        return this.http.get<CursorResponse<SipTrunkResponse>, TrunkFilters>(this.basePath, filters);
    }

    /**
     * Update a sip trunk.
     * @param sipTrunkId - SIP trunk ID to update.
     * @param payload - UpdateTrunkPayload.
     * @returns Details of the updated trunk.
     */
    public async update(sipTrunkId: string, payload: UpdateTrunkPayload): Promise<SipTrunkResponse> {
        return this.http.patch<SipTrunkResponse, UpdateTrunkPayload>(`${this.basePath}/${sipTrunkId}`, payload);
    }

    /**
     * Delete a sip trunk.
     * @param sipTrunkId - sip trunk ID to delete.
     * @returns success/ failure.
     */
    public async delete(sipTrunkId: string): Promise<DefaultResponse> {
        return this.http.delete<DefaultResponse>(`${this.basePath}/${sipTrunkId}`);
    }

    /**
     * Get virtual numbers assigned to a sip trunk.
     * @param sipTrunkId - sipTrunkID to fetch vns.
     * @returns Details of the vns assigned to the sip trunk.
     */
    public async getVns(sipTrunkId: string, params?: VNFilters): Promise<CursorResponse<VNResponse>> {
        return this.http.get<CursorResponse<VNResponse>, VNFilters>(`${this.basePath}/${sipTrunkId}/vns`, params);
    }
}