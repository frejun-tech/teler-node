import type { HangupPayload, MutationResponse, MutePayload, DTMFPayload, PlayPayload } from "../../types/voice";
import type { HttpResourceManager } from "../http";
import { resolveIdempotencyKey } from "../../lib/idempotency";


export class MutationResourceManager {
    private readonly basePath = '/voice/calls';
    constructor(private readonly http: HttpResourceManager) {}

    /**
     * End a call, or a single leg of it. Omit `leg_id` to hang up the entire.
     *
     * @param callId         - The active call ID
     * @param payload        - The hangup payload
     * @param idempotencyKey - Optional. Unique key (≤ 255 chars). Defaults to a SDK-generated UUID v4.
     * @returns Response of the hangup
     */
    public async hangup(callId: string, payload: HangupPayload, idempotencyKey?: string): Promise<MutationResponse> {
        const key = resolveIdempotencyKey(idempotencyKey);
        return this.http.post<MutationResponse, HangupPayload>(
            `${this.basePath}/${callId}/hangup`,
            payload,
            { 'Idempotency-Key': key },
        );
    }

    /**
     * Mute (`on: true`) or unmute (`on: false`) a specific leg of a call.
     *
     * @param callId         - The active call ID
     * @param payload        - The mute/unmute payload
     * @param idempotencyKey - Optional. Unique key (≤ 255 chars). Defaults to a SDK-generated UUID v4.
     * @returns Response of the action
     */
    public async mute(callId: string, payload: MutePayload, idempotencyKey?: string): Promise<MutationResponse> {
        const key = resolveIdempotencyKey(idempotencyKey);
        return this.http.post<MutationResponse, MutePayload>(
            `${this.basePath}/${callId}/mute`,
            payload,
            { 'Idempotency-Key': key },
        );
    }

    /**
     * Send DTMF (touch-tone) digits on a call leg, e.g. to navigate an IVR.
     *
     * @param callId         - The active call ID
     * @param payload        - The DTMF payload
     * @param idempotencyKey - Optional. Unique key (≤ 255 chars). Defaults to a SDK-generated UUID v4.
     * @returns Response of the DTMF action
     */
    public async dtmf(callId: string, payload: DTMFPayload, idempotencyKey?: string): Promise<MutationResponse> {
        const key = resolveIdempotencyKey(idempotencyKey);
        return this.http.post<MutationResponse, DTMFPayload>(
            `${this.basePath}/${callId}/dtmf`,
            payload,
            { 'Idempotency-Key': key },
        );
    }

    /**
     * Play an audio file into the call. The response includes a `playback_id`
     *
     * @param callId         - The active call ID
     * @param payload        - The play payload
     * @param idempotencyKey - Optional. Unique key (≤ 255 chars). Defaults to a SDK-generated UUID v4.
     * @returns Response of the play action
     */
    public async play(callId: string, payload: PlayPayload, idempotencyKey?: string): Promise<MutationResponse> {
        const key = resolveIdempotencyKey(idempotencyKey);
        return this.http.post<MutationResponse, PlayPayload>(
            `${this.basePath}/${callId}/play`,
            payload,
            { 'Idempotency-Key': key },
        );
    }
}