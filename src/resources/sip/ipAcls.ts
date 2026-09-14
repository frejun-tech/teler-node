import type { CursorResponse, DefaultResponse } from "../../types/common";
import type {
  CreateIpAclPayload,
  IpAclFilters,
  IpAclListResponse,
  IpAclResponse,
  UpdateIpAclPayload
} from "../../types/sip";
import type { HttpResourceManager } from "../http";

export class IpAclResourceManager {
  private readonly basePath = "/sip/ip-acls";
  constructor(private readonly http: HttpResourceManager) {}

  /**
   * Create a named set of source IPs or CIDR networks that SIP trunks can authorise against.
   * @param payload - CreateIpAclPayload
   * @returns Details of the IP access control lists.
   */
  public async create(payload: CreateIpAclPayload): Promise<IpAclResponse> {
    return this.http.post<IpAclResponse, CreateIpAclPayload>(
      `${this.basePath}`,
      payload
    );
  }

  /**
   * List the IP access control lists in your account, newest first.
   * @param filters - Optional filters and cursor, which includes search, limit, cursorAfter and cursorBefore.
   * @returns A list of IP access control lists.
   */
  public async list(
    filters?: IpAclFilters
  ): Promise<CursorResponse<IpAclListResponse>> {
    return this.http.get<CursorResponse<IpAclListResponse>, IpAclFilters>(
      this.basePath,
      filters
    );
  }

  /**
   * Retrieve a single IP access control list, including its addresses.
   * @param ipAclId - The IP access control list identifier to fetch.
   * @returns Details of the IP access control lists.
   */
  public async retrieve(ipAclId: string): Promise<IpAclResponse> {
    return this.http.get<IpAclResponse>(`${this.basePath}/${ipAclId}`);
  }

  /**
   * Rename an ACL and/or replace its addresses. Supplying addresses replaces the entire set.
   * Changes apply to every trunk using this ACL.
   * @param ipAclId - The IP access control list identifier to update.
   * @param payload - UpdateIpAclPayload.
   * @param retry - Optional. Whether to retry on network errors/503s. (Default: false)
   * @param baseRetryDelayMs - Optional. Base delay (ms) for exponential backoff with jitter. (Default: 500, capped at 2000ms)
   * @returns Details of the IP access control lists.
   */
  public async update(
    ipAclId: string,
    payload: UpdateIpAclPayload,
    retry?: boolean,
    baseRetryDelayMs?: number
  ): Promise<IpAclResponse> {
    return this.http.patch<IpAclResponse, UpdateIpAclPayload>(
      `${this.basePath}/${ipAclId}`,
      payload,
      { retry, baseRetryDelayMs }
    );
  }

  /**
   * Delete an IP access control list. Refused with 409 while any SIP trunk still authorises against it,
   * so a trunk can never be left without an auth source.
   * @param ipAclId - The IP access control list identifier to delete.
   * @param retry - Optional. Whether to retry on network errors/503s. (Default: true)
   * @param baseRetryDelayMs - Optional. Base delay (ms) for exponential backoff with jitter. (Default: 100, capped at 2000ms)
   * @returns success/ failure.
   */
  public async delete(
    ipAclId: string,
    retry?: boolean,
    baseRetryDelayMs?: number
  ): Promise<DefaultResponse> {
    return this.http.delete<DefaultResponse>(`${this.basePath}/${ipAclId}`, {
      retry,
      baseRetryDelayMs
    });
  }
}
