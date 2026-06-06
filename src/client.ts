import { BadParametersException } from "./exceptions";
import { VoiceResourceManager } from "./resources/voice/voice";
import { SIPResourceManager } from "./resources/sip/sip";
import { HttpResourceManager } from "./resources/http";
import { setLogLevel } from "./logger";

export interface ClientOptions {
    logLevel?: string;
}

export class Client {
    private readonly apiKey: string;
    
    private readonly http: HttpResourceManager;
    public readonly voice: VoiceResourceManager;
    public readonly sip: SIPResourceManager;

    constructor(apiKey: string, options?: ClientOptions) {
        if (!apiKey) throw new BadParametersException("API Key", "Missing Teler API Key. Please provide one when initializing the client.");
        this.apiKey = apiKey;

        if (options?.logLevel) {
            setLogLevel(options.logLevel);
        }

        this.http   = new HttpResourceManager(this.apiKey);
        this.voice  = new VoiceResourceManager(this.http)
        this.sip    = new SIPResourceManager(this.http);
    }
}