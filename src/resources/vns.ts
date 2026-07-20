import { AssignVNPayload, VNFilters, UnassignVNPayload, UpdateVNPayload, VNResponse } from "../types/core";
import { HttpResourceManager } from "./http";
import type { CursorResponse, DefaultResponse } from "../types/common";


export class VNResourceManager {
    private readonly basePath = '/vns';
    constructor(private readonly http: HttpResourceManager) {}

    /**
     * List all virtual numbers.
     * @param filters - Optional filters and cursor, which includes search, status, limit, cursor_after and cursor_before.
     * @returns A list of virtual numbers.
     */
    public async list(filters?: VNFilters): Promise<CursorResponse<VNResponse>> {
        return this.http.get<CursorResponse<VNResponse>, VNFilters>(this.basePath, filters);
    }

    /**
     * Update a virtual number.
     * @param vnId - virtual number ID to update.
     * @param payload - UpdateVNPayload with fields to update.
     * @returns Details of the updated virtual number.
     */
    public async update(vnId: string, payload: UpdateVNPayload): Promise<VNResponse> {
        return this.http.patch<VNResponse, UpdateVNPayload>(`${this.basePath}/${vnId}`, payload);
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