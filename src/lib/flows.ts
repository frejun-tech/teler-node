import type { DialNestedAction, RecordingType, RingbackMode } from "../types/common";

export class CallFlow {
    /**
     * Build and return stream action flow.
     * 
     * Opens a bidirectional WebSocket carrying real-time call audio
     * out to your server — used to pipe live audio into things like 
     * transcription, STT/TTS pipelines, or realtime AI voice models 
     * (ElevenLabs, VAPI, OpenAI Realtime, Gemini Live, etc.).
     * 
     * @param wsUrl - Remote WebSocket URL
     * @param options - Options object
     * @param options.flowUrl - Optional. Execute flow_url for the next flow. **(Beta)**
     * @param options.sampleRate - Sample rate of Teler audio (default: "8k")
     * @param options.chunkSize - Chunk size of Teler audio (default: 400)
     * @param options.record - Record the call (default: true)
     * @returns JSON response containing the stream details
     */
    static stream(wsUrl: string, options: { flowUrl?: string, sampleRate?: string, chunkSize?: number, record?: boolean } = {}) {
        return {
            action: "stream",
            ws_url: wsUrl,
            ...(options.flowUrl !== undefined && { flow_url: options.flowUrl }),
            sample_rate: options.sampleRate ?? "8k",
            chunk_size: options.chunkSize ?? 400,
            record: options.record ?? true
        };
    }

    /**
     * Build and return play action flow
     * 
     * Plays a single audio file into the call, then ends the flow 
     * (the call itself continues to whatever action comes next, or 
     * ends if this was the last step).
     * 
     * @param mediaUrl - URL of the audio to be played.
     * @param flowUrl - Optional. Execute flow_url for the next flow. **(Beta)**
     * @returns JSON response containing the play details
     */
    static play(mediaUrl: string, flowUrl?: string) {
        return {
            action: "play",
            media_url: mediaUrl,
            ...(flowUrl !== undefined && { flow_url: flowUrl })
        };
    }

    /**
     * Build and return hangup action flow
     * 
     * Ends the call immediately. No fields besides action.
     * 
     * @returns JSON response containing the hangup details
     */
    static hangup() {
        return {
            action: "hangup"
        };
    }

    /**
     * Build and return dial action flow.
     *
     * Originates an outbound leg from an in-progress call and bridges it
     * once the target answers. Requires the owning Voice App to be pinned
     * to webhook version 2026-06-01.
     *
     * @param to - E.164 phone number or SIP URI (e.g. "sip:user@host"). Single target only.
     * @param options - Options object
     * @param options.flowUrl - Execute flow_url for the next flow. **(Beta)**
     * @param options.timeout - Seconds to wait for pickup before treating as no-answer. Range 1..600 (default: 30)
     * @param options.record - Recording mode: `false`, `true`/"stereo", "mono", or "per_leg" (default: false)
     * @param options.customHeaders - Extra SIP headers on the outbound INVITE. Keys must start with "X-". Max 16 headers, values <= 256 bytes.
     * @param options.statusCallbackUrl - Override where lifecycle events for this dial land (defaults to the Voice App's webhook_url).
     * @param options.ringback - "passthrough" (caller hears target's ring) or "suppress" (silence until bridge) (default: "passthrough")
     * @param options.dialMusic - Nested action (`play` or `hangup`) played to the caller while the target rings.
     * @param options.confirmSound - Nested action (`play` or `hangup`) played to the target immediately after pickup, before bridging.
     * @param options.onNoAnswer - Nested action run on the caller's leg if the target doesn't answer within `timeout`.
     * @param options.onBusy - Nested action run if the target rejected with busy (486).
     * @param options.onFailure - Nested action run on any other failure.
     * 
     * @returns JSON response containing the dial details
     */
    static dial(
        to: string,
        options: {
            flowUrl?: string,
            timeout?: number,
            record?: boolean | RecordingType,
            customHeaders?: Record<string, string>,
            statusCallbackUrl?: string,
            ringback?: RingbackMode,
            dialMusic?: DialNestedAction,
            confirmSound?: DialNestedAction,
            onNoAnswer?: DialNestedAction,
            onBusy?: DialNestedAction,
            onFailure?: DialNestedAction
        } = {}
    ) {
        return {
            action: "dial",
            to,
            ...(options.flowUrl !== undefined && { flow_url: options.flowUrl }),
            timeout: options.timeout ?? 30,
            record: options.record ?? false,
            ...(options.customHeaders !== undefined && { custom_headers: options.customHeaders }),
            ...(options.statusCallbackUrl !== undefined && { status_callback_url: options.statusCallbackUrl }),
            ringback: options.ringback ?? "passthrough",
            ...(options.dialMusic !== undefined && { dial_music: options.dialMusic }),
            ...(options.confirmSound !== undefined && { confirm_sound: options.confirmSound }),
            ...(options.onNoAnswer !== undefined && { on_no_answer: options.onNoAnswer }),
            ...(options.onBusy !== undefined && { on_busy: options.onBusy }),
            ...(options.onFailure !== undefined && { on_failure: options.onFailure }),
        };
    }
}