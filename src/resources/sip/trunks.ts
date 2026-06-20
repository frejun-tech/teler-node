import type { DefaultResponse } from "../../types/common";
import { CreateTrunkPayload, UpdateTrunkPayload, SIPTrunkResponse, ListTrunkFilters } from "../../types/trunk";
import { HttpResourceManager } from "../http";
import { ListVNFilters, VNListResponse } from "../../types/core";

export class TrunkResourceManager {
    private readonly basePath = '/sip/trunks';
    constructor(private readonly http: HttpResourceManager) {}

    /**
     * Create a new sip trunk
     * @param payload - CreateTrunkPayload.
     * @returns Details of the sip trunk.
     */
    public async create(payload: CreateTrunkPayload): Promise<SIPTrunkResponse> {
        return this.http.post<SIPTrunkResponse, CreateTrunkPayload>(`${this.basePath}`, payload);
    }

    /**
     * Fetch a sip trunk.
     * @param sipTrunkId - The sip trunk ID to fetch
     * @returns Details of the sip trunk.
     */
    public async get(sipTrunkId: string): Promise<SIPTrunkResponse> {
        return this.http.get<SIPTrunkResponse>(`${this.basePath}/${sipTrunkId}`);
    }
    
    /**
     * List all sip trunks.
     * @param params - Optional filters and cursor, which includes search, status, limit, cursor_after and cursor_before.
     * @returns A list of sip trunks.
     */
    public async list(params?: ListTrunkFilters): Promise<SIPTrunkResponse[]> {
        return this.http.get<SIPTrunkResponse[], ListTrunkFilters>(`${this.basePath}`, params);
    }

    /**
     * Update a sip trunk.
     * @param sipTrunkId - sip trunk ID to update, payload - UpdateTrunkPayload.
     * @returns Details of the updated trunk.
     */
    public async update(sipTrunkId: string, payload: UpdateTrunkPayload): Promise<SIPTrunkResponse> {
        return this.http.patch<SIPTrunkResponse, UpdateTrunkPayload>(`${this.basePath}/${sipTrunkId}`, payload);
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
    public async getVns(sipTrunkId: string, params?: ListVNFilters): Promise<VNListResponse> {
        return this.http.get<VNListResponse, ListVNFilters>(`${this.basePath}/${sipTrunkId}/vns`, params);
    }
}