import { StreamOP, StreamHandler, StreamType, StreamHandlerResult } from "../types";
import { NotImplementedException, BadParametersException, TelerException } from "../exceptions";

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
            console.log(`[StreamConnector]: Connected to ${this.remoteUrl}.`);
            while (messageQueue.length > 0) {
                const queuedMessage = messageQueue.shift();
                if (queuedMessage) {
                    remoteWs.send(queuedMessage);
                }
            }
        });

        callWs.addEventListener('message', async (event) => {

            /**
             * Event 'message' triggered when this server receives message from Teler(callWs)
             */

            try {
                const payload = event.data;
                const response: StreamHandlerResult = await this.callStreamHandler(payload);
                const [data, streamOp] = response;

                if(streamOp === StreamOP.RELAY) {
                    if (remoteWs.readyState === WebSocket.OPEN) {
                        console.log("[StreamConnector]: Relaying audio to AI Agent.");
                        remoteWs.send(data);
                    } else {
                        console.log("[StreamConnector]: Buffering message for Remote.");
                        messageQueue.push(data);
                    }
                } else if(streamOp === StreamOP.STOP) {
                    console.log("[StreamConnector]: Stream stopped by client.");
                    remoteWs.close();
                    callWs.close();
                }
            } catch(exception) {
                throw new TelerException(`❌ Invalid response from call stream handler: ${exception}`);
            }
        });
        
        remoteWs.addEventListener('message', async (event) => {

            /**
             * Event 'message' triggered when this server receives message from remoteWs(eg. AI agent)
             */

            try{
                const payload = event.data;
                const response: StreamHandlerResult = await this.remoteStreamHandler(payload);
                const [data, streamOp] = response;

                if(streamOp === StreamOP.RELAY) {
                    console.log("[StreamConnector]: Relaying audio to Teler.");
                    callWs.send(data);
                } else if(streamOp === StreamOP.STOP) {
                    console.log("[StreamConnector]: Stream stopped by client.");
                    callWs.close();
                    remoteWs.close();
                }
            } catch(exception) {
                throw new TelerException(`❌ Invalid response from remote stream handler: ${exception}`);
            }
        });

        remoteWs.addEventListener('close', event => {
            console.log('[StreamConnector]: Remote URL connection closed. ', event.code, event.reason);
            callWs.close();
        });

        callWs.addEventListener('close', event => {
            console.log("[StreamConnector]: Call disconnected. ", event.code, event.reason);
            remoteWs.close();
        })

        remoteWs.addEventListener('error', error => {
            console.error('[StreamConnector]: ❌ WebSocket error: ', error);
            callWs.close();
        });

        callWs.addEventListener('error', error => {
            console.error('[StreamConnector]: ❌ WebSocket error: ', error);
            remoteWs.close();
        });

    }

}