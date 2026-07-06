import { BadParametersException } from "./exceptions";
import { VoiceResourceManager } from "./resources/voice/voice";
import { SIPResourceManager } from "./resources/sip/sip";
import { HttpResourceManager } from "./resources/http";
import { setLogLevel } from "./logger";
import { VNResourceManager } from "./resources/vns/vn";

export interface ClientOptions {
    logLevel?: string;
}

export class Client {
    private readonly apiKey:    string;
    private readonly baseURL:   string = 'http://localhost:8000/api/v1';
    
    private readonly    http:   HttpResourceManager;
    public readonly     voice:  VoiceResourceManager;
    public readonly     sip:    SIPResourceManager;
    public readonly     vn:     VNResourceManager;

    constructor(apiKey: string, options?: ClientOptions) {
        if (!apiKey) throw new BadParametersException("API Key", "Missing Teler API Key. Please provide one when initializing the client.");
        this.apiKey = apiKey;

        if (options?.logLevel) {
            setLogLevel(options.logLevel);
        }

        this.http   = new HttpResourceManager(this.apiKey, this.baseURL);
        this.voice  = new VoiceResourceManager(this.http)
        this.sip    = new SIPResourceManager(this.http);
        this.vn     = new VNResourceManager(this.http);
    }
}