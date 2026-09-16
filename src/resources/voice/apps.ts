import type {
  VirtualNumberResponse,
  VirtualNumberFilters
} from "../../types/core";
import type {
  CreateVoiceAppPayload,
  VoiceAppFilters,
  UpdateVoiceAppPayload,
  VoiceAppResponse
} from "../../types/voice";
import type { CursorResponse, DefaultResponse } from "../../types/common";
import type { HttpResourceManager } from "../http";
import { config } from "../../config";

export class AppResourceManager {
  private readonly basePath = "/voice/apps";
  constructor(private readonly http: HttpResourceManager) {}

  /**
   * Create a new voice app.
   * @param payload - CreateVoiceAppPayload.
   * @returns Details of the voice app.
   */
  public async create(
    payload: CreateVoiceAppPayload
  ): Promise<VoiceAppResponse> {
    const normalizedPayload = {
      ...payload,
      webhookApiVersion:
        payload.webhookApiVersion ?? config.DEFAULT_WEBHOOK_API_VERSION
    };
    return this.http.post<VoiceAppResponse, CreateVoiceAppPayload>(
      this.basePath,
      normalizedPayload
    );
  }

  /**
   * List all voice apps.
   * @param filters - Optional filters and cursor, which includes search, status, limit, cursorAfter and cursorBefore.
   * @returns A list of voice apps.
   */
  public async list(
    filters?: VoiceAppFilters
  ): Promise<CursorResponse<VoiceAppResponse>> {
    return this.http.get<CursorResponse<VoiceAppResponse>, VoiceAppFilters>(
      this.basePath,
      filters
    );
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
   * @param retry - Optional. Whether to retry on network errors/503s. (Default: false)
   * @param baseRetryDelayMs - Optional. Base delay (ms) for exponential backoff with jitter. (Default: 500, capped at 2000ms)
   * @returns Details of the updated voice app.
   */
  public async update(
    voiceAppId: string,
    payload: UpdateVoiceAppPayload,
    retry?: boolean,
    baseRetryDelayMs?: number
  ): Promise<VoiceAppResponse> {
    return this.http.patch<VoiceAppResponse, UpdateVoiceAppPayload>(
      `${this.basePath}/${voiceAppId}`,
      payload,
      { retry, baseRetryDelayMs }
    );
  }

  /**
   * Delete a voice app.
   * @param voiceAppId - voice app ID to delete.
   * @param retry - Optional. Whether to retry on network errors/503s. (Default: true)
   * @param baseRetryDelayMs - Optional. Base delay (ms) for exponential backoff with jitter. (Default: 100, capped at 2000ms)
   * @returns success/ failure.
   */
  public async delete(
    voiceAppId: string,
    retry?: boolean,
    baseRetryDelayMs?: number
  ): Promise<DefaultResponse> {
    return this.http.delete<DefaultResponse>(`${this.basePath}/${voiceAppId}`, {
      retry,
      baseRetryDelayMs
    });
  }

  /**
   * Get virtual numbers assigned to a voice app.
   * @param voiceAppId - voice app ID to fetch vns.
   * @param params - Optional filters and cursor for pagination.
   * @returns Details of the vns assigned to the voice app.
   */
  public async listVirtualNumbers(
    voiceAppId: string,
    params?: VirtualNumberFilters
  ): Promise<CursorResponse<VirtualNumberResponse>> {
    return this.http.get<
      CursorResponse<VirtualNumberResponse>,
      VirtualNumberFilters
    >(`${this.basePath}/${voiceAppId}/virtual-numbers`, params);
  }
}
