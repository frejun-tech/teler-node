import type { RecordingParams } from "../types/core";
import type { HttpResourceManager } from "./http";
import type { Readable } from "node:stream";

export class RecordingResourceManager {
  private readonly basePath = "/recordings";
  constructor(private readonly http: HttpResourceManager) {}

  /**
   * Fetch a call recording as a downloadable audio stream.
   *
   * Follows the API's redirect to the signed recording URL and streams
   * the raw audio (WAV) response body.
   *
   * @param params - The recording parameters including recordingId and optional expiresIn duration.
   * @returns A Readable stream of the recording's audio data.
   */
  public async retrieve(params: RecordingParams): Promise<Readable> {
    return this.http.get<Readable>(this.basePath, params, {
      responseType: "stream"
    });
  }
}
