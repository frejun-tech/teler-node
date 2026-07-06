import { AssignVNPayload, ListVNFilters, UnassignVNPayload, UpdateVNPayload, VNListResponse } from "../../types/core";
import { HttpResourceManager } from "../http";
import type { DefaultResponse } from "../../types/common";


export class VNResourceManager {
    private readonly basePath = '/vns';
    constructor(private readonly http: HttpResourceManager) {}

    /**
     * List all virtual numbers.
     * @param params - Optional filters and cursor, which includes search, status, limit, cursor_after and cursor_before.
     * @returns A list of virtual numbers.
     */
    public async list(params?: ListVNFilters): Promise<VNListResponse[]> {
        return this.http.get<VNListResponse[], ListVNFilters>(this.basePath, params);
    }

    /**
     * Update a virtual number.
     * @param vnId - virtual number ID to update.
     * @param payload - UpdateVNPayload with fields to update.
     * @returns Details of the updated virtual number.
     */
    public async update(vnId: string, payload: UpdateVNPayload): Promise<VNListResponse> {
        return this.http.patch<VNListResponse, UpdateVNPayload>(`${this.basePath}/${vnId}`, payload);
    }

    /**
     * Assign virtual number/s.
     * @param payload - AssignVNPayload.
     * @returns success/ failure.
     */
    public async assignVn(payload: AssignVNPayload): Promise<DefaultResponse> {
        return this.http.post<DefaultResponse, AssignVNPayload>(`${this.basePath}/assign-vns`, payload);
    }

    /**
     * Unassign virtual number/s.
     * @param payload - UnassignVNPayload.
     * @returns success/ failure.
     */
    public async unassignVn(payload: UnassignVNPayload): Promise<DefaultResponse> {
        return this.http.patch<DefaultResponse, UnassignVNPayload>(`${this.basePath}/unassign-vns`, payload);
    }
}