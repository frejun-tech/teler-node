import type { CursorResponse } from "../../types/common";
import type {
  CreateCallPayload,
  CallResponse,
  VoiceCallFilters,
  VoiceCallResponse,
  VoiceCallLegResponse
} from "../../types/voice";
import type { HttpResourceManager } from "../http";
import { autoPaginate } from "../../lib/pagination";

export class CallResourceManager {
  private readonly basePath = "/voice/calls";
  constructor(private readonly http: HttpResourceManager) {}

  /**
   * Initiate Call API
   *
   * @param payload - The parameters to create a call
   * @returns Response of the call
   */
  public async create(payload: CreateCallPayload): Promise<CallResponse> {
    const normalizedPayload = {
      ...payload,
      record: payload.record ?? true
    };
    return this.http.post<CallResponse, CreateCallPayload>(
      `${this.basePath}/initiate`,
      normalizedPayload
    );
  }

  /**
   * List all voice calls.
   * Server-side default page size is 50 when `limit` is omitted
   * @param filters - Optional filters and cursor, which includes state, fromNumber, toNumber, createdAfter, createdBefore, limit, cursorAfter and cursorBefore.
   * @returns A list of voice calls.
   */
  public async list(
    filters?: VoiceCallFilters
  ): Promise<CursorResponse<VoiceCallResponse>> {
    return this.http.get<CursorResponse<VoiceCallResponse>, VoiceCallFilters>(
      this.basePath,
      filters
    );
  }

  /**
   * Auto-paginate through all voice calls, fetching further pages on demand
   * as you iterate.
   * @param filters - Optional filters, same as `list()` (`cursorAfter`/`cursorBefore` are managed internally).
   * @returns An async iterable of voice calls.
   */
  public listAutoPagination(
    filters?: VoiceCallFilters
  ): AsyncGenerator<VoiceCallResponse, void, undefined> {
    return autoPaginate<VoiceCallResponse, VoiceCallFilters>(
      (f: VoiceCallFilters | undefined) => this.list(f),
      filters
    );
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
   * Fetch voice call legs.
   * @param callId - The call ID's legs to fetch
   * @returns Details of the voice call legs.
   */
  public async listLegs(
    callId: string
  ): Promise<CursorResponse<VoiceCallLegResponse>> {
    return this.http.get<CursorResponse<VoiceCallLegResponse>>(
      `${this.basePath}/${callId}/legs`
    );
  }
}
