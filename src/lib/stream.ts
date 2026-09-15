import { StreamOP, StreamType } from "../types/voice";
import type { StreamHandler, StreamData } from "../types/voice";
import { NotImplementedException, BadParametersException } from "../exceptions";
import type { Logger } from "../logger";
import { noopLogger } from "../logger";
import { WebSocket } from "ws";
import { once } from "node:events";

const MAX_QUEUE_SIZE = 50;
const CONNECT_TIMEOUT_MS = 10_000;

/**
 *  * Media Stream Connector Interface.
 *
 * Bridges bidirectional audio between a Teler call and a remote endpoint (e.g. AI agent) via pluggable handlers.
 * Handles message relaying, buffering, error cleanup, and connection timeouts.
 */
export class StreamConnector {
  private streamType: StreamType;
  private remoteUrl: string;
  private remoteHeaders: Record<string, string>;
  private callStreamHandler: StreamHandler;
  private remoteStreamHandler: StreamHandler;
  private logger: Logger;
  private timeout: number;

  /**
   * @param remoteUrl Remote WebSocket URL to bridge to.
   * @param callStreamHandler Handler for messages from the call stream.
   * @param remoteStreamHandler Handler for messages from the remote stream.
   * @param streamType Stream mode (defaults to BIDIRECTIONAL).
   * @param headers Optional HTTP headers for the remote connection.
   * @param logger Optional logger instance.
   * @param timeout Optional connection timeout in ms (defaults to 10,000ms).
   */
  constructor(
    remoteUrl: string,
    callStreamHandler: StreamHandler,
    remoteStreamHandler: StreamHandler,
    streamType: StreamType = StreamType.BIDIRECTIONAL,
    headers: Record<string, string> = {},
    logger?: Logger,
    timeout?: number
  ) {
    this.remoteUrl = remoteUrl;
    this.streamType = streamType;
    this.callStreamHandler = callStreamHandler;
    this.remoteStreamHandler = remoteStreamHandler;
    this.remoteHeaders = headers;
    this.logger = logger ?? noopLogger;
    this.timeout = timeout ?? CONNECT_TIMEOUT_MS;

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
   * Bridges bidirectional stream between call and remote WebSocket.
   *
   * @param callWs Teler's WebSocket connection from the call
   * @returns Remote WebSocket once connected (or error if timeout/failure)
   */
  public async bridgeStream(callWs: WebSocket): Promise<WebSocket> {
    const remoteWs = new WebSocket(this.remoteUrl, {
      headers: this.remoteHeaders
    });

    const callToRemoteQueue: StreamData[] = [];

    const terminate = (ws: WebSocket): void => {
      try {
        if (ws.readyState !== WebSocket.CLOSED) {
          ws.terminate();
        }
      } catch (err) {
        this.logger.error(
          { component: "StreamConnector", err },
          "Error terminating WebSocket"
        );
      }
    };

    const cleanup = (): void => {
      try {
        if (callWs.readyState !== WebSocket.CLOSED) {
          callWs.close();
        }
      } catch (err) {
        this.logger.error(
          { component: "StreamConnector", err },
          "Error closing call WebSocket"
        );
      }
      try {
        if (remoteWs.readyState !== WebSocket.CLOSED) {
          remoteWs.close();
        }
      } catch (err) {
        this.logger.error(
          { component: "StreamConnector", err },
          "Error closing remote WebSocket"
        );
      }
    };

    const toPayloadString = (data: StreamData): string => {
      if (typeof data === "string") return data;
      if (Buffer.isBuffer(data)) return data.toString("utf-8");
      if (Array.isArray(data)) return Buffer.concat(data).toString("utf-8");
      return Buffer.from(data).toString("utf-8");
    };

    const relayCallToRemote = (): Promise<void> =>
      new Promise<void>((resolve, reject) => {
        remoteWs.once("open", () => {
          this.logger.info(
            {
              component: "StreamConnector",
              event: "connected",
              remote_url: this.remoteUrl
            },
            "Connected to remote server"
          );
          while (callToRemoteQueue.length > 0) {
            const queuedMessage = callToRemoteQueue.shift();
            if (queuedMessage) {
              remoteWs.send(queuedMessage);
            }
          }
        });

        callWs.on("message", (data: StreamData, isBinary: boolean) => {
          (async () => {
            try {
              const payload = isBinary ? data : toPayloadString(data);
              const response = await this.callStreamHandler(payload);
              const [outputData, streamOp] = response;

              if (streamOp === StreamOP.RELAY) {
                if (remoteWs.readyState === WebSocket.OPEN) {
                  remoteWs.send(outputData);
                } else if (callToRemoteQueue.length < MAX_QUEUE_SIZE) {
                  this.logger.warn(
                    {
                      component: "StreamConnector",
                      event: "queueing_for_remote"
                    },
                    "Queueing for remote"
                  );
                  callToRemoteQueue.push(outputData);
                } else {
                  this.logger.warn(
                    { component: "StreamConnector" },
                    "Call-to-remote queue full, dropping message."
                  );
                }
              } else if (streamOp === StreamOP.STOP) {
                this.logger.warn(
                  {
                    component: "StreamConnector",
                    event: "stream_stopped"
                  },
                  "Stream stopped by client."
                );
                cleanup();
                resolve();
              }
            } catch (exception) {
              const errorMessage =
                exception instanceof Error
                  ? exception.message
                  : String(exception);
              this.logger.error(
                { component: "StreamConnector", event: "call_stream_error" },
                `Call stream handler error: ${errorMessage}`
              );
              terminate(remoteWs);
              reject(new Error(`Call stream handler failed: ${errorMessage}`));
            }
          })().catch(() => {});
        });

        callWs
          .once("close", () => {
            this.logger.warn(
              {
                component: "StreamConnector",
                event: "call_disconnected"
              },
              "Call disconnected."
            );
            cleanup();
            resolve();
          })
          .once("error", (err) => {
            this.logger.error(
              { component: "StreamConnector", event: "ws_error" },
              "Call WebSocket error"
            );
            terminate(remoteWs);
            reject(new Error(`Call stream handler error: ${err}`));
          });
      });

    const relayRemoteToCall = (): Promise<void> =>
      new Promise<void>((resolve, reject) => {
        remoteWs.on("message", (data: StreamData, isBinary: boolean) => {
          (async () => {
            try {
              this.logger.info(
                {
                  component: "StreamConnector",
                  event: "remote_message_received"
                },
                "Message received from remote"
              );
              const payload = isBinary ? data : toPayloadString(data);
              const response = await this.remoteStreamHandler(payload);
              const [outputData, streamOp] = response;

              if (streamOp === StreamOP.RELAY) {
                this.logger.warn(
                  { component: "StreamConnector", event: "sending_to_call" },
                  "Sending to call"
                );
                callWs.send(outputData);
              } else if (streamOp === StreamOP.STOP) {
                this.logger.warn(
                  {
                    component: "StreamConnector",
                    event: "stream_stopped"
                  },
                  "Stream stopped by client."
                );
                cleanup();
                resolve();
              }
            } catch (exception) {
              const errorMessage =
                exception instanceof Error
                  ? exception.message
                  : String(exception);
              this.logger.error(
                { component: "StreamConnector", event: "remote_stream_error" },
                `Remote stream handler error: ${errorMessage}`
              );
              terminate(callWs);
              reject(
                new Error(`Remote stream handler failed: ${errorMessage}`)
              );
            }
          })().catch(() => {});
        });

        remoteWs
          .once("close", () => {
            this.logger.warn(
              {
                component: "StreamConnector",
                event: "remote_disconnected"
              },
              "Remote disconnected."
            );
            cleanup();
            resolve();
          })
          .once("error", (err) => {
            this.logger.error(
              { component: "StreamConnector", event: "ws_error" },
              "Remote WebSocket error"
            );
            terminate(callWs);
            reject(new Error(`Remote stream handler error: ${err}`));
          });
      });

    void (async () => {
      try {
        await Promise.race([relayCallToRemote(), relayRemoteToCall()]);
      } catch (err) {
        this.logger.error(
          { component: "StreamConnector", err },
          "Stream bridging terminated with an error"
        );
      } finally {
        cleanup();
      }
    })();

    try {
      const openPromise = once(remoteWs, "open");
      let timeoutHandle: NodeJS.Timeout | null = null;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(
            new Error(
              `Remote server connection timeout after ${this.timeout}ms`
            )
          );
        }, this.timeout);
      });
      try {
        await Promise.race([openPromise, timeoutPromise]);
        openPromise.catch(() => {});
      } finally {
        if (timeoutHandle) clearTimeout(timeoutHandle);
      }
    } catch (err) {
      this.logger.error(
        { component: "StreamConnector", event: "remote_connect_failed", err },
        "Failed to connect to remote server"
      );
      terminate(remoteWs);
      terminate(callWs);
      throw err;
    }

    return remoteWs;
  }
}
