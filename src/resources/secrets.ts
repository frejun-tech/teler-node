import type {
  CreateSecretPayload,
  UpdateSecretPayload,
  SecretFilters,
  SecretResponse,
  SecretListResponse
} from "../types/secrets";
import type { CursorResponse, DefaultResponse } from "../types/common";
import type { HttpResourceManager } from "./http";

export class SecretResourceManager {
  private readonly basePath = "/secrets";
  constructor(private readonly http: HttpResourceManager) {}

  /**
   * Create a new secret.
   * @param payload - CreateSecretPayload.
   * @returns Details of the secret.
   */
  public async create(payload: CreateSecretPayload): Promise<SecretResponse> {
    return this.http.post<SecretResponse, CreateSecretPayload>(
      this.basePath,
      payload
    );
  }

  /**
   * List all secrets.
   * @param filters - Optional filters and cursor, which includes search, limit, cursorAfter and cursorBefore.
   * @returns A list of secrets.
   */
  public async list(
    filters?: SecretFilters
  ): Promise<CursorResponse<SecretListResponse>> {
    return this.http.get<CursorResponse<SecretListResponse>, SecretFilters>(
      this.basePath,
      filters
    );
  }

  /**
   * Fetch a secrets details.
   * @param secretId - The secret ID to fetch
   * @returns Details of the secret.
   */
  public async retrieve(secretId: string): Promise<SecretResponse> {
    return this.http.get<SecretResponse>(`${this.basePath}/${secretId}`);
  }

  /**
   * Update a secret.
   * @param secretId - secret ID to update
   * @param payload - UpdateSecretPayload with fields to update.
   * @param retry - Optional. Whether to retry on network errors/503s. (Default: false)
   * @param baseRetryDelayMs - Optional. Base delay (ms) for exponential backoff with jitter. (Default: 500, capped at 2000ms)
   * @returns Details of the updated secret.
   */
  public async update(
    secretId: string,
    payload: UpdateSecretPayload,
    retry?: boolean,
    baseRetryDelayMs?: number
  ): Promise<SecretResponse> {
    return this.http.patch<SecretResponse, UpdateSecretPayload>(
      `${this.basePath}/${secretId}`,
      payload,
      { retry, baseRetryDelayMs }
    );
  }

  /**
   * Delete a secret.
   * @param secretId - secret ID to delete.
   * @param retry - Optional. Whether to retry on network errors/503s. (Default: true)
   * @param baseRetryDelayMs - Optional. Base delay (ms) for exponential backoff with jitter. (Default: 100, capped at 2000ms)
   * @returns success/ failure.
   */
  public async delete(
    secretId: string,
    retry?: boolean,
    baseRetryDelayMs?: number
  ): Promise<DefaultResponse> {
    return this.http.delete<DefaultResponse>(`${this.basePath}/${secretId}`, {
      retry,
      baseRetryDelayMs
    });
  }
}
