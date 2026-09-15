/* eslint-disable */
import { StreamOP, StreamType } from "../types/voice";
import type {
  StreamHandler,
  StreamHandlerResult,
  StreamData
} from "../types/voice";
import { NotImplementedException, BadParametersException } from "../exceptions";
import type { Logger } from "../logger";
import { noopLogger } from "../logger";
import { WebSocket } from "ws";

/**
 * Media Stream Connector Interface.
 *
 * Bridges the call stream to a remote websocket via pluggable handlers.
 */
export class StreamConnector {
  private streamType: StreamType;
  private remoteUrl: string;
  private remoteHeaders: Record<string, string>;
  private callStreamHandler: StreamHandler;
  private remoteStreamHandler: StreamHandler;
  private logger: Logger;

  constructor(
    remoteUrl: string,
    callStreamHandler: StreamHandler,
    remoteStreamHandler: StreamHandler,
    streamType: StreamType = StreamType.BIDIRECTIONAL,
    headers: Record<string, string> = {},
    logger?: Logger
  ) {
    this.remoteUrl = remoteUrl;
    this.streamType = streamType;
    this.callStreamHandler = callStreamHandler;
    this.remoteStreamHandler = remoteStreamHandler;
    this.remoteHeaders = headers;
    this.logger = logger ?? noopLogger;

    if (this.streamType === StreamType.UNIDIRECTIONAL) {
      throw new NotImplementedException({
        message: "Unidirectional streams are not supported yet."
      });
    }

    if (!this.remoteUrl?.trim()) {
      throw new BadParametersException({
        message: "remoteUrl is a required parameter.",
        details: "Please provide the remote websocket url to connect.",
        param: "remoteUrl"
      });
    }
    try {
      new URL(this.remoteUrl);
    } catch {
      throw new BadParametersException({
        message: "remoteUrl must be a valid URL.",
        details: "Please provide a valid remote websocket url.",
        param: "remoteUrl"
      });
    }
  }

  /**
   * Bridges stream between callWs and remoteWs
   *
   * @param callWs - Teler's websocket connection
   * @returns The remote WebSocket instance
   */
  public async bridgeStream(callWs: WebSocket): Promise<WebSocket> {
    const remoteWs = new WebSocket(this.remoteUrl, {
      headers: this.remoteHeaders
    });

    const messageQueue: StreamData[] = [];
    const MAX_QUEUE_SIZE = 100;

    remoteWs.addEventListener("open", () => {
      this.logger.info(
        {
          component: "StreamConnector",
          event: "connected",
          remote_url: this.remoteUrl
        },
        "Connected to remote server"
      );
      while (messageQueue.length > 0) {
        const queuedMessage = messageQueue.shift();
        if (queuedMessage) {
          remoteWs.send(queuedMessage);
        }
      }
    });

    /**
     * Event 'message' triggered when it receives message from Teler(callWs)
     */
    callWs.addEventListener("message", async (event) => {
      try {
        const payload =
          typeof event.data === "string"
            ? event.data
            : event.data.toString("utf-8");
        const response: StreamHandlerResult =
          await this.callStreamHandler(payload);
        const [data, streamOp] = response;

        if (streamOp === StreamOP.RELAY) {
          if (remoteWs.readyState === WebSocket.OPEN) {
            remoteWs.send(data);
          } else if (messageQueue.length < MAX_QUEUE_SIZE) {
            this.logger.info(
              { component: "StreamConnector" },
              "Buffering message for remote."
            );
            messageQueue.push(data);
          } else {
            this.logger.warn(
              { component: "StreamConnector" },
              "Message queue full, dropping message."
            );
          }
        } else if (streamOp === StreamOP.STOP) {
          this.logger.warn(
            { component: "StreamConnector", event: "stream_stopped" },
            "Stream stopped by client."
          );
          remoteWs.close();
          callWs.close();
        }
      } catch (exception) {
        const errorMessage =
          exception instanceof Error ? exception.message : String(exception);
        this.logger.error(
          { component: "StreamConnector", event: "call_stream_error" },
          `[StreamConnector]: Invalid response from call stream handler: ${errorMessage}`
        );
      }
    });

    /**
     * Event 'message' triggered when it receives message from remoteWs(eg. AI agent)
     */
    remoteWs.addEventListener("message", async (event) => {
      try {
        const payload: StreamData = Array.isArray(event.data)
          ? Buffer.concat(event.data)
          : event.data;
        const response: StreamHandlerResult =
          await this.remoteStreamHandler(payload);
        const [data, streamOp] = response;

        if (streamOp === StreamOP.RELAY) {
          callWs.send(data);
        } else if (streamOp === StreamOP.STOP) {
          this.logger.warn(
            { component: "StreamConnector", event: "stream_stopped" },
            "Stream stopped by client."
          );
          callWs.close();
          remoteWs.close();
        }
      } catch (exception) {
        const errorMessage =
          exception instanceof Error ? exception.message : String(exception);
        this.logger.error(
          { component: "StreamConnector", event: "remote_stream_error" },
          `[StreamConnector]: Invalid response from remote stream handler: ${errorMessage}`
        );
      }
    });

    remoteWs.addEventListener("close", (event) => {
      this.logger.warn(
        {
          component: "StreamConnector",
          event: "call_disconnected",
          code: event.code,
          reason: event.reason
        },
        "Remote URL connection closed."
      );
      callWs.close();
    });

    callWs.addEventListener("close", (event) => {
      this.logger.warn(
        {
          component: "StreamConnector",
          event: "call_disconnected",
          code: event.code,
          reason: event.reason
        },
        "Call disconnected."
      );
      remoteWs.close();
    });

    remoteWs.addEventListener("error", (error) => {
      this.logger.error(
        { component: "StreamConnector", event: "ws_error", reason: error },
        "WebSocket error"
      );
      callWs.close();
    });

    callWs.addEventListener("error", (error) => {
      this.logger.error(
        { component: "StreamConnector", event: "ws_error", reason: error },
        "WebSocket error"
      );
      remoteWs.close();
    });

    return remoteWs;
  }
}
