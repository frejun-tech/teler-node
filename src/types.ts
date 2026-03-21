/**
 * Call Types
 */

export interface CreateCallParams {
  fromNumber: string;
  toNumber: string;
  flowUrl: string;
  statusCallbackUrl?: string;
  record?: boolean;
};

export interface CallResource {
    id: string | null,
    from_number: string | null,
    to_number: string | null,
    status: string | null,
    status_callback_url: string | null,
    record: boolean | null,
    created_at: string | null,
    updated_at: string | null
};

export interface CreateCallPayload {
  from_number: string;
  to_number: string;
  flow_url: string;
  status_callback_url: string;
  record: boolean;
};

/**
 * Stream Types
 */ 

export enum StreamType {
    UNIDIRECTIONAL = 0,
    BIDIRECTIONAL  = 1
};

export enum StreamOP {
    RELAY = 0,
    PASS = 1,
    STOP = 2,
};

export type StreamData = string | Buffer | Uint8Array | ArrayBuffer | Blob;

export type StreamHandlerResult = [StreamData, StreamOP];

export type StreamHandler = (message: StreamData) => Promise<StreamHandlerResult>;
