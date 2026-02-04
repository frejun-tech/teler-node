export class CallFlow {
    static stream(wsUrl: string, options: { sampleRate?: string, chunkSize?: number, record?: boolean } = {}) {
        
        /**
         * Build and return stream action flow.
         * 
         * @params:
         * 1. wsUrl: Remote WebSocket URL
         * 2. sampleRate: Sample rate of Teler audio
         * 3. chunkSize: Chunk size of Teler audio
         * 4. record: Recording required
         * 
         * @returns
         * 1. JSON response contains the stream details
         * 
         */

        return {
            action: "stream",
            ws_url: wsUrl,
            sample_rate: options.sampleRate || "8k",
            chunk_size: options.chunkSize || 400,
            record: options.record || true,
        };
    }

    static play(fileUrl: string) {

        /**
         * Build and return play action flow
         * 
         * @param:
         * 1. fileUrl: URL of the audio to be played.
         * 
         * @returns
         * 1. JSON response contains the play details
         * 
         */

        return {
            action: "play",
            file_url: fileUrl,
        };
    }

    static hangup() {

        /**
         * Build and return hangup action flow
         * 
         * @returns
         * 1. JSON response contains the hangup details
         * 
         */

        return {
            "action": "hangup",
        }
    }
}