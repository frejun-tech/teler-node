import { StreamConnector } from "../lib/stream";
import type { StreamHandler, StreamType } from "../types/voice";
import type { Logger } from "../logger";

export class StreamConnectorResourceManager {
  constructor(private readonly logger: Logger) {}

  /**
   * Creates a StreamConnector instance for bridging call audio to a remote endpoint.
   *
   * @param remoteUrl Remote WebSocket URL to bridge audio to.
   * @param callStreamHandler Handler for messages from the call stream.
   * @param remoteStreamHandler Handler for messages from the remote stream.
   * @param streamType (Optional) Stream mode; defaults to BIDIRECTIONAL.
   * @param headers (Optional) HTTP headers for the remote connection.
   * @param connectTimeoutMs (Optional) Connection timeout in ms; defaults to 10,000ms.
   * @returns StreamConnector instance with client logger integrated.
   */
  public create(
    remoteUrl: string,
    callStreamHandler: StreamHandler,
    remoteStreamHandler: StreamHandler,
    streamType?: StreamType,
    headers?: Record<string, string>,
    connectTimeoutMs?: number
  ): StreamConnector {
    return new StreamConnector(
      remoteUrl,
      callStreamHandler,
      remoteStreamHandler,
      streamType,
      headers,
      this.logger,
      connectTimeoutMs
    );
  }
}
