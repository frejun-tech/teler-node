export class CallFlow {
    static stream(wsUrl: string, options: { sampleRate?: string, chunkSize?: number, record?: boolean } = {}) {
        
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

        return {
            action: "stream",
            ws_url: wsUrl,
            sample_rate: options.sampleRate ?? "8k",
            chunk_size: options.chunkSize ?? 400,
            record: options.record ??  true,
        };
    }

    static play(mediaUrl: string) {

        /**
         * Build and return play action flow
         * 
         * @param {string} mediaUrl - URL of the audio to be played.
         * @returns {object} JSON response containing the play details
         */

        return {
            action: "play",
            media_url: mediaUrl,
        };
    }

    static hangup() {

        /**
         * Build and return hangup action flow
         * 
         * @returns {object} JSON response containing the hangup details
         */

        return {
            action: "hangup",
        }
    }
}