import type {
  CreateSecretPayload,
  UpdateSecretPayload,
  SecretFilters,
  SecretResponse,
  SecretListResponse,
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
      payload,
    );
  }

  /**
   * List all secrets.
   * @param filters - Optional filters and cursor, which includes search, status, limit, cursor_after and cursor_before.
   * @returns A list of secrets.
   */
  public async list(
    filters?: SecretFilters,
  ): Promise<CursorResponse<SecretListResponse>> {
    return this.http.get<CursorResponse<SecretListResponse>, SecretFilters>(
      this.basePath,
      filters,
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
   * @returns Details of the updated secret.
   */
  public async update(
    secretId: string,
    payload: UpdateSecretPayload,
  ): Promise<SecretResponse> {
    return this.http.patch<SecretResponse, UpdateSecretPayload>(
      `${this.basePath}/${secretId}`,
      payload,
    );
  }

  /**
   * Delete a secret.
   * @param secretId - secret ID to delete.
   * @returns success/ failure.
   */
  public async delete(secretId: string): Promise<DefaultResponse> {
    return this.http.delete<DefaultResponse>(`${this.basePath}/${secretId}`);
  }
}
