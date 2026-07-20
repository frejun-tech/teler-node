import { BadParametersException } from "./exceptions";
import { VoiceResourceManager } from "./resources/voice/voice";
import { SipResourceManager } from "./resources/sip/sip";
import { HttpResourceManager } from "./resources/http";
import { setLogLevel } from "./logger";
import { VNResourceManager } from "./resources/vns";
import { EventResourceManager } from "./resources/events";
import { RecordingResourceManager } from "./resources/recordings";

export interface ClientOptions {
    logLevel?: string;
}

/**
 * Teler API Client.
 * 
 * Provides unified access to all Teler SDK resource managers including voice, SIP, virtual numbers (VNs), events, and recordings.
 */
export class Client {
    private readonly apiKey:    string;
    private readonly baseURL:   string = 'https://sandbox.frejun.ai/api/v1';
    
    private readonly    http:       HttpResourceManager;
    public readonly     voice:      VoiceResourceManager;
    public readonly     sip:        SipResourceManager;
    public readonly     vns:        VNResourceManager;
    public readonly     events:     EventResourceManager;
    public readonly     recordings: RecordingResourceManager;

    /**
     * Initializes the Teler Client.
     * 
     * @param apiKey - Teler API Key.
     * @param options - Optional configuration options.
     */
    constructor(apiKey: string, options?: ClientOptions) {
        if (!apiKey) throw new BadParametersException("API Key", "Missing Teler API Key. Please provide one when initializing the client.");
        this.apiKey = apiKey;

        if (options?.logLevel) {
            setLogLevel(options.logLevel);
        }

        this.http   = new HttpResourceManager(this.apiKey, this.baseURL);
        this.voice  = new VoiceResourceManager(this.http)
        this.sip    = new SipResourceManager(this.http);
        this.vns     = new VNResourceManager(this.http);
        this.events  = new EventResourceManager(this.http);
        this.recordings = new RecordingResourceManager(this.http);
    }
}