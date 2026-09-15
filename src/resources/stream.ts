import { StreamConnector } from "../lib/stream";
import type { StreamHandler, StreamType } from "../types/voice";
import type { Logger } from "../logger";

export class StreamConnectorResourceManager {
  constructor(private readonly logger: Logger) {}

  /**
   * Creates a StreamConnector instance for bridging call audio streams to a remote endpoint.
   *
   * The StreamConnector is instantiated with this client's logger, ensuring stream-level logs
   * are emitted to the same destination as other client operations.
   *
   * @param remoteUrl - The remote WebSocket URL to bridge call audio to (e.g., your AI agent endpoint)
   * @param callStreamHandler - Async handler invoked for each message received from the Teler call stream
   * @param remoteStreamHandler - Async handler invoked for each message received from the remote stream
   * @param streamType - (Optional) Stream mode; defaults to StreamType.BIDIRECTIONAL
   * @param headers - (Optional) HTTP headers sent when connecting to the remote WebSocket (e.g., Authorization)
   * @returns A configured StreamConnector instance with logging integrated
   * @example
   * const connector = await client.streamConnector.create(
   *   "wss://ai-agent.example.com/stream",
   *   async (msg) => [msg, StreamOP.RELAY],
   *   async (msg) => [msg, StreamOP.RELAY],
   *   StreamType.BIDIRECTIONAL,
   *   { Authorization: `Bearer ${token}` }
   * );
   * await connector.bridgeStream(webSocketFromCall);
   */
  public create(
    remoteUrl: string,
    callStreamHandler: StreamHandler,
    remoteStreamHandler: StreamHandler,
    streamType?: StreamType,
    headers?: Record<string, string>
  ): StreamConnector {
    return new StreamConnector(
      remoteUrl,
      callStreamHandler,
      remoteStreamHandler,
      streamType,
      headers,
      this.logger
    );
  }
}
