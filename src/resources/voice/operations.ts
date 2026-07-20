import { TransferPayload, TransferResponse } from "../../types/voice";
import { HttpResourceManager } from "../http";
import { NotImplementedException } from "../../exceptions";
import { resolveIdempotencyKey } from "../../lib/idempotency";


export class OperationResourceManager {
    private readonly basePath = '/voice/calls';
    constructor(private readonly http: HttpResourceManager) {}

    /**
     * Initiate call transfer on an active call
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