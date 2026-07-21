import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import type { HttpMethod } from "../types/common";
import { TelerException, BadParametersException, UnauthorizedException, ForbiddenException, UnprocessableRequestException, InternalServerErrorException, NotImplementedException, NotFoundException, RateLimitException } from "../exceptions";

export class HttpResourceManager {
    private readonly httpClient: AxiosInstance;

    constructor(apiKey: string, baseURL: string) {
        this.httpClient = axios.create({
            baseURL: baseURL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'x-api-key': apiKey,
            },
            paramsSerializer: {
                indexes: false,
                serialize: (params) => {
                    const searchParams = new URLSearchParams();
                    Object.entries(params).forEach(([key, value]) => {
                        if (Array.isArray(value)) {
                            value
                            .filter(v => v != null)
                            .forEach(v => searchParams.append(key, v));
                        } else if (value !== undefined) {
                            searchParams.append(key, value);
                        }
                    });
                    return searchParams.toString();
                }
            }
        });
    }

    public async get<T, P = unknown>(path: string, params?: P, config?: AxiosRequestConfig): Promise<T> {
        return this.request<T>('GET', path, undefined, params);
    }

    public async post<T, P = unknown>(path: string, data?: P, headers?: Record<string, string>): Promise<T> {
        return this.request<T, P>('POST', path, data, undefined, headers);
    }

    public async patch<T, P = unknown>(path: string, data?: P): Promise<T> {
        return this.request<T, P>('PATCH', path, data);
    }

    public async delete<T>(path: string): Promise<T> {
        return this.request<T>('DELETE', path);
    }

    /**
    * Initiates an HTTPS request to the FreJun Teler.
    * 
    * @param method - HTTP method to use (e.g., GET, POST).
    * @param path - API endpoint path.
    * @param data - The request payload body of type P.
    * @param params - URL query parameters.
    * @returns The response data of type T.
    */

    private async request<T, P = unknown>(method: HttpMethod, path: string, data?: P, params?: Record<string, any>, headers?: Record<string, string>): Promise<T> {
        try {
            const response = await this.httpClient.request<T>({ method, url: path, data, params, headers });
            return response.data;
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const status = err.response?.status;
                const message = err.response?.data?.message ?? err?.message;
                const details = err.response?.data?.errors ?? '';

                switch (status) {
                    case 400: throw new BadParametersException(message, details);
                    case 401: throw new UnauthorizedException(message, details);
                    case 403: throw new ForbiddenException(message, details);
                    case 404: throw new NotFoundException(message, details);
                    case 422: throw new UnprocessableRequestException(message, details);
                    case 429: throw new RateLimitException(message, details);
                    default:
                        if (status === 501) {
                            throw new NotImplementedException(message, details, status);
                        }
                        else if (status >= 500) {
                            throw new InternalServerErrorException(message, details, status);
                        }
                        throw new TelerException(`API Error: ${message}`, details, status);
                }
            }
            throw new TelerException("An unknown error occurred while calling the API.");
        }
    }
}