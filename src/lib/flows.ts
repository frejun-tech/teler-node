export class CallFlow {
    /**
     * Build and return stream action flow.
     * 
     * @param wsUrl - Remote WebSocket URL
     * @param options - Options object
     * @param options.sampleRate - Sample rate of Teler audio (default: "8k")
     * @param options.chunkSize - Chunk size of Teler audio (default: 400)
     * @param options.record - Record the call (default: true)
     * @returns JSON response containing the stream details
     */
    static stream(wsUrl: string, options: { sampleRate?: string, chunkSize?: number, record?: boolean } = {}) {
        return {
            action: "stream",
            ws_url: wsUrl,
            sample_rate: options.sampleRate ?? "8k",
            chunk_size: options.chunkSize ?? 400,
            record: options.record ??  true,
        };
    }

    /**
     * Build and return play action flow
     * 
     * @param mediaUrl - URL of the audio to be played.
     * @returns JSON response containing the play details
     */
    static play(mediaUrl: string) {
        return {
            action: "play",
            media_url: mediaUrl,
        };
    }

    /**
     * Build and return hangup action flow
     * 
     * @returns JSON response containing the hangup details
     */
    static hangup() {
        return {
            action: "hangup",
        }
    }
}