import type { TransferPayload, TransferResponse } from "../../types/voice";
import type { HttpResourceManager } from "../http";
import { resolveIdempotencyKey } from "../../lib/idempotency";


export class OperationResourceManager {
    private readonly basePath = '/voice/calls';
    constructor(private readonly http: HttpResourceManager) {}

    /**
     * Transfer an in-progress call to a new destination — a phone number
     *
     * @param callId         - The active call ID
     * @param payload        - The transfer payload
     * @param idempotencyKey - Optional. Unique key (≤ 255 chars). Defaults to a SDK-generated UUID v4.
     * @returns Response of the transfer
     */
    public async transfer(callId: string, payload: TransferPayload, idempotencyKey?: string): Promise<TransferResponse> {
        const key = resolveIdempotencyKey(idempotencyKey);
        return this.http.post<TransferResponse, TransferPayload>(
            `${this.basePath}/${callId}/transfer`,
            payload,
            { 'Idempotency-Key': key },
        );
    }
}