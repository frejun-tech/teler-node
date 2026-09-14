import type {
  AssignVirtualNumberPayload,
  VirtualNumberFilters,
  UnassignVirtualNumberPayload,
  UpdateVirtualNumberPayload,
  VirtualNumberResponse,
  VirtualNumberListResponse
} from "../types/core";
import type { HttpResourceManager } from "./http";
import type { CursorResponse, DefaultResponse } from "../types/common";

export class VirtualNumberResourceManager {
  private readonly basePath = "/virtual-numbers";
  constructor(private readonly http: HttpResourceManager) {}

  /**
   * List all virtual numbers.
   * @param filters - Optional filters and cursor, which includes search, location, limit, cursorAfter and cursorBefore.
   * @returns A list of virtual numbers.
   */
  public async list(
    filters?: VirtualNumberFilters
  ): Promise<CursorResponse<VirtualNumberListResponse>> {
    return this.http.get<
      CursorResponse<VirtualNumberListResponse>,
      VirtualNumberFilters
    >(this.basePath, filters);
  }

  /**
   * Update a virtual number.
   * @param vnId - virtual number ID to update.
   * @param payload - UpdateVirtualNumberPayload  with fields to update.
   * @param retry - Optional. Whether to retry on network errors/503s. (Default: false)
   * @param baseRetryDelayMs - Optional. Base delay (ms) for exponential backoff with jitter. (Default: 500, capped at 2000ms)
   * @returns Details of the updated virtual number.
   */
  public async update(
    vnId: string,
    payload: UpdateVirtualNumberPayload,
    retry?: boolean,
    baseRetryDelayMs?: number
  ): Promise<VirtualNumberResponse> {
    return this.http.patch<VirtualNumberResponse, UpdateVirtualNumberPayload>(
      `${this.basePath}/${vnId}`,
      payload,
      { retry, baseRetryDelayMs }
    );
  }

  /**
   * Assign virtual number/s.
   * @param payload - AssignVirtualNumberPayload.
   * @returns success/ failure.
   */
  public async assign(
    payload: AssignVirtualNumberPayload
  ): Promise<DefaultResponse> {
    return this.http.post<DefaultResponse, AssignVirtualNumberPayload>(
      `${this.basePath}/assign`,
      payload
    );
  }

  /**
   * Unassign virtual number/s.
   * @param payload - UnassignVirtualNumberPayload .
   * @returns success/ failure.
   */
  public async unassign(
    payload: UnassignVirtualNumberPayload
  ): Promise<DefaultResponse> {
    return this.http.post<DefaultResponse, UnassignVirtualNumberPayload>(
      `${this.basePath}/unassign`,
      payload
    );
  }
}
