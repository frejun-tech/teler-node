/**
 * Call Types
 */

export type CreateCallParams = {
  fromNumber: string;
  toNumber: string;
  flowUrl: string;
  statusCallbackUrl: string;
  record?: boolean;
}


export type CallDetails = {
  id: string;
  from_number: string;
  to_number: string;
  status_callback_url: string;
  record: boolean;
}


export type CallResource = {
  message: string;
  data: CallDetails,
}

export type CreateCallPayload = {
  from_number: string;
  to_number: string;
  flow_url: string;
  status_callback_url: string;
  record?: boolean;
}

/**
 * Stream Types
 */ 

export enum StreamType {
  UNIDIRECTIONAL = 0,
  BIDIRECTIONAL  = 1
}

export enum StreamOP {
  RELAY = 0,
  PASS = 1,
  STOP = 2,
}

export type StreamData = string | Buffer | Uint8Array | ArrayBuffer | Blob;

export type StreamHandlerResult = [StreamData, StreamOP];

export type StreamHandler = (message: StreamData) => Promise<StreamHandlerResult>;
