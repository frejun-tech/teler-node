import { CallResourceManager } from "./resources/calls";
import axios, { AxiosInstance } from "axios";
import { CreateCallPayload } from "./types";
import { TelerException, ForbiddenException, UnauthorizedException, BadParametersException } from "./exceptions";
import { TELER_BASE_URL } from "./constants";

export class Client {

    /**
     * HTTP Client for the Teler API.
     * 
     * Usage:
        const client = new Client(API_KEY);
        const response = await client.calls.create(
            {
                'flow_url': `https://${SERVER_DOMAIN}/api/v1/calls/flow`,
                'status_callback_url': `https://${SERVER_DOMAIN}/api/v1/webhooks/receiver`,
                'from_number': "+918065193777",
                'to_number': "+919954174459",
                'record': true,
            }
        )
    );
     */

    private apiKey: string;
    private httpClient: AxiosInstance;
    public calls: CallResourceManager;

    constructor(apiKey: string) {
        if (!apiKey) {
            throw new BadParametersException("API Key", "API KEY is required");
        }
        this.apiKey = apiKey;
        this.calls  = new CallResourceManager(this);
        this.httpClient = axios.create({
            baseURL: TELER_BASE_URL,
            timeout: 10000
        });
    }

    public async request<T>(method: string, path: string, data: CreateCallPayload): Promise<T> {
        /**
         * Initiates a Http request to Teler Server
         * 
         * @params
         * 1. method: HTTP method to use
         * 2. path: endpoint to call
         * 3. data: Payload
         * 
         * @returns
         * 1. message: Success/ failure
         * 2. data: info about the call 
        */

        try {
            const headers = {
                'Content-Type': 'application/json',
                "Accept": "application/json",
                'x-api-key': `${this.apiKey}`,
            };
            const response = await this.httpClient.request({
                method,
                url: path,
                data,
                headers,
            });
            return response?.data;
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const status = err.response?.status;
                const message = err.response?.data?.message || err.message;

                switch(status) {
                    case 401:
                        throw new UnauthorizedException();
                    case 403:
                        throw new ForbiddenException();
                    default:
                        throw new TelerException(`API Error: ${message}`, status);
                }
            }
            throw new TelerException("An unknown error occurred while calling the API.");
        }
    }
}