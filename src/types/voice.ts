import type { CallDirection, CursorFilters, WebhookApiVersion } from "./common";
import { Status } from "./core";

/**
 * Voice Call Types
 */

export type CreateCallParams = {
  fromNumber: string;
  toNumber: string;
  flowUrl: string;
  statusCallbackUrl: string;
  record?: boolean;
};

export type CallDetails = {
  id: string;
  from_number: string;
  to_number: string;
  status_callback_url: string;
  record: boolean;
};

export type CallResponse = {
  message: string;
  data: CallDetails;
};

export type CreateCallPayload = {
  from_number: string;
  to_number: string;
  flow_url: string;
  status_callback_url: string;
  record?: boolean;
};

/**
 * Stream Types
 */

export enum StreamType {
  UNIDIRECTIONAL = 0,
  BIDIRECTIONAL = 1
}

export enum StreamOP {
  RELAY = 0,
  PASS = 1,
  STOP = 2
}

export type StreamData = string | Buffer | Uint8Array | ArrayBuffer | Blob;

export type StreamHandlerResult = [StreamData, StreamOP];

export type StreamHandler = (
  message: StreamData
) => Promise<StreamHandlerResult>;

/**
 * Voice Apps Types
 *
 */

interface VoiceAppBase {
  name: string;
  flow_url: string;
  webhook_url: string;
  fallback_url?: string | null;
}

export interface CreateVoiceAppPayload extends VoiceAppBase {
  vn_ids?: string[];
  secret_id?: string | null;
  webhook_api_version?: WebhookApiVersion;
}

export interface UpdateVoiceAppPayload {
  name?: string;
  status?: Status;
  flow_url?: string;
  webhook_url?: string;
  fallback_url?: string | null;
  channel_limit?: number | null;
  secret_id?: string | null;
  webhook_api_version?: WebhookApiVersion;
}

export interface VoiceAppResponse extends VoiceAppBase {
  id: string;
  status: Status;
  channel_limit: number | null;
  vn_count: number;
  secret_id?: string | null;
  secret_name?: string | null;
  webhook_api_version: WebhookApiVersion;
  account_id: string;
}

export interface VoiceAppFilters extends CursorFilters {
  search?: string;
  status?: Status[];
}

export interface VoiceAppListResponse {
  id: string;
  name: string;
}

/**
 *
 * Voice Call Types
 */

export type CallSessionStates =
  | "initiated"
  | "ringing"
  | "answered"
  | "completed"
  | "failed";

export type CallLegRole =
  | "primary"
  | "dial_target"
  | "transfer_target"
  | "monitor"
  | "parked";

export type CallLegState =
  | "created"
  | "ringing"
  | "answered"
  | "completed"
  | "failed";

export interface VoiceCallFilters extends CursorFilters {
  state?: CallSessionStates;
  from_number?: string;
  to_number?: string;
  created_after?: string;
  created_before?: string;
}

export interface VoiceCallResponse {
  id: string;
  account_id: string;
  voice_app_id: string;
  state: CallSessionStates;
  direction: CallDirection;
  from_number: string;
  to_number: string;
  properties: Record<string, unknown>;
  created_at: string;
  answered_at: string;
  ended_at: string;
  reason: string;
  legs: VoiceCallLegResponse[];
}

export interface VoiceCallLegResponse {
  id: string;
  call_session_id: string;
  direction: CallDirection;
  role: CallLegRole;
  state: CallLegState;
  from_number: string;
  to_number: string;
  parent_leg_id: string;
  recordings: string[];
  created_at: string;
  answered_at: string;
  ended_at: string;
  reason: string;
  ended_by: string;
}

/**
 *
 * Call Mutation Types
 */

export interface MutationBase {
  leg_id?: string;
}

export interface HangupPayload extends MutationBase {
  reason?: string;
}

export interface MutePayload {
  leg_id: string;
  on: boolean;
}

export interface DTMFPayload extends MutationBase {
  digits: string;
  duration_ms?: number;
}

export interface PlayPayload extends MutationBase {
  media_url: string;
  loop?: number;
  on_dtmf?: "stop" | "ignore";
}

export interface MutationResponse {
  request_id: string;
  playback_id?: string;
}

/**
 *
 * Voice Operation Types
 */

type CallTransferMode = "cold" | "warm" | "monitor";

export interface DialTarget {
  kind: "pstn" | "sip" | "leg";
  number: string;
  uri?: string;
  leg_id?: string;
  custom_headers?: Record<string, string>;
}

export interface TransferAction {
  action: "play" | "say" | "hangup";
  media_url?: string;
  text?: string;
  voice?: string;
  language?: string;
  reason?: string;
  loop?: boolean;
}

export interface TransferPayload {
  target: DialTarget;
  mode: CallTransferMode;
  timeout?: number;
  record?: boolean;
  ringback?: "suppress" | "passthrough";
  dial_music?: TransferAction;
  confirm_sound?: TransferAction;
  on_failure?: TransferAction;
}

export interface TransferResponse {
  id: string;
  call_id: string;
  status: CallSessionStates;
  target_leg_id: string;
  mode: CallTransferMode;
  request_id: string;
}
