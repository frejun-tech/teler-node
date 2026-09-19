import { StreamOP, StreamType } from "../types/voice";
import type { StreamHandler, StreamData } from "../types/voice";
import { NotImplementedException, BadParametersException } from "../exceptions";
import type { Logger } from "../logger";
import { noopLogger } from "../logger";
import { WebSocket } from "ws";
import { once } from "node:events";

const MAX_QUEUE_SIZE = 50;
const CONNECT_TIMEOUT_MS = 10_000;
const HEARTBEAT_INTERVAL_MS = 15_000;

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
    let stopCallHeartbeat: (() => void) | null = null;
    let stopRemoteHeartbeat: (() => void) | null = null;

    const startHeartbeat = (
      ws: WebSocket,
      reject: (err: Error) => void,
      label: "call" | "remote"
    ): (() => void) => {
      let isAlive = true;

      const onPong = () => {
        isAlive = true;
      };
      ws.on("pong", onPong);

      const interval = setInterval(() => {
        if (!isAlive) {
          this.logger.warn(
            {
              component: "StreamConnector",
              event: "heartbeat_timeout",
              side: label
            },
            `${label} socket missed heartbeat, terminating`
          );
          clearInterval(interval);
          terminate(ws);
          reject(new Error(`${label} heartbeat timeout`));
          return;
        }
        isAlive = false;
        try {
          ws.ping();
        } catch (err) {
          this.logger.warn(
            {
              component: "StreamConnector",
              event: "heartbeat_ping_failed",
              side: label,
              err
            },
            `Failed to send ping on ${label} socket`
          );
        }
      }, HEARTBEAT_INTERVAL_MS);

      ws.once("close", () => clearInterval(interval));
      ws.once("error", () => clearInterval(interval));

      return () => {
        clearInterval(interval);
        ws.off("pong", onPong);
      };
    };

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
        terminate(callWs);
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
        terminate(remoteWs);
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
        let callWsSerializer: Promise<void> = Promise.resolve();
        stopCallHeartbeat = startHeartbeat(callWs, reject, "call");

        remoteWs.once("open", () => {
          stopRemoteHeartbeat = startHeartbeat(remoteWs, reject, "remote");
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
            if (remoteWs.readyState === WebSocket.OPEN && queuedMessage) {
              remoteWs.send(queuedMessage, (err?: Error) => {
                if (err) {
                  this.logger.error(
                    {
                      component: "StreamConnector",
                      event: "remote_failed",
                      error: err
                    },
                    "Error relaying queued message to Remote end."
                  );
                }
              });
            }
          }
        });

        callWs.on("message", (data: StreamData, isBinary: boolean) => {
          callWsSerializer = callWsSerializer.then(async () => {
            try {
              const payload = isBinary ? data : toPayloadString(data);
              const [outputData, streamOp] =
                await this.callStreamHandler(payload);

              if (streamOp === StreamOP.RELAY) {
                if (remoteWs.readyState === WebSocket.OPEN) {
                  remoteWs.send(outputData, (err?: Error) => {
                    if (err) {
                      this.logger.error(
                        {
                          component: "StreamConnector",
                          event: "remote_failed",
                          error: err
                        },
                        "Error relaying message to Remote end."
                      );
                    }
                  });
                } else if (callToRemoteQueue.length < MAX_QUEUE_SIZE) {
                  this.logger.warn(
                    {
                      component: "StreamConnector",
                      event: "queueing_for_remote"
                    },
                    "Queueing for remote"
                  );
                  callToRemoteQueue.push(outputData);
                  return;
                } else {
                  this.logger.warn(
                    { component: "StreamConnector" },
                    "Call-to-remote queue full, dropping message."
                  );
                  return;
                }
              } else if (streamOp === StreamOP.STOP) {
                this.logger.warn(
                  {
                    component: "StreamConnector",
                    event: "stream_stopped"
                  },
                  "Stream stopped by call-end."
                );
                stopCallHeartbeat?.();
                stopRemoteHeartbeat?.();
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
                `Call stream error: ${errorMessage}`
              );
              stopCallHeartbeat?.();
              stopRemoteHeartbeat?.();
              terminate(remoteWs);
              reject(new Error(`Call stream failed: ${errorMessage}`));
            }
          });
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
        let remoteWsSerializer: Promise<void> = Promise.resolve();

        remoteWs.on("message", (data: StreamData, isBinary: boolean) => {
          remoteWsSerializer = remoteWsSerializer.then(async () => {
            try {
              const payload = isBinary ? data : toPayloadString(data);
              const [outputData, streamOp] =
                await this.remoteStreamHandler(payload);

              if (
                callWs.readyState === WebSocket.OPEN &&
                streamOp === StreamOP.RELAY
              ) {
                callWs.send(outputData, (err?: Error) => {
                  if (err) {
                    this.logger.error(
                      {
                        component: "StreamConnector",
                        event: "call_stream_failed",
                        error: err
                      },
                      "Error relaying message to Teler."
                    );
                  }
                });
              } else if (streamOp === StreamOP.STOP) {
                this.logger.warn(
                  {
                    component: "StreamConnector",
                    event: "stream_stopped"
                  },
                  "Stream stopped by client."
                );
                stopCallHeartbeat?.();
                stopRemoteHeartbeat?.();
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
                `Remote stream error: ${errorMessage}`
              );
              stopCallHeartbeat?.();
              stopRemoteHeartbeat?.();
              terminate(callWs);
              reject(new Error(`Remote stream failed: ${errorMessage}`));
            }
          });
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
