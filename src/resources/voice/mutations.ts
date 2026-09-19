import type {
  HangupPayload,
  MutationResponse,
  MutePayload,
  DTMFPayload,
  PlayPayload
} from "../../types/voice";
import type { HttpResourceManager } from "../http";
import { resolveIdempotencyKey } from "../../lib/idempotency";
import { config } from "../../config";

export class MutationResourceManager {
  private readonly basePath = "/voice/calls";
  constructor(private readonly http: HttpResourceManager) {}

  /**
   * End a call, or a single leg of it. Omit `legId` to hang up the entire.
   *
   * @param callId         - The active call ID
   * @param payload        - The hangup payload
   * @param idempotencyKey - Optional. Unique key (≤ 255 chars). Defaults to a SDK-generated UUID v4.
   * @param retry - Optional. Whether to retry on network errors/503s. (Default: false)
   * @param baseRetryDelayMs - Optional. Base delay (ms) for exponential backoff with jitter. (Default: 300, capped at 2000ms, per-request timeout: 5000ms)
   * @returns Response of the hangup
   */
  public async hangup(
    callId: string,
    payload: HangupPayload,
    idempotencyKey?: string,
    retry?: boolean,
    baseRetryDelayMs?: number
  ): Promise<MutationResponse> {
    const key = resolveIdempotencyKey(idempotencyKey);
    return this.http.post<MutationResponse, HangupPayload>(
      `${this.basePath}/${callId}/hangup`,
      payload,
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
   * Mute (`on: true`) or unmute (`on: false`) a specific leg of a call.
   *
   * @param callId         - The active call ID
   * @param payload        - The mute/unmute payload
   * @param idempotencyKey - Optional. Unique key (≤ 255 chars). Defaults to a SDK-generated UUID v4.
   * @param retry - Optional. Whether to retry on network errors/503s. (Default: false)
   * @param baseRetryDelayMs - Optional. Base delay (ms) for exponential backoff with jitter. (Default: 300, capped at 2000ms, per-request timeout: 5000ms)
   * @returns Response of the action
   */
  public async mute(
    callId: string,
    payload: MutePayload,
    idempotencyKey?: string,
    retry?: boolean,
    baseRetryDelayMs?: number
  ): Promise<MutationResponse> {
    const key = resolveIdempotencyKey(idempotencyKey);
    return this.http.post<MutationResponse, MutePayload>(
      `${this.basePath}/${callId}/mute`,
      payload,
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
   * Send DTMF (touch-tone) digits on a call leg, e.g. to navigate an IVR.
   *
   * @param callId         - The active call ID
   * @param payload        - The DTMF payload
   * @param idempotencyKey - Optional. Unique key (≤ 255 chars). Defaults to a SDK-generated UUID v4.
   * @param retry - Optional. Whether to retry on network errors/503s. (Default: false)
   * @param baseRetryDelayMs - Optional. Base delay (ms) for exponential backoff with jitter. (Default: 300, capped at 2000ms, per-request timeout: 5000ms)
   * @returns Response of the DTMF action
   */
  public async dtmf(
    callId: string,
    payload: DTMFPayload,
    idempotencyKey?: string,
    retry?: boolean,
    baseRetryDelayMs?: number
  ): Promise<MutationResponse> {
    const key = resolveIdempotencyKey(idempotencyKey);
    return this.http.post<MutationResponse, DTMFPayload>(
      `${this.basePath}/${callId}/dtmf`,
      payload,
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
   * Play an audio file into the call. The response includes a `playbackId`
   *
   * @param callId         - The active call ID
   * @param payload        - The play payload
   * @param idempotencyKey - Optional. Unique key (≤ 255 chars). Defaults to a SDK-generated UUID v4.
   * @param retry - Optional. Whether to retry on network errors/503s. (Default: false)
   * @param baseRetryDelayMs - Optional. Base delay (ms) for exponential backoff with jitter. (Default: 300, capped at 2000ms, per-request timeout: 5000ms)
   * @returns Response of the play action
   */
  public async play(
    callId: string,
    payload: PlayPayload,
    idempotencyKey?: string,
    retry?: boolean,
    baseRetryDelayMs?: number
  ): Promise<MutationResponse> {
    const key = resolveIdempotencyKey(idempotencyKey);
    return this.http.post<MutationResponse, PlayPayload>(
      `${this.basePath}/${callId}/play`,
      payload,
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
}
