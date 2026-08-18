import { BadParametersException } from "./exceptions";
import { VoiceResourceManager } from "./resources/voice/voice";
import { SipResourceManager } from "./resources/sip/sip";
import { HttpResourceManager } from "./resources/http";
import { setLogLevel } from "./logger";
import { VirtualNumberResourceManager } from "./resources/vns";
import { EventResourceManager } from "./resources/events";
import { RecordingResourceManager } from "./resources/recordings";
import { SecretResourceManager } from "./resources/secrets";

export interface ClientOptions {
    logLevel?: string;
}

/**
 * Teler API Client.
 * 
 * Provides unified access to all Teler SDK resource managers including voice, sip, ip-acls, virtual numbers, events, recordings, and secrets.
 */
export class Client {
    private readonly apiKey:    string;
    private readonly baseURL:   string = 'https://api.frejun.ai/api/v1';
    
    private readonly    http:                   HttpResourceManager;
    public readonly     voice:                  VoiceResourceManager;
    public readonly     sip:                    SipResourceManager;
    public readonly     virtualNumbers:         VirtualNumberResourceManager;
    public readonly     events:                 EventResourceManager;
    public readonly     recordings:             RecordingResourceManager;
    public readonly     secrets:                SecretResourceManager;

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

        this.http               = new HttpResourceManager(this.apiKey, this.baseURL);
        this.voice              = new VoiceResourceManager(this.http)
        this.sip                = new SipResourceManager(this.http);
        this.virtualNumbers     = new VirtualNumberResourceManager(this.http);
        this.events             = new EventResourceManager(this.http);
        this.recordings         = new RecordingResourceManager(this.http);
        this.secrets            = new SecretResourceManager(this.http);
    }
}