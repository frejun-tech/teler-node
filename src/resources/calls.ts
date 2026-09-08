import type { CreateCallPayload, CallResponse } from "../types/voice";
import type { HttpResourceManager } from "./http";

export class CallResourceManager {
  private readonly basePath = "/voice/calls";
  constructor(private readonly http: HttpResourceManager) {}

  /**
   * @deprecated Use `client.voice.calls.create()` instead. This method will be removed in 2.0.1 version.
   *
   * @param params - The parameters to create a call
   * @returns Response of the call
   */
  public async create(params: CreateCallPayload): Promise<CallResponse> {
    return this.http.post<CallResponse, CreateCallPayload>(
      `${this.basePath}/initiate`,
      params
    );
  }
}
