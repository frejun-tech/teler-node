import axios, { AxiosResponse, AxiosError } from "axios";
import type { RecordingParams } from "../types/core";
import type { HttpResourceManager, TelerErrorResponseBody } from "./http";
import type { Readable } from "node:stream";
import { toSnakeCase } from "../lib/utils";
import { NetworkException, NotFoundException } from "../exceptions";

export class RecordingResourceManager {
  private readonly basePath = "/recordings";
  constructor(
    private readonly http: HttpResourceManager,
    private recordingTimeout: number
  ) {}

  /**
   * Extracts the `Location` header from an Axios response, if present.
   *
   * @param headers - The `headers` object from an Axios response.
   * @returns The redirect target URL if present and a string, otherwise `undefined`.
   */
  private extractLocationHeader(
    headers: AxiosResponse["headers"]
  ): string | undefined {
    const value = (headers as Record<string, unknown>)["location"];
    return typeof value === "string" ? value : undefined;
  }

  /**
   * Fetch a call recording as a downloadable audio stream.
   *
   * Follows the API's redirect to the signed recording URL and streams
   * the raw audio (WAV) response body.
   *
   * @param params - The recording parameters including recordingId and optional expiresIn duration.
   * @returns A Readable stream of the recording's audio data.
   * @throws {NetworkException} on connectivity failure (either hop).
   * @throws {NotFoundException} if the redirect is missing a Location header.
   * @throws typed API exceptions for non-2xx responses from the recordings endpoint.
   */

  public async retrieve(params: RecordingParams): Promise<Readable> {
    const transformedParams = toSnakeCase<RecordingParams>(params);

    let response: AxiosResponse<Readable>;
    try {
      response = await this.http.httpClient.get<Readable>(this.basePath, {
        params: transformedParams,
        responseType: "stream",
        timeout: this.recordingTimeout,
        maxRedirects: 0,
        validateStatus: () => true
      });
    } catch (err: unknown) {
      this.http.handleAxiosError(err);
    }

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = this.extractLocationHeader(response.headers);
      if (!location) {
        throw new NotFoundException(
          "Redirect response missing Location header"
        );
      }

      try {
        const recordingRequest = axios.create({
          timeout: this.recordingTimeout
        });
        const finalResponse = await recordingRequest.get<Readable>(location, {
          responseType: "stream"
        });
        return finalResponse.data;
      } catch {
        throw new NetworkException(
          "Failed to download recording from storage host",
          undefined,
          undefined
        );
      }
    }

    if (response.status >= 400) {
      const err = new AxiosError<TelerErrorResponseBody>(
        "Recording API Error",
        undefined,
        undefined,
        undefined,
        response as AxiosResponse<TelerErrorResponseBody>
      );
      this.http.handleAxiosError(err);
    }

    return response.data;
  }
}
