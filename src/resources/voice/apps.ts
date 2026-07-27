import type { VirtualNumberResponse , VirtualNumberFilters } from "../../types/core";
import type { CreateVoiceAppPayload, VoiceAppFilters, UpdateVoiceAppPayload, VoiceAppResponse } from "../../types/voice";
import type { CursorResponse, DefaultResponse } from "../../types/common";
import type { HttpResourceManager } from "../http";


export class AppResourceManager {
    private readonly basePath = '/voice/apps';
    constructor(private readonly http: HttpResourceManager) {}

    /**
     * Create a new voice app.
     * @param payload - CreateVoiceAppPayload.
     * @returns Details of the voice app.
     */
    public async create(payload: CreateVoiceAppPayload): Promise<VoiceAppResponse> {
        return this.http.post<VoiceAppResponse, CreateVoiceAppPayload>(this.basePath, payload);
    }

    /**
     * List all voice apps.
     * @param filters - Optional filters and cursor, which includes search, status, limit, cursor_after and cursor_before.
     * @returns A list of voice apps.
     */
    public async list(filters?: VoiceAppFilters): Promise<CursorResponse<VoiceAppResponse>> {
        return this.http.get<CursorResponse<VoiceAppResponse>, VoiceAppFilters>(this.basePath, filters);
    }

    /**
     * Fetch a voice app.
     * @param voiceAppId - The voice app ID to fetch.
     * @returns Details of the voice app.
     */
    public async retrieve(voiceAppId: string): Promise<VoiceAppResponse> {
        return this.http.get<VoiceAppResponse>(`${this.basePath}/${voiceAppId}`);
    }

    /**
     * Update a voice app.
     * @param voiceAppId - voice app ID to update
     * @param payload - UpdateVoiceAppPayload with fields to update.
     * @returns Details of the updated voice app.
     */
    public async update(voiceAppId: string, payload: UpdateVoiceAppPayload): Promise<VoiceAppResponse> {
        return this.http.patch<VoiceAppResponse, UpdateVoiceAppPayload>(`${this.basePath}/${voiceAppId}`, payload);
    }

    /**
     * Delete a voice app.
     * @param voiceAppId - voice app ID to delete.
     * @returns success/ failure.
     */
    public async delete(voiceAppId: string): Promise<DefaultResponse> {
        return this.http.delete<DefaultResponse>(`${this.basePath}/${voiceAppId}`);
    }

    /**
     * Get virtual numbers assigned to a voice app.
     * @param voiceAppId - voice app ID to fetch vns.
     * @returns Details of the vns assigned to the voice app.
     */
    public async listVirtualNumbers(voiceAppId: string, params?: VirtualNumberFilters): Promise<CursorResponse<VirtualNumberResponse>> {
        return this.http.get<CursorResponse<VirtualNumberResponse>, VirtualNumberFilters>(`${this.basePath}/${voiceAppId}/virtual-numbers`, params);
    }
}