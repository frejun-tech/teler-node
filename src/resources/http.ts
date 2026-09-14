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
  maxRetryDelayMs?: number;
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
   * @param options - Optional. Headers, retry, backoff, and axios config.
   * @returns The response data of type T.
   */
  public async get<T, P = unknown>(
    path: string,
    params?: P,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(
      "GET",
      path,
      undefined,
      params as Record<string, unknown> | undefined,
      options?.headers,
      options?.config,
      options?.retry ?? true,
      options?.baseRetryDelayMs ?? 100,
      options?.maxRetryDelayMs ?? CONFIG.MAX_RETRY_DELAY_MS
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
      options?.baseRetryDelayMs ?? 500,
      options?.maxRetryDelayMs ?? CONFIG.MAX_RETRY_DELAY_MS
    );
  }

  /**
   * Sends a PATCH request to the given path.
   *
   * @param path - API endpoint path.
   * @param data - Optional. The request payload body.
   * @param options - Optional. Headers, retry, and backoff configuration.
   * @returns The response data of type T.
   */
  public async patch<T, P = unknown>(
    path: string,
    data?: P,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T, P>(
      "PATCH",
      path,
      data,
      undefined,
      options?.headers,
      options?.config,
      options?.retry ?? false,
      options?.baseRetryDelayMs ?? 500,
      options?.maxRetryDelayMs ?? CONFIG.MAX_RETRY_DELAY_MS
    );
  }

  /**
   * Sends a DELETE request to the given path.
   *
   * @param path - API endpoint path.
   * @param options - Optional. Headers, retry, and backoff configuration.
   * @returns The response data of type T.
   */
  public async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(
      "DELETE",
      path,
      undefined,
      undefined,
      options?.headers,
      options?.config,
      options?.retry ?? true,
      options?.baseRetryDelayMs ?? 100,
      options?.maxRetryDelayMs ?? CONFIG.MAX_RETRY_DELAY_MS
    );
  }

  /**
   * Parses the Retry-After header value into milliseconds.
   * Supports both delay-seconds and HTTP-date formats per RFC 7231.
   * Returns undefined if parsing fails.
   */
  private parseRetryAfter(
    retryAfterHeader: string | undefined
  ): number | undefined {
    if (!retryAfterHeader) return undefined;

    const delaySeconds = parseInt(retryAfterHeader, 10);
    if (!isNaN(delaySeconds)) {
      return delaySeconds * 1000;
    }

    const retryDate = new Date(retryAfterHeader);
    if (!isNaN(retryDate.getTime())) {
      const delayMs = retryDate.getTime() - Date.now();
      return Math.max(0, delayMs);
    }

    return undefined;
  }

  /**
   * Checks whether an error is safe to retry: network-level failures
   * (no response received), 429 Rate Limit Exceeded, or 503 Service Unavailable.
   */
  private isRetryableAxiosError(err: unknown): boolean {
    if (!axios.isAxiosError(err)) return false;
    if (!err.response) return true;
    return err.response.status === 429 || err.response.status === 503;
  }

  /**
   * Retries the given request with exponential backoff + full jitter on retryable
   * errors (429, 503, network failures), reusing the same request (and headers,
   * e.g. Idempotency-Key) on every attempt. For 429, respects the Retry-After
   * header if present; otherwise uses exponential backoff.
   * Delay for attempt N: random(0, min(maxRetryDelayMs, baseRetryDelayMs * 2^N)).
   * Jitter desynchronizes retries across clients (prevents thundering herd);
   * cap prevents excessive delays (e.g. 20s wait on 3rd retry).
   */
  private async executeWithRetry<T>(
    request: () => Promise<T>,
    maxRetries = 3,
    baseRetryDelayMs = 500,
    maxRetryDelayMs = CONFIG.MAX_RETRY_DELAY_MS
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

        let retryAfterMs: number | undefined;
        if (axios.isAxiosError(err) && err.response?.status === 429) {
          retryAfterMs = this.parseRetryAfter(
            err.response.headers["retry-after"] as string | undefined
          );
        }

        const exponentialDelay = Math.min(
          maxRetryDelayMs,
          baseRetryDelayMs * 2 ** attempt
        );
        const delayMs = retryAfterMs
          ? Math.min(maxRetryDelayMs, retryAfterMs)
          : Math.random() * exponentialDelay;

        await new Promise((r) => setTimeout(r, delayMs));
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

    const baseOpts = { message, details: body, status, errorCode, type };

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
      throw new UnprocessableRequestException({ ...baseOpts, param });
    }

    switch (status) {
      case 400:
        throw new BadParametersException(baseOpts);
      case 401:
        throw new UnauthorizedException(baseOpts);
      case 403:
        throw new ForbiddenException(baseOpts);
      case 404:
        throw new NotFoundException(baseOpts);
      case 409:
        throw new ConflictException(baseOpts);
      case 410:
        throw new GoneException(baseOpts);
      case 429:
        throw new RateLimitException(baseOpts);
      default:
        if (status === 501) {
          throw new NotImplementedException(baseOpts);
        } else if (status >= 500) {
          throw new InternalServerErrorException(baseOpts);
        }
        throw new TelerException({
          ...baseOpts,
          message: `API Error: ${message}`
        });
    }
  }

  /**
   * Maps a caught Axios error to a typed exception and throws it.
   * No response → NetworkException. Otherwise delegates to throwForStatus.
   */
  public handleAxiosError(err: unknown): never {
    if (axios.isAxiosError<TelerErrorResponseBody>(err)) {
      if (!err.response) {
        throw new NetworkException({
          message: err.message,
          errorCode: err.code
        });
      }
      this.throwForStatus(err);
    }
    throw new TelerException({
      message: "An unknown error occurred while calling the API."
    });
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
   * @param baseRetryDelayMs - Base delay (ms) for exponential backoff between retries. (Default: 500)
   * @param maxRetryDelayMs - Maximum cap (ms) on the calculated retry delay with jitter. (Default: 2000)
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
    baseRetryDelayMs = 500,
    maxRetryDelayMs = CONFIG.MAX_RETRY_DELAY_MS
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
        baseRetryDelayMs,
        maxRetryDelayMs
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
