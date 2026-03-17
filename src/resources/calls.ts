import { Client } from "../client";
import { CreateCallPayload, CallResource } from "../types";

export class CallResourceManager {
    private client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    public async create(params: CreateCallPayload): Promise<CallResource> {
        /**
         * Creates payload of the request
         * 
         * @param
         * 1. params: type of CreateCallPayload
         * 
         * @returns
         * 1. Response of the call
        */

        const data: CreateCallPayload = {
            from_number: params.from_number,
            to_number: params.to_number,
            flow_url: params.flow_url,
            status_callback_url: params?.status_callback_url,
            record: params?.record ?? true
        };

        const response = await this.client.request<CallResource>('POST', '/calls/initiate', data);
        return response;
    }
}