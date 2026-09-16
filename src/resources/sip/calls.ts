import type { SipCallResponse, SipCallFilters } from "../../types/sip";
import type { HttpResourceManager } from "../http";
import type { CursorResponse } from "../../types/common";
import { autoPaginate } from "../../lib/pagination";

export class SipCallResourceManager {
  private readonly basePath = "/sip/calls";
  constructor(private readonly http: HttpResourceManager) {}

  /**
   * List all sip calls.
   * Server-side default page size is 50 when `limit` is omitted
   * @param filters - Optional filters and cursor, which includes trunkId, fromNumber, toNumber, createdAfter, createdBefore, limit, cursorAfter and cursorBefore.
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
   * Auto-paginate through all sip calls, fetching further pages on demand
   * as you iterate.
   * @param filters - Optional filters, same as `list()` (`cursorAfter`/`cursorBefore` are managed internally).
   * @returns An async iterable of sip calls.
   */
  public listAutoPagination(
    filters?: SipCallFilters
  ): AsyncGenerator<SipCallResponse, void, undefined> {
    return autoPaginate<SipCallResponse, SipCallFilters>(
      (f: SipCallFilters | undefined) => this.list(f),
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
