import type { TransferPayload, TransferResponse } from "../../types/voice";
import type { HttpResourceManager } from "../http";
import { resolveIdempotencyKey } from "../../lib/idempotency";

export class OperationResourceManager {
  private readonly basePath = "/voice/calls";
  constructor(private readonly http: HttpResourceManager) {}

  /**
   * Transfer an in-progress call to a new destination — a phone number
   *
   * @param callId         - The active call ID
   * @param payload        - The transfer payload
   * @param idempotencyKey - Optional. Unique key (≤ 255 chars). Defaults to a SDK-generated UUID v4.
   * @param retry - Optional. Whether to retry on network errors/503s. (Default: false)
   * @param baseRetryDelayMs - Optional. Base delay (ms) for exponential backoff. (Default: 5000)
   * @returns Response of the transfer
   */
  public async transfer(
    callId: string,
    payload: TransferPayload,
    idempotencyKey?: string,
    retry?: boolean,
    baseRetryDelayMs?: number,
  ): Promise<TransferResponse> {
    const key = resolveIdempotencyKey(idempotencyKey);
    return this.http.post<TransferResponse, TransferPayload>(
      `${this.basePath}/${callId}/transfer`,
      payload,
      {
        headers: { "Idempotency-Key": key },
        retry: retry,
        baseRetryDelayMs: baseRetryDelayMs,
      },
    );
  }
}
