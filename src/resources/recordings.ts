import type { Readable } from "node:stream";
import { json } from "node:stream/consumers";
import axios, { AxiosResponse, AxiosError } from "axios";
import { toSnakeCase } from "../lib/utils";
import type { RecordingParams } from "../types/core";
import type { HttpResourceManager, TelerErrorResponseBody } from "./http";
import { NotFoundException } from "../exceptions";

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
   * Consumes a Readable stream and parses its contents as JSON, for
   * extracting the error body from a `responseType: "stream"` request
   * (whose `data` is a stream regardless of HTTP status).
   *
   * Logs a warning and returns `undefined` on any read or parse failure,
   * so callers can fall back to a generic error message.
   *
   * @param stream - The Readable stream to read.
   * @returns Parsed JSON object, or undefined if read/parse failed.
   */
  private async readStreamAsJson(
    stream: Readable
  ): Promise<TelerErrorResponseBody | undefined> {
    try {
      const data = (await json(stream)) as TelerErrorResponseBody;
      return data;
    } catch {
      if (!stream.destroyed) {
        stream.destroy();
      }
    }
    return undefined;
  }

  /**
   * Fetch a call recording as a downloadable audio stream.
   *
   * Follows the API's redirect to the signed recording URL and streams
   * the raw audio (WAV) response body.
   *
   * @param params - The recording parameters including recordingId and optional expiresIn duration.
   * @returns A Readable stream of the recording's audio data.
   * @throws {NetworkException} on connectivity failure (no HTTP response received).
   * @throws {NotFoundException} if the redirect is missing a Location header.
   * @throws typed API exceptions for non-2xx responses from either endpoint (recordings or storage host).
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
      response.data.destroy();
      if (!location) {
        throw new NotFoundException({
          message: "Redirect response missing Location header"
        });
      }

      try {
        const recordingRequest = axios.create({
          timeout: this.recordingTimeout
        });
        const finalResponse = await recordingRequest.get<Readable>(location, {
          responseType: "stream"
        });
        return finalResponse.data;
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response) {
          err.response.data = await this.readStreamAsJson(
            err.response.data as Readable
          );
        }
        this.http.handleAxiosError(err);
      }
    }

    if (response.status >= 400) {
      const errorBody = await this.readStreamAsJson(response.data);
      const err = new AxiosError<TelerErrorResponseBody>(
        "Recording API Error",
        undefined,
        undefined,
        undefined,
        {
          ...response,
          data: errorBody
        } as AxiosResponse<TelerErrorResponseBody>
      );
      this.http.handleAxiosError(err);
    }

    return response.data;
  }
}
