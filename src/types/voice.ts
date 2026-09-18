import { RawData } from "ws";
import type { CallDirection, CursorFilters, WebhookApiVersion } from "./common";
import { Status } from "./common";

/**
 * Voice Call Types
 */

export type CreateCallPayload = {
  fromNumber: string;
  toNumber: string;
  flowUrl: string;
  statusCallbackUrl: string;
  record?: boolean;
};

export type CallDetails = {
  id: string;
  fromNumber: string;
  toNumber: string;
  statusCallbackUrl: string;
  record: boolean;
};

export type CallResponse = {
  message: string;
  data: CallDetails;
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

export type StreamData = string | RawData;

export type StreamHandlerResult = [StreamData, StreamOP];

export type StreamHandler = (
  message: StreamData
) => Promise<StreamHandlerResult>;

/**
 * Voice Apps Types
 *
 */

export interface CreateVoiceAppPayload {
  name: string;
  flowUrl: string;
  webhookUrl: string;
  fallbackUrl?: string | null;
  vnIds?: string[];
  secretId?: string | null;
  webhookApiVersion?: WebhookApiVersion;
  channelLimit?: number | null;
}

export interface UpdateVoiceAppPayload {
  name?: string;
  status?: Status;
  flowUrl?: string;
  webhookUrl?: string;
  fallbackUrl?: string | null;
  channelLimit?: number | null;
  secretId?: string | null;
  webhookApiVersion?: WebhookApiVersion;
}

export interface VoiceAppResponse {
  id: string;
  name: string;
  flowUrl: string;
  webhookUrl: string;
  fallbackUrl?: string | null;
  status: Status;
  channelLimit?: number | null;
  vnCount: number;
  secretId?: string | null;
  secretName?: string | null;
  webhookApiVersion: WebhookApiVersion;
  accountId: string;
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
  fromNumber?: string;
  toNumber?: string;
  createdAfter?: string;
  createdBefore?: string;
}

export interface VoiceCallResponse {
  id: string;
  accountId: string;
  voiceAppId?: string | null;
  state: CallSessionStates;
  direction: CallDirection;
  fromNumber?: string | null;
  toNumber?: string | null;
  properties: Record<string, unknown>;
  createdAt: string;
  answeredAt?: string;
  endedAt?: string;
  reason?: string | null;
  legs: VoiceCallLegResponse[];
}

export interface VoiceCallLegResponse {
  id: string;
  callSessionId: string;
  direction: CallDirection;
  role: CallLegRole;
  state: CallLegState;
  fromNumber?: string | null;
  toNumber?: string | null;
  parentLegId?: string | null;
  recordings: string[];
  createdAt: string;
  answeredAt?: string;
  endedAt?: string;
  reason?: string | null;
  endedBy?: string | null;
}

/**
 *
 * Call Mutation Types
 */

export interface MutationBase {
  legId?: string;
}

export interface HangupPayload extends MutationBase {
  reason?: string;
}

export interface MutePayload {
  legId: string;
  on: boolean;
}

export interface DTMFPayload extends MutationBase {
  digits: string;
  durationMs?: number;
}

export interface PlayPayload extends MutationBase {
  mediaUrl: string;
  loop?: number;
  onDtmf?: "stop" | "ignore";
}

export interface MutationResponse {
  requestId: string;
  playbackId?: string;
}

/**
 *
 * Voice Operation Types
 */

type CallTransferMode = "cold" | "warm" | "monitor";

export interface DialTarget {
  kind: "pstn" | "sip" | "leg";
  number?: string | null;
  uri?: string;
  legId?: string;
  customHeaders?: Record<string, string>;
}

export interface TransferAction {
  action: "play" | "say" | "hangup";
  mediaUrl?: string;
  text?: string;
  voice?: string;
  language?: string;
  reason?: string;
  loop?: boolean;
}

export interface TransferPayload {
  target: DialTarget;
  mode?: CallTransferMode;
  timeout?: number;
  record?: boolean;
  ringback?: "suppress" | "passthrough";
  dialMusic?: TransferAction;
  confirmSound?: TransferAction;
  onFailure?: TransferAction;
}

export interface TransferResponse {
  id: string;
  callId: string;
  status: "initiated";
  targetLegId?: string | null;
  mode: CallTransferMode;
  requestId?: string | null;
}
