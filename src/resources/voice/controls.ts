import { HangupPayload, ControlResponse, MutePayload, DTMFPayload, PlayPayload } from "../../types/voice";
import { HttpResourceManager } from "../http";
import { resolveIdempotencyKey } from "../../lib/idempotency";


export class ControlResourceManager {
    private readonly basePath = '/voice/calls';
    constructor(private readonly http: HttpResourceManager) {}

    /**
     * Invoke hangup on an active call
     *
     * @param callId         - The active call ID
     * @param payload        - The hangup payload
     * @param idempotencyKey - Optional. Unique key (≤ 255 chars). Defaults to a SDK-generated UUID v4.
     * @returns Response of the hangup
     */
    public async hangup(callId: string, payload: HangupPayload, idempotencyKey?: string): Promise<ControlResponse> {
        const key = resolveIdempotencyKey(idempotencyKey);
        return this.http.post<ControlResponse, HangupPayload>(
            `${this.basePath}/${callId}/hangup`,
            payload,
            { 'Idempotency-Key': key },
        );
    }

    /**
     * Mute or unmute an active call
     *
     * @param callId         - The active call ID
     * @param payload        - The mute/unmute payload
     * @param idempotencyKey - Optional. Unique key (≤ 255 chars). Defaults to a SDK-generated UUID v4.
     * @returns Response of the action
     */
    public async mute(callId: string, payload: MutePayload, idempotencyKey?: string): Promise<ControlResponse> {
        const key = resolveIdempotencyKey(idempotencyKey);
        return this.http.post<ControlResponse, MutePayload>(
            `${this.basePath}/${callId}/mute`,
            payload,
            { 'Idempotency-Key': key },
        );
    }

    /**
     * Send DTMF tones on an active call
     *
     * @param callId         - The active call ID
     * @param payload        - The DTMF payload
     * @param idempotencyKey - Optional. Unique key (≤ 255 chars). Defaults to a SDK-generated UUID v4.
     * @returns Response of the DTMF action
     */
    public async dtmf(callId: string, payload: DTMFPayload, idempotencyKey?: string): Promise<ControlResponse> {
        const key = resolveIdempotencyKey(idempotencyKey);
        return this.http.post<ControlResponse, DTMFPayload>(
            `${this.basePath}/${callId}/dtmf`,
            payload,
            { 'Idempotency-Key': key },
        );
    }

    /**
     * Play audio in an active call
     *
     * @param callId         - The active call ID
     * @param payload        - The play payload
     * @param idempotencyKey - Optional. Unique key (≤ 255 chars). Defaults to a SDK-generated UUID v4.
     * @returns Response of the play action
     */
    public async play(callId: string, payload: PlayPayload, idempotencyKey?: string): Promise<ControlResponse> {
        const key = resolveIdempotencyKey(idempotencyKey);
        return this.http.post<ControlResponse, PlayPayload>(
            `${this.basePath}/${callId}/play`,
            payload,
            { 'Idempotency-Key': key },
        );
    }
}