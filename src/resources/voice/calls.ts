import { CursorResponse } from "../../types/common";
import type { CreateCallPayload, CallResource, CreateCallParams, VoiceCallFilters, VoiceCallResponse, VoiceCallLegResponse } from "../../types/voice";
import { HttpResourceManager } from "../http";

export class CallResourceManager {
    private readonly basePath = '/voice/calls';
    constructor(private readonly http: HttpResourceManager) {}

    /**
     * Initiate Call API
     * 
     * @param params - The parameters to create a call
     * @returns Response of the call
     */
    public async create(params: CreateCallParams): Promise<CallResource> {
        const data: CreateCallPayload = {
            from_number: params.fromNumber,
            to_number: params.toNumber,
            flow_url: params.flowUrl,
            status_callback_url: params?.statusCallbackUrl,
            record: params?.record ?? true
        };

        return this.http.post<CallResource, CreateCallPayload>(`${this.basePath}/initiate`, data);
    }

    /**
     * List all voice calls.
     * @param filters - Optional filters and cursor, which includes state, from_number, to_number, created_after, created_before, limit, cursor_after and cursor_before.
     * @returns A list of voice calls.
     */
    public async list(filters?: VoiceCallFilters): Promise<CursorResponse<VoiceCallResponse>> {
        return this.http.get<CursorResponse<VoiceCallResponse>, VoiceCallFilters>(this.basePath, filters);
    }
    
    /**
     * Fetch a voice call.
     * @param callId - The call ID to fetch
     * @returns Details of the voice call.
     */
    public async retrieve(callId: string): Promise<VoiceCallResponse> {
        return this.http.get<VoiceCallResponse>(`${this.basePath}/${callId}`);
    }
    
    /**
     * Fetch a voice call legs.
     * @param callId - The call ID's legs to fetch
     * @returns Details of the voice call legs.
     */
    public async getLegs(callId: string): Promise<CursorResponse<VoiceCallLegResponse>> {
        return this.http.get<CursorResponse<VoiceCallLegResponse>>(`${this.basePath}/${callId}/legs`);
    }
}