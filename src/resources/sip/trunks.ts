import type { CursorResponse, DefaultResponse } from "../../types/common";
import type {
  CreateSipTrunkPayload,
  UpdateSipTrunkPayload,
  SipTrunkFilters,
  SipTrunkResponse
} from "../../types/sip";
import type { HttpResourceManager } from "../http";
import type {
  VirtualNumberResponse,
  VirtualNumberFilters
} from "../../types/core";
import { config } from "../../config";
import { autoPaginate } from "../../lib/pagination";

export class TrunkResourceManager {
  private readonly basePath = "/sip/trunks";
  constructor(private readonly http: HttpResourceManager) {}

  /**
   * Create a new sip trunk
   * @param payload - CreateSipTrunkPayload.
   * @returns Details of the sip trunk.
   */
  public async create(
    payload: CreateSipTrunkPayload
  ): Promise<SipTrunkResponse> {
    const normalizedPayload = {
      ...payload,
      webhookApiVersion:
        payload.webhookApiVersion ?? config.DEFAULT_WEBHOOK_API_VERSION
    };
    return this.http.post<SipTrunkResponse, CreateSipTrunkPayload>(
      `${this.basePath}`,
      normalizedPayload
    );
  }

  /**
   * Fetch a sip trunk.
   * @param sipTrunkId - The sip trunk ID to fetch
   * @returns Details of the sip trunk.
   */
  public async retrieve(sipTrunkId: string): Promise<SipTrunkResponse> {
    return this.http.get<SipTrunkResponse>(`${this.basePath}/${sipTrunkId}`);
  }

  /**
   * List all sip trunks.
   * Server-side default page size is 50 when `limit` is omitted
   * @param filters - Optional filters and cursor, which includes search, status, limit, cursorAfter and cursorBefore.
   * @returns A list of sip trunks.
   */
  public async list(
    filters?: SipTrunkFilters
  ): Promise<CursorResponse<SipTrunkResponse>> {
    return this.http.get<CursorResponse<SipTrunkResponse>, SipTrunkFilters>(
      this.basePath,
      filters
    );
  }

  /**
   * Auto-paginate through all sip trunks, fetching further pages on demand
   * as you iterate.
   * @param filters - Optional filters, same as `list()` (`cursorAfter`/`cursorBefore` are managed internally).
   * @returns An async iterable of sip trunks.
   */
  public listAutoPagination(
    filters?: SipTrunkFilters
  ): AsyncGenerator<SipTrunkResponse, void, undefined> {
    return autoPaginate<SipTrunkResponse, SipTrunkFilters>(
      (f: SipTrunkFilters | undefined) => this.list(f),
      filters
    );
  }

  /**
   * Update a sip trunk.
   * @param sipTrunkId - Sip trunk ID to update.
   * @param payload - UpdateSipTrunkPayload.
   * @param retry - Optional. Whether to retry on network errors/503s. (Default: false)
   * @param baseRetryDelayMs - Optional. Base delay (ms) for exponential backoff with jitter. (Default: 500, capped at 2000ms)
   * @returns Details of the updated trunk.
   */
  public async update(
    sipTrunkId: string,
    payload: UpdateSipTrunkPayload,
    retry?: boolean,
    baseRetryDelayMs?: number
  ): Promise<SipTrunkResponse> {
    return this.http.patch<SipTrunkResponse, UpdateSipTrunkPayload>(
      `${this.basePath}/${sipTrunkId}`,
      payload,
      { retry, baseRetryDelayMs }
    );
  }

  /**
   * Delete a sip trunk.
   * @param sipTrunkId - sip trunk ID to delete.
   * @param retry - Optional. Whether to retry on network errors/503s. (Default: true)
   * @param baseRetryDelayMs - Optional. Base delay (ms) for exponential backoff with jitter. (Default: 100, capped at 2000ms)
   * @returns success/ failure.
   */
  public async delete(
    sipTrunkId: string,
    retry?: boolean,
    baseRetryDelayMs?: number
  ): Promise<DefaultResponse> {
    return this.http.delete<DefaultResponse>(`${this.basePath}/${sipTrunkId}`, {
      retry,
      baseRetryDelayMs
    });
  }

  /**
   * Get virtual numbers assigned to a sip trunk.
   * Server-side default page size is 50 when `limit` is omitted
   * @param sipTrunkId - sipTrunkID to fetch vns.
   * @param params - Optional filters and cursor for pagination.
   * @returns Details of the vns assigned to the sip trunk.
   */
  public async listVirtualNumbers(
    sipTrunkId: string,
    params?: VirtualNumberFilters
  ): Promise<CursorResponse<VirtualNumberResponse>> {
    return this.http.get<
      CursorResponse<VirtualNumberResponse>,
      VirtualNumberFilters
    >(`${this.basePath}/${sipTrunkId}/virtual-numbers`, params);
  }

  /**
   * Auto-paginate through all virtual numbers assigned to a sip trunk.
   * @param sipTrunkId - sip trunk ID to fetch vns.
   * @param params - Optional filters, same as `listVirtualNumbers()` (`cursorAfter`/`cursorBefore` are managed internally).
   * @returns An async iterable of virtual numbers.
   */
  public listVirtualNumbersAutoPagination(
    sipTrunkId: string,
    params?: VirtualNumberFilters
  ): AsyncGenerator<VirtualNumberResponse, void, undefined> {
    return autoPaginate<VirtualNumberResponse, VirtualNumberFilters>(
      (f) => this.listVirtualNumbers(sipTrunkId, f),
      params
    );
  }
}
