import { BadParametersException } from "./exceptions";
import { CallResourceManager } from "./resources/calls";
import { VoiceResourceManager } from "./resources/voice/voice";
import { SipResourceManager } from "./resources/sip/sip";
import { HttpResourceManager } from "./resources/http";
import { setLogLevel } from "./logger";
import { VirtualNumberResourceManager } from "./resources/vns";
import { EventResourceManager } from "./resources/events";
import { RecordingResourceManager } from "./resources/recordings";
import { SecretResourceManager } from "./resources/secrets";
import { config } from "./config";

export interface ClientOptions {
  baseURL?: string;
  logLevel?: "info" | "warn" | "error" | "debug";
  timeout?: number;
}

/**
 * Teler API Client.
 *
 * Provides unified access to all Teler SDK resource managers including voice, sip, ip-acls, virtual numbers, events, recordings, and secrets.
 */
export class Client {
  private readonly apiKey: string;
  private readonly baseURL: string = config.BASE_URL;

  private readonly http: HttpResourceManager;
  public readonly calls: CallResourceManager;
  public readonly voice: VoiceResourceManager;
  public readonly sip: SipResourceManager;
  public readonly virtualNumbers: VirtualNumberResourceManager;
  public readonly events: EventResourceManager;
  public readonly recordings: RecordingResourceManager;
  public readonly secrets: SecretResourceManager;

  /**
   * Initializes the Teler Client.
   *
   * @param apiKey - Teler API Key.
   * @param options - Optional configuration options.
   */
  constructor(apiKey: string, options?: ClientOptions) {
    if (!apiKey)
      throw new BadParametersException(
        "Missing Teler API Key.",
        "Please provide the API Key when initializing the client.",
        400,
        "apiKey"
      );
    this.apiKey = apiKey;

    if (options?.logLevel) {
      setLogLevel(options.logLevel);
    }
    if (options?.baseURL) {
      this.baseURL = options.baseURL;
    }

    this.http = new HttpResourceManager(
      this.apiKey,
      this.baseURL,
      options?.timeout
    );
    this.calls = new CallResourceManager(this.http);
    this.voice = new VoiceResourceManager(this.http);
    this.sip = new SipResourceManager(this.http);
    this.virtualNumbers = new VirtualNumberResourceManager(this.http);
    this.events = new EventResourceManager(this.http);
    this.recordings = new RecordingResourceManager(this.http);
    this.secrets = new SecretResourceManager(this.http);
  }
}
