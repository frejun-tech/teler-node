import type {
  CreateCallPayload,
  CallResponse,
  CreateCallParams,
} from "../types/voice";
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
  public async create(params: CreateCallParams): Promise<CallResponse> {
    const data: CreateCallPayload = {
      from_number: params.fromNumber,
      to_number: params.toNumber,
      flow_url: params.flowUrl,
      status_callback_url: params?.statusCallbackUrl,
      record: params?.record ?? true,
    };

    return this.http.post<CallResponse, CreateCallPayload>(
      `${this.basePath}/initiate`,
      data
    );
  }
}
