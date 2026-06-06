import { ListVNFilters, VNListResponse } from "../../types/core";
import { CreateAppPayload, VoiceAppResponse, ListAppFilters } from "../../types/app";
import type { UpdateAppPayload } from "../../types/app";
import type { DefaultResponse } from "../../types/common";
import { HttpResourceManager } from "../http";

// TODO: restrict dev from using AppResourceManager

export class AppResourceManager {
    private readonly basePath = '/voice/apps';
    constructor(private readonly http: HttpResourceManager) {}

    /**
     * Create a new voice app.
     * @param payload - CreateAppPayload.
     * @returns Details of the voice app.
     */
    public async create(payload: CreateAppPayload): Promise<VoiceAppResponse> {
        return this.http.post<VoiceAppResponse, CreateAppPayload>(this.basePath, payload);
    }

    /**
     * List all voice apps.
     * @param params - Optional filters and pagination, which includes limit, search, status, cursor_after and cursor_before.
     * @returns A list of voice apps.
     */
    public async list(params?: ListAppFilters): Promise<VoiceAppResponse[]> {
        return this.http.get<VoiceAppResponse[], ListAppFilters>(this.basePath, params);
    }

    /**
     * Get a voice app.
     * @param voiceAppId - The voice app ID to fetch.
     * @returns Details of the voice app.
     */
    public async get(voiceAppId: string): Promise<VoiceAppResponse> {
        return this.http.get<VoiceAppResponse>(`${this.basePath}/${voiceAppId}`);
    }

    /**
     * Update a voice app.
     * @param voiceAppId - voice app ID to update
     * @param payload - UpdateAppPayload with fields to update.
     * @returns Details of the updated voice app.
     */
    public async update(voiceAppId: string, payload: UpdateAppPayload): Promise<VoiceAppResponse> {
        return this.http.patch<VoiceAppResponse, UpdateAppPayload>(`${this.basePath}/${voiceAppId}`, payload);
    }

    /**
     * Delete a voice app.
     * @param voiceAppId - voice app ID to delete.
     * @returns A confirmation of the deletion.
     */
    public async delete(voiceAppId: string): Promise<DefaultResponse> {
        return this.http.delete<DefaultResponse>(`${this.basePath}/${voiceAppId}`);
    }

    /**
     * Get virtual numbers assigned to a voice app.
     * @param voiceAppId - voice app ID to fetch vns.
     * @returns Details of the vns assigned to the voice app.
     */
    public async getVns(voiceAppId: string, params?: ListVNFilters): Promise<VNListResponse> {
        return this.http.get<VNListResponse, ListVNFilters>(`${this.basePath}/${voiceAppId}/vns`, params);
    }
}