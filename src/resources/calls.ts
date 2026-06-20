// /**
//  * @legacy call intiate API
//  */
import { Client } from "../client";
import { CreateCallParams, CallResource } from "../types/call";

export class CallResourceManager {
    private client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    public async create(params: CreateCallParams): Promise<CallResource> {
        /**
         * Creates payload of the request
         * 
         * @param
         * 1. params: type of CreateCallParams
         * 
         * @returns
         * 1. Response of the call
        */

        const response = await this.client.voice.calls.create(params);
        return response;
    }
}