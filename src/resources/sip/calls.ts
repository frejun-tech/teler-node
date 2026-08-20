import type { SipCallResponse, SipCallFilters } from "../../types/sip";
import type { HttpResourceManager } from "../http";
import type { CursorResponse } from "../../types/common";

export class SipCallResourceManager {
  private readonly basePath = "/sip/calls";
  constructor(private readonly http: HttpResourceManager) {}

  /**
   * List all sip calls.
   * @param filters - Optional filters and cursor, which includes trunk_id, from_number, to_number, created_after, created_before, limit, cursor_after and cursor_before.
   * @returns A list of sip calls.
   */
  public async list(
    filters?: SipCallFilters
  ): Promise<CursorResponse<SipCallResponse>> {
    return this.http.get<CursorResponse<SipCallResponse>, SipCallFilters>(
      this.basePath,
      filters
    );
  }

  /**
   * Fetch a sip call.
   * @param callId - The call ID to fetch
   * @returns Details of the sip call.
   */
  public async retrieve(callId: string): Promise<SipCallResponse> {
    return this.http.get<SipCallResponse>(`${this.basePath}/${callId}`);
  }
}
