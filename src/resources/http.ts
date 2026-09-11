import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosError
} from "axios";
import { config as CONFIG } from "../config";
import type { HttpMethod } from "../types/common";
import { toSnakeCase, toCamelCase } from "../lib/utils";
import {
  TelerException,
  BadParametersException,
  UnauthorizedException,
  ForbiddenException,
  UnprocessableRequestException,
  InternalServerErrorException,
  NotImplementedException,
  NotFoundException,
  RateLimitException,
  ConflictException,
  NetworkException,
  GoneException
} from "../exceptions";

interface RequestOptions {
  headers?: Record<string, string>;
  retry?: boolean;
  baseRetryDelayMs?: number;
  config?: AxiosRequestConfig;
}

export interface TelerErrorResponseBody {
  success?: boolean;
  message?: string;
  code?: string;
  type?: string;
  errors?: Array<{
    loc?: (string | number)[];
    msg?: string;
    type?: string;
    input?: unknown;
    ctx?: unknown;
  }>;
}

export class HttpResourceManager {
  public readonly httpClient: AxiosInstance;

  constructor(apiKey: string, baseURL: string, baseTimeout?: number) {
    this.httpClient = axios.create({
      baseURL: baseURL,
      timeout: baseTimeout ?? CONFIG.BASE_TIMEOUT_MS,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-api-key": apiKey
      },
      paramsSerializer: {
        indexes: false,
        serialize: (params) => {
          const searchParams = new URLSearchParams();
          Object.entries(params).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              value
                .filter(
                  (v): v is string | number | boolean =>
                    v !== null && v !== undefined
                )
                .forEach((v) => searchParams.append(key, String(v)));
            } else if (value !== undefined && value !== null) {
              searchParams.append(key, String(value));
            }
          });
          return searchParams.toString();
        }
      }
    });
  }

  /**
   * Sends a GET request to the given path.
   *
   * @param path - API endpoint path.
   * @param params - Optional. Query parameters to include in the request.
   * @param config - Optional. Additional axios request config (e.g. responseType, timeout, maxRedirects).
   * @returns The response data of type T.
   */
  public async get<T, P = unknown>(
    path: string,
    params?: P,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>(
      "GET",
      path,
      undefined,
      params as Record<string, unknown> | undefined,
      undefined,
      config
    );
  }

  /**
   * Sends a POST request to the given path.
   *
   * @param path - API endpoint path.
   * @param data - Optional. The request payload body.
   * @param options - Optional. Headers, retry, and backoff configuration.
   * @returns The response data of type T.
   */
  public async post<T, P = unknown>(
    path: string,
    data?: P,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T, P>(
      "POST",
      path,
      data,
      undefined,
      options?.headers,
      options?.config,
      options?.retry ?? false,
      options?.baseRetryDelayMs ?? 5000
    );
  }

  /**
   * Sends a PATCH request to the given path.
   *
   * @param path - API endpoint path.
   * @param data - Optional. The request payload body.
   * @returns The response data of type T.
   */
  public async patch<T, P = unknown>(path: string, data?: P): Promise<T> {
    return this.request<T, P>("PATCH", path, data);
  }

  /**
   * Sends a DELETE request to the given path.
   *
   * @param path - API endpoint path.
   * @returns The response data of type T.
   */
  public async delete<T>(path: string): Promise<T> {
    return this.request<T>("DELETE", path);
  }

  /**
   * Checks whether an error is safe to retry: network-level failures
   * (no response received) or a 503 Service Unavailable from the server.
   */
  private isRetryableAxiosError(err: unknown): boolean {
    if (!axios.isAxiosError(err)) return false;
    if (!err.response) return true;
    return err.response.status === 503;
  }

  /**
   * Retries the given request with exponential backoff on retryable
   * errors, reusing the same request (and headers, e.g. Idempotency-Key)
   * on every attempt.
   */
  private async executeWithRetry<T>(
    request: () => Promise<T>,
    maxRetries = 3,
    baseRetryDelayMs = 5000
  ): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await request();
      } catch (err) {
        lastError = err;
        if (!this.isRetryableAxiosError(err) || attempt === maxRetries) {
          throw err;
        }
        await new Promise((r) =>
          setTimeout(r, 2 ** attempt * baseRetryDelayMs)
        );
      }
    }
    throw lastError;
  }

  /**
   * Maps an HTTP status + error body to a typed exception and throws it.
   * Single source of truth for status → exception mapping.
   */
  public throwForStatus(err: AxiosError<TelerErrorResponseBody>): never {
    const status = err.response!.status;
    const message = err.response?.data?.message ?? err?.message;
    const errorCode = err.response?.data?.code;
    const type = err.response?.data?.type;
    const body = err.response?.data;

    if (status === 422) {
      const errors = Array.isArray(body?.errors) ? body.errors : undefined;
      let param: string | undefined;
      if (
        errors &&
        errors.length > 0 &&
        Array.isArray(errors[0].loc) &&
        errors[0].loc.length > 0
      ) {
        param = errors[0].loc.join(".");
      }
      throw new UnprocessableRequestException(
        message,
        body,
        status,
        errorCode,
        param
      );
    }

    const details = body;

    switch (status) {
      case 400:
        throw new BadParametersException(
          message,
          details,
          status,
          errorCode,
          undefined,
          type
        );
      case 401:
        throw new UnauthorizedException(
          message,
          details,
          status,
          errorCode,
          undefined,
          type
        );
      case 403:
        throw new ForbiddenException(
          message,
          details,
          status,
          errorCode,
          undefined,
          type
        );
      case 404:
        throw new NotFoundException(
          message,
          details,
          status,
          errorCode,
          undefined,
          type
        );
      case 409:
        throw new ConflictException(
          message,
          details,
          status,
          errorCode,
          undefined,
          type
        );
      case 410:
        throw new GoneException(
          message,
          details,
          status,
          errorCode,
          undefined,
          type
        );
      case 429:
        throw new RateLimitException(
          message,
          details,
          status,
          errorCode,
          undefined,
          type
        );
      default:
        if (status === 501) {
          throw new NotImplementedException(
            message,
            details,
            status,
            errorCode,
            undefined,
            type
          );
        } else if (status >= 500) {
          throw new InternalServerErrorException(
            message,
            details,
            status,
            errorCode,
            undefined,
            type
          );
        }
        throw new TelerException(
          `API Error: ${message}`,
          details,
          status,
          errorCode,
          undefined,
          type
        );
    }
  }

  /**
   * Maps a caught Axios error to a typed exception and throws it.
   * No response → NetworkException. Otherwise delegates to throwForStatus.
   */
  public handleAxiosError(err: unknown): never {
    if (axios.isAxiosError<TelerErrorResponseBody>(err)) {
      if (!err.response) {
        throw new NetworkException(err.message, undefined, err.code);
      }
      this.throwForStatus(err);
    }
    throw new TelerException(
      "An unknown error occurred while calling the API."
    );
  }

  /**
   * Initiates an HTTPS request to the FreJun Teler.
   *
   * @param method - HTTP method to use (e.g., GET, POST).
   * @param path - API endpoint path.
   * @param data - The request payload body of type P.
   * @param params - URL query parameters.
   * @param headers - Additional HTTP headers to include with the request.
   * @param config - Additional axios request config (e.g. responseType).
   * @param retry - Whether to retry on network errors/503s, reusing the same request each attempt.
   * @param baseRetryDelayMs - Base delay unit (ms) for exponential backoff between retries. (Default: 5000)
   * @returns The response data of type T.
   */
  private async request<T, P = unknown>(
    method: HttpMethod,
    path: string,
    data?: P,
    params?: Record<string, unknown>,
    headers?: Record<string, string>,
    config?: AxiosRequestConfig,
    retry = false,
    baseRetryDelayMs = 5000
  ): Promise<T> {
    try {
      const transformedData =
        data !== undefined ? toSnakeCase<P>(data) : undefined;
      const transformedParams =
        params !== undefined
          ? toSnakeCase<Record<string, unknown>>(params)
          : undefined;

      const response = await this.executeWithRetry(
        () =>
          this.httpClient.request<T>({
            method,
            url: path,
            data: transformedData,
            params: transformedParams,
            headers,
            ...config
          }),
        retry ? CONFIG.RETRY_COUNT : 0,
        baseRetryDelayMs
      );
      if (config?.responseType === "stream") {
        return response.data;
      }
      return toCamelCase<T>(response.data);
    } catch (err) {
      this.handleAxiosError(err);
    }
  }
}
