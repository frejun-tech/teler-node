import type { CreateCallPayload, CallResource, CreateCallParams } from "../../types/call";
import { HttpResourceManager } from "../http";

export class CallResourceManager {
    private readonly basePath = '/voice/calls';
    constructor(private readonly http: HttpResourceManager) {}

    /**
     * Initiate Call API
     * 
     * @param {CreateCallParams} params - The parameters to create a call
     * @returns {Promise<CallResource>} Response of the call
     */
    public async create(params: CreateCallParams): Promise<CallResource> {
        const data: CreateCallPayload = {
            from_number: params.fromNumber,
            to_number: params.toNumber,
            flow_url: params.flowUrl,
            status_callback_url: params?.statusCallbackUrl,
            record: params?.record ?? true
        };

        const response = this.http.post<CallResource, CreateCallPayload>(`${this.basePath}/initiate`, data);
        return response;
    }
}