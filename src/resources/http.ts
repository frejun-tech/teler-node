import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import { config as CONFIG } from "../config";
import type { HttpMethod } from "../types/common";
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
} from "../exceptions";

interface RequestOptions {
  headers?: Record<string, string>;
  retry?: boolean;
  baseRetryDelayMs?: number;
  config?: AxiosRequestConfig;
}

interface TelerErrorResponseBody {
  success?: boolean;
  type?: string;
  code?: string;
  message?: string;
  errors?: unknown;
}

export class HttpResourceManager {
  private readonly httpClient: AxiosInstance;

  constructor(apiKey: string, baseURL: string, timeOut?: number) {
    this.httpClient = axios.create({
      baseURL: baseURL,
      timeout: timeOut ?? CONFIG.TIMEOUT,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-api-key": apiKey,
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
        },
      },
    });
  }

  /**
   * Sends a GET request to the given path.
   *
   * @param path - API endpoint path.
   * @param params - Optional. Query parameters to include in the request.
   * @param config - Optional. Additional axios request config (e.g. responseType, maxRedirects).
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
      const response = await this.executeWithRetry(
        () =>
          this.httpClient.request<T>({
            method,
            url: path,
            data,
            params,
            headers,
            ...config,
          }),
        retry ? CONFIG.RETRY_COUNT : 0,
        baseRetryDelayMs
      );
      return response.data;
    } catch (err) {
      if (axios.isAxiosError<TelerErrorResponseBody>(err)) {
        if (!err.response) {
          throw new NetworkException(err.message, undefined, undefined);
        }

        const status = err.response.status;
        const message = err.response?.data?.message ?? err?.message;
        const details = err.response?.data?.errors ?? err?.message;
        const param = err.response?.data?.code ?? "";

        switch (status) {
          case 400:
            throw new BadParametersException(param, message, details);
          case 401:
            throw new UnauthorizedException(message, details);
          case 403:
            throw new ForbiddenException(message, details);
          case 404:
            throw new NotFoundException(message, details);
          case 409:
            throw new ConflictException(message, details);
          case 422:
            throw new UnprocessableRequestException(message, details);
          case 429:
            throw new RateLimitException(message, details);
          default:
            if (status === 501) {
              throw new NotImplementedException(message, details, status);
            } else if (status >= 500) {
              throw new InternalServerErrorException(message, details, status);
            }
            throw new TelerException(`API Error: ${message}`, details, status);
        }
      }
      throw new TelerException(
        "An unknown error occurred while calling the API."
      );
    }
  }
}
