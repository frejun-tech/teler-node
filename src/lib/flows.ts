export class CallFlow {
    /**
     * Build and return stream action flow.
     * 
     * @param {string} wsUrl - Remote WebSocket URL
     * @param {object} [options={}] - Options object
     * @param {string} [options.sampleRate="8k"] - Sample rate of Teler audio
     * @param {number} [options.chunkSize=400] - Chunk size of Teler audio
     * @param {boolean} [options.record=true] - Record the call
     * @returns {object} JSON response containing the stream details
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
     * @param {string} mediaUrl - URL of the audio to be played.
     * @returns {object} JSON response containing the play details
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
     * @returns {object} JSON response containing the hangup details
     */
    static hangup() {
        return {
            action: "hangup",
        }
    }
}