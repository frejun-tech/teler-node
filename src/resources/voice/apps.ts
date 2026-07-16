import { VNDetails, VNFilters, VNResponse } from "../../types/core";
import { CreateAppPayload, VoiceAppResponse, AppFilters, UpdateAppPayload, VoiceAppDetails } from "../../types/app";
import type { DefaultResponse } from "../../types/common";
import { HttpResourceManager } from "../http";
import { RawCursorResponse, toCursorResponse } from "../../utils/cursor";


export class AppResourceManager {
    private readonly basePath = '/voice/apps';
    constructor(private readonly http: HttpResourceManager) {}

    /**
     * Create a new voice app.
     * @param payload - CreateAppPayload.
     * @returns Details of the voice app.
     */
    public async create(payload: CreateAppPayload): Promise<VoiceAppDetails> {
        return this.http.post<VoiceAppDetails, CreateAppPayload>(this.basePath, payload);
    }

    /**
     * List all voice apps.
     * @param params - Optional filters and cursor, which includes search, status, limit, cursor_after and cursor_before.
     * @returns A list of voice apps.
     */
    public async list(params?: AppFilters): Promise<VoiceAppResponse> {
        const raw = await this.http.get<RawCursorResponse<VoiceAppDetails>, AppFilters>(this.basePath, params);
        return toCursorResponse<VoiceAppDetails, VoiceAppDetails>(raw, (item) => item);
    }

    /**
     * Fetch a voice app.
     * @param voiceAppId - The voice app ID to fetch.
     * @returns Details of the voice app.
     */
    public async retrieve(voiceAppId: string): Promise<VoiceAppDetails> {
        return this.http.get<VoiceAppDetails>(`${this.basePath}/${voiceAppId}`);
    }

    /**
     * Update a voice app.
     * @param voiceAppId - voice app ID to update
     * @param payload - UpdateAppPayload with fields to update.
     * @returns Details of the updated voice app.
     */
    public async update(voiceAppId: string, payload: UpdateAppPayload): Promise<VoiceAppDetails> {
        return this.http.patch<VoiceAppDetails, UpdateAppPayload>(`${this.basePath}/${voiceAppId}`, payload);
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
    public async getVns(voiceAppId: string, params?: VNFilters): Promise<VNResponse> {
        const raw = await this.http.get<RawCursorResponse<VNDetails>, VNFilters>(`${this.basePath}/${voiceAppId}/vns`, params);
        return toCursorResponse<VNDetails, VNDetails>(raw, (item) => item);
    }
}