import { BadParametersException } from "./exceptions";
import { VoiceResourceManager } from "./resources/voice/voice";
import { SipResourceManager } from "./resources/sip/sip";
import { HttpResourceManager } from "./resources/http";
import { noopLogger, type Logger } from "./logger";
import { VirtualNumberResourceManager } from "./resources/vns";
import { EventResourceManager } from "./resources/events";
import { RecordingResourceManager } from "./resources/recordings";
import { SecretResourceManager } from "./resources/secrets";
import { config } from "./config";

export interface ClientOptions {
  baseURL?: string;
  logger?: Logger;
  baseTimeout?: number;
  recordingTimeout?: number;
}

/**
 * Teler API Client.
 *
 * Provides unified access to all Teler SDK resource managers including voice, sip, ip-acls, virtual numbers, events, recordings, and secrets.
 */
export class Client {
  private readonly apiKey: string;
  public readonly logger: Logger;
  private readonly baseURL: string = config.BASE_URL;
  private readonly recordingTimeout: number =
    config.RECORDING_DOWNLOAD_TIMEOUT_MS;

  private readonly http: HttpResourceManager;
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
      throw new BadParametersException({
        message: "Missing Teler API Key.",
        details: "Please provide the API Key when initializing the client.",
        param: "apiKey"
      });
    this.apiKey = apiKey;
    this.logger = options?.logger ?? noopLogger;

    if (options?.baseURL) {
      this.baseURL = options.baseURL;
    }
    if (options?.recordingTimeout) {
      this.recordingTimeout = options.recordingTimeout;
    }

    this.http = new HttpResourceManager(
      this.apiKey,
      this.baseURL,
      options?.baseTimeout
    );
    this.voice = new VoiceResourceManager(this.http);
    this.sip = new SipResourceManager(this.http);
    this.virtualNumbers = new VirtualNumberResourceManager(this.http);
    this.events = new EventResourceManager(this.http);
    this.recordings = new RecordingResourceManager(
      this.http,
      this.recordingTimeout
    );
    this.secrets = new SecretResourceManager(this.http);
  }
}
