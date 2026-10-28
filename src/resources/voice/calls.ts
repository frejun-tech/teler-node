import type { CursorResponse } from "../../types/common";
import type {
  CreateCallPayload,
  CallResponse,
  VoiceCallFilters,
  VoiceCallResponse,
  VoiceCallLegResponse
} from "../../types/voice";
import type { HttpResourceManager } from "../http";
import { autoPaginate } from "../../lib/pagination";
import { resolveIdempotencyKey } from "../../lib/idempotency";
import { config } from "../../config";

export class CallResourceManager {
  private readonly basePath = "/voice/calls";
  constructor(private readonly http: HttpResourceManager) {}

  /**
   * Initiate Call API
   *
   * @param payload - The parameters to create a call
   * @param idempotencyKey - Optional. Unique key (≤ 255 chars). Defaults to a SDK-generated UUID v4.
   * @param retry - Optional. Whether to retry on network errors/503s. (Default: false)
   * @param baseRetryDelayMs - Optional. Base delay (ms) for exponential backoff with jitter. (Default: 300, capped at 2000ms, per-request timeout: 5000ms)
   * @returns Response of the call
   */
  public async create(
    payload: CreateCallPayload,
    idempotencyKey?: string,
    retry?: boolean,
    baseRetryDelayMs?: number
  ): Promise<CallResponse> {
    const normalizedPayload = {
      ...payload,
      record: payload.record ?? true
    };
    const key = resolveIdempotencyKey(idempotencyKey);
    return this.http.post<CallResponse, CreateCallPayload>(
      `${this.basePath}/initiate`,
      normalizedPayload,
      {
        headers: { "Idempotency-Key": key },
        retry: retry,
        baseRetryDelayMs:
          baseRetryDelayMs ?? config.CALL_CONTROL_RETRY_BASE_DELAY_MS,
        maxRetryDelayMs: config.MAX_RETRY_DELAY_MS,
        config: { timeout: config.CALL_CONTROL_TIMEOUT_MS }
      }
    );
  }

  /**
   * List all voice calls.
   * Server-side default page size is 50 when `limit` is omitted
   * @param filters - Optional filters and cursor, which includes state, fromNumber, toNumber, createdAfter, createdBefore, limit, cursorAfter and cursorBefore.
   * @returns A list of voice calls.
   */
  public async list(
    filters?: VoiceCallFilters
  ): Promise<CursorResponse<VoiceCallResponse>> {
    return this.http.get<CursorResponse<VoiceCallResponse>, VoiceCallFilters>(
      this.basePath,
      filters
    );
  }

  /**
   * Auto-paginate through all voice calls, fetching further pages on demand
   * as you iterate.
   * @param filters - Optional filters, same as `list()` (`cursorAfter`/`cursorBefore` are managed internally).
   * @returns An async iterable of voice calls.
   */
  public listAutoPagination(
    filters?: VoiceCallFilters
  ): AsyncGenerator<VoiceCallResponse, void, undefined> {
    return autoPaginate<VoiceCallResponse, VoiceCallFilters>(
      (f: VoiceCallFilters | undefined) => this.list(f),
      filters
    );
  }

  /**
   * Fetch a voice call.
   * @param callId - The call ID to fetch
   * @returns Details of the voice call.
   */
  public async retrieve(callId: string): Promise<VoiceCallResponse> {
    return this.http.get<VoiceCallResponse>(`${this.basePath}/${callId}`);
  }

  /**
   * Fetch voice call legs.
   * @param callId - The call ID's legs to fetch
   * @returns Details of the voice call legs.
   */
  public async listLegs(
    callId: string
  ): Promise<CursorResponse<VoiceCallLegResponse>> {
    return this.http.get<CursorResponse<VoiceCallLegResponse>>(
      `${this.basePath}/${callId}/legs`
    );
  }
}
