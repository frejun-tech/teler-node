import { StreamOP, StreamHandler, StreamType, StreamHandlerResult } from "../types";
import { NotImplementedException, BadParametersException, TelerException } from "../exceptions";
import { logger } from "../logger";
import WebSocket from 'ws';

export class StreamConnector {

    /**
     * Media Stream Connector Interface.
     * 
     * Bridges the call stream to a remote websocket via pluggable handlers.
     */

    private streamType: StreamType | StreamType.BIDIRECTIONAL;
    private remoteUrl: string | "";
    private callStreamHandler: StreamHandler;
    private remoteStreamHandler: StreamHandler;

    static async defaultStreamHandler(message: string): Promise<StreamHandlerResult> {

        /**
         * Default Stream Handler
         */

        return [message, StreamOP.RELAY];
    }

    constructor(remoteUrl: string, streamType: StreamType = StreamType.BIDIRECTIONAL, callStreamHandler: StreamHandler = StreamConnector.defaultStreamHandler, remoteStreamHandler: StreamHandler = StreamConnector.defaultStreamHandler) {  
        this.remoteUrl = remoteUrl;
        this.streamType = streamType;
        this.callStreamHandler = callStreamHandler;
        this.remoteStreamHandler = remoteStreamHandler;

        if (this.streamType === StreamType.UNIDIRECTIONAL) {
            throw new NotImplementedException("Unidirectional streams are not supported yet.");
        }
        
        if (!this.remoteUrl || !this.remoteUrl.trim() || !URL.canParse(this.remoteUrl)) {
            throw new BadParametersException("remoteUrl", "remoteUrl is a required parameter.");
        }
        
    }

    public async bridgeStream(callWs: WebSocket): Promise<void> {

        /**
         * Bridges stream between callWs and remoteWs
         * 
         * @param
         * 1. callWs: Teler's websocket connection
         * 
         */

        const remoteWs = new WebSocket(this.remoteUrl);

        const messageQueue: string[] = [];
        
        remoteWs.addEventListener('open', () => {
            logger.info({ component: 'StreamConnector', event: 'connected', remote_url: this.remoteUrl }, 'Connected to remote server');
            while (messageQueue.length > 0) {
                const queuedMessage = messageQueue.shift();
                if (queuedMessage) {
                    remoteWs.send(queuedMessage);
                }
            }
        });

        callWs.addEventListener('message', async (event) => {

            /**
             * Event 'message' triggered when it receives message from Teler(callWs)
             */

            try {
                const payload = typeof event.data === 'string' ? event.data : event.data.toString('utf-8');
                const response: StreamHandlerResult = await this.callStreamHandler(payload);
                const [data, streamOp] = response;

                if(streamOp === StreamOP.RELAY) {
                    if (remoteWs.readyState === WebSocket.OPEN) {
                        remoteWs.send(data);
                    } else {
                        logger.info({ component: 'StreamConnector', remote_url: this.remoteUrl }, 'Buffering audio for Remote.');
                        messageQueue.push(data);
                    }
                } else if(streamOp === StreamOP.STOP) {
                    logger.warn({ component: 'StreamConnector', event: 'stream_stopped' }, 'Stream stopped by client.');
                    remoteWs.close();
                    callWs.close();
                }
            } catch(exception) {
                throw new TelerException(`[StreamConnector]: Invalid response from call stream handler: ${exception}`);
            }
        });
        
        remoteWs.addEventListener('message', async (event) => {

            /**
             * Event 'message' triggered when it receives message from remoteWs(eg. AI agent)
             */

            try{
                const payload = typeof event.data === 'string' ? event.data : event.data.toString('utf-8');
                const response: StreamHandlerResult = await this.remoteStreamHandler(payload);
                const [data, streamOp] = response;

                if(streamOp === StreamOP.RELAY) {
                    callWs.send(data);
                } else if(streamOp === StreamOP.STOP) {
                    logger.warn({ component: 'StreamConnector', event: 'stream_stopped' }, 'Stream stopped by client.');
                    callWs.close();
                    remoteWs.close();
                }
            } catch(exception) {
                throw new TelerException(`[StreamConnector]: Invalid response from remote stream handler: ${exception}`);
            }
        });

        remoteWs.addEventListener('close', event => {
            logger.warn({ component: 'StreamConnector', event: 'call_disconnected', code: event.code, reason: event.reason }, 'Remote URL connection closed.');
            callWs.close();
        });

        callWs.addEventListener('close', event => {
            logger.warn({ component: 'StreamConnector', event: 'call_disconnected', code: event.code, reason: event.reason }, 'Call disconnected.');
            remoteWs.close();
        })

        remoteWs.addEventListener('error', error => {
            logger.error({ component: 'StreamConnector', event: 'ws_error', reason: error }, 'WebSocket error');
            callWs.close();
        });
        
        callWs.addEventListener('error', (error) => {
            logger.error({ component: 'StreamConnector', event: 'ws_error', reason: error }, 'WebSocket error');
            remoteWs.close();
        });

    }

}