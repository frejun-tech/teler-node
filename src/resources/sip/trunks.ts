import type { DefaultResponse } from "../../types/common";
import { CreateTrunkPayload, UpdateTrunkPayload, SipTrunkResponse, TrunkFilters, SipTrunkDetails } from "../../types/trunk";
import { HttpResourceManager } from "../http";
import { VNDetails, VNFilters, VNResponse } from "../../types/core";
import { RawCursorResponse, toCursorResponse } from "../../utils/cursor";

export class TrunkResourceManager {
    private readonly basePath = '/sip/trunks';
    constructor(private readonly http: HttpResourceManager) {}

    /**
     * Create a new sip trunk
     * @param payload - CreateTrunkPayload.
     * @returns Details of the sip trunk.
     */
    public async create(payload: CreateTrunkPayload): Promise<SipTrunkDetails> {
        return this.http.post<SipTrunkDetails, CreateTrunkPayload>(`${this.basePath}`, payload);
    }

    /**
     * Fetch a sip trunk.
     * @param sipTrunkId - The sip trunk ID to fetch
     * @returns Details of the sip trunk.
     */
    public async retrieve(sipTrunkId: string): Promise<SipTrunkDetails> {
        return this.http.get<SipTrunkDetails>(`${this.basePath}/${sipTrunkId}`);
    }
    
    /**
     * List all sip trunks.
     * @param params - Optional filters and cursor, which includes search, status, limit, cursor_after and cursor_before.
     * @returns A list of sip trunks.
     */
    public async list(params?: TrunkFilters): Promise<SipTrunkResponse> {
        const raw = await this.http.get<RawCursorResponse<SipTrunkDetails>, TrunkFilters>(this.basePath, params);
        return toCursorResponse<SipTrunkDetails, SipTrunkDetails>(raw, (item) => item);
    }

    /**
     * Update a sip trunk.
     * @param sipTrunkId - sip trunk ID to update, payload - UpdateTrunkPayload.
     * @returns Details of the updated trunk.
     */
    public async update(sipTrunkId: string, payload: UpdateTrunkPayload): Promise<SipTrunkDetails> {
        return this.http.patch<SipTrunkDetails, UpdateTrunkPayload>(`${this.basePath}/${sipTrunkId}`, payload);
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
    public async getVns(sipTrunkId: string, params?: VNFilters): Promise<VNResponse> {
        const raw = await this.http.get<RawCursorResponse<VNDetails>, VNFilters>(`${this.basePath}/${sipTrunkId}/vns`, params);
        return toCursorResponse<VNDetails, VNDetails>(raw, (item) => item);
    }
}