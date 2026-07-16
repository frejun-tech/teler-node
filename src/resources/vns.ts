import { AssignVNPayload, VNFilters, UnassignVNPayload, UpdateVNPayload, VNResponse, VNDetails } from "../types/core";
import { HttpResourceManager } from "./http";
import type { DefaultResponse } from "../types/common";
import { RawCursorResponse, toCursorResponse } from "../utils/cursor";


export class VNResourceManager {
    private readonly basePath = '/vns';
    constructor(private readonly http: HttpResourceManager) {}

    /**
     * List all virtual numbers.
     * @param params - Optional filters and cursor, which includes search, status, limit, cursor_after and cursor_before.
     * @returns A list of virtual numbers.
     */
    public async list(params?: VNFilters): Promise<VNResponse> {
        const raw = await this.http.get<RawCursorResponse<VNDetails>, VNFilters>(this.basePath, params);
        return toCursorResponse<VNDetails, VNDetails>(raw, (item) => item);
    }

    /**
     * Update a virtual number.
     * @param vnId - virtual number ID to update.
     * @param payload - UpdateVNPayload with fields to update.
     * @returns Details of the updated virtual number.
     */
    public async update(vnId: string, payload: UpdateVNPayload): Promise<VNDetails> {
        return this.http.patch<VNDetails, UpdateVNPayload>(`${this.basePath}/${vnId}`, payload);
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