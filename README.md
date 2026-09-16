# Teler Node SDK

This Node library offers a lightweight and developer-friendly abstraction over the FreJun Teler API.

## What is Teler?

Teler is a programmable voice API by FreJun. It handles carriers, phone numbers, and real-time audio streaming so you can connect AI models directly to phone calls. → [frejun.ai](https://frejun.ai)

## Requirements
- Node.js 18.x or later
- npm or yarn

## Features
- **Initiate Calls** — Start outbound calls using the Teler REST API.
- **Call Flows** — Control call behavior with `CallFlow` helpers (`stream`, `play`, `hangup`, `dial`).
- **Call Controls & Mutations** — Manage live calls in real time with `mute`, `DTMF`, `playback`, and `transfer`.
- **Real-time Media Streaming** — Stream call audio via WebSockets using `StreamConnector` for Conversational AI, transcription, and insights.
- **Voice Apps & Virtual Numbers** — Configure call routing and manage virtual numbers.
- **SIP Trunking & IP ACLs** — Connect your own carrier/PBX and manage IP access control lists.
- **Secrets & Webhooks** — Create and rotate secrets to authenticate incoming webhooks from Teler.

## Installation

Install the SDK using npm:

```bash
npm install @frejun/teler
```

Or using yarn:

```bash
yarn add @frejun/teler
```


## Initiate call using Client

The `Client` is the main entry point to interact with the Teler API.

```typescript
import { Client } from "@frejun/teler";

// Initialize the client with your API key
const client = new Client("YOUR_API_KEY");

// Initiate a call
const call = await client.voice.calls.create({
    fromNumber: "+918065xxxx",
    toNumber: "+919967xxxx",
    flowUrl: "https://your-domain.com/flow",
    statusCallbackUrl: "https://your-domain.com/receiver",
    record: true
});
```


## Field Naming

The SDK uses **camelCase** for everything you write in TypeScript REST API requests/responses (e.g. `client.voice.calls.create`) are automatically converted to/from the API's snake_case wire format.

In both cases, user- or server-defined key/value bags (e.g. `customHeaders` SIP header names) are passed through untouched, their keys are never case-converted.


## Pagination

List endpoints (`client.voice.apps.list()`, `client.sip.trunks.list()`, `client.events.list()`, etc.) return a single page. To iterate over all results without hand-rolling a cursor loop, use the `listAutoPagination()` sibling method:

```typescript
// Fetch all items across pages lazily
for await (const app of client.voice.apps.listAutoPagination()) {
  console.log(app.id, app.name);
}

// Filters work the same as list(), paging is managed internally
for await (const event of client.events.listAutoPagination({ type: "call.completed" })) {
  console.log(event.id);
}
```

**Server-side default:** when you omit `limit`, the server defaults to 50 results per page. A plain `.list()` call is not guaranteed to return everything.

**Available on:** `client.voice.apps` (and `.listVirtualNumbersAutoPagination()`), `client.voice.calls`, `client.sip.trunks` (and `.listVirtualNumbersAutoPagination()`), `client.sip.calls`, `client.sip.ipAcls`, `client.virtualNumbers`, `client.secrets`, and `client.events`.


## Call Flows

When a call connects, Teler fetches instructions from your `flowUrl`. You can construct responses using the `CallFlow` helper class or raw JSON action payloads:

### Stream

Initiates bidirectional WebSocket streaming of the call's audio.

```typescript
import { CallFlow } from "@frejun/teler";

const flow = CallFlow.stream("wss://your-domain.com/stream", {
  sampleRate: "8k",
  chunkSize: 400,
  record: true
});
```

Equivalent JSON:
```json
{
    "action": "stream",
    "ws_url": "wss://your-domain.com/stream",
    "sample_rate": "8k",
    "chunk_size": 400,
    "record": true
}
```

### Play

Plays an audio file to the caller.

```typescript
import { CallFlow } from "@frejun/teler";

const flow = CallFlow.play("https://example.com/audio.mp3", "https://example.com/hangup");
```

Equivalent JSON:
```json
{
    "action": "play",
    "media_url": "https://example.com/audio.mp3",
    "flow_url": "https://example.com/hangup"
}
```

### Dial

Originates an outbound leg and bridges it once the target answers.

```typescript
import { CallFlow } from "@frejun/teler";

const flow = CallFlow.dial("+919967xxxx", {
  timeout: 30,
  record: true
});
```

Equivalent JSON:
```json
{
    "action": "dial",
    "to": "+919967xxxx",
    "timeout": 30,
    "record": true,
}
```

### Hangup

Ends the call immediately.

```typescript
import { CallFlow } from "@frejun/teler";

const flow = CallFlow.hangup();
```

Equivalent JSON:
```json
{
    "action": "hangup"
}
```


## Call Controls & Mutations

Once a call is live, you can control it in real time via `client.voice.mutations` and `client.voice.operations`:

```typescript
// Mute (or unmute) a specific leg
await client.voice.mutations.mute(callId, { legId, on: true });

// Send DTMF tones
await client.voice.mutations.dtmf(callId, { legId, digits: "123#" });

// Play audio into the call
await client.voice.mutations.play(callId, { legId, mediaUrl: "https://example.com/audio.mp3" });

// End the call, or a single leg of it
await client.voice.mutations.hangup(callId, { legId });

// Transfer the call to a new PSTN destination
await client.voice.operations.transfer(callId, {
  target: { kind: "pstn", number: "+919967xxxx" }
});
```

Each method accepts three optional trailing parameters: `idempotencyKey`, `retry`, and `baseRetryDelayMs`:

```typescript
await client.voice.mutations.mute(
  callId,
  { legId, on: true },
  "my-own-key", // idempotencyKey (optional)
  true,         // retry on network errors/503s (optional, default: false)
  300           // base retry delay in ms (optional, default: 300, capped at 2000ms)
);
```

### Idempotency Keys

If you omit `idempotencyKey`, the SDK generates a random UUID for you. That's enough to make the SDK's **own** internal retries (the `retry`/`baseRetryDelayMs` behavior above) safe, the same key is reused across every retry attempt of a single call.

It does **not** make retries safe across separate calls. If your application retries a mutation itself after a client-side timeout, a crash and restart, or its own retry logic, the SDK has no way to know it's the same logical operation, and a fresh call generates a fresh key. The server will treat it as a new request and may process it twice.

If you need that guarantee, generate your own key up front and pass it explicitly, reusing the exact same value every time you retry the same logical operation:

```typescript
import { randomUUID } from "crypto";

const idempotencyKey = randomUUID(); // generate once, store it alongside your own retry state

await client.voice.mutations.hangup(callId, { legId }, idempotencyKey);
// ...if this call needs to be retried later by your own logic, pass the same idempotencyKey again
```


## Media Streaming

The library provides a powerful interface for integrating real-time call audio streams from Teler to your application via WebSockets.

### StreamConnector

The `StreamConnector` lets you bridge the Teler call audio stream to your desired remote WebSocket endpoint (e.g., an AI agent). It handles message relaying between the two streams via pluggable handlers, making it highly customizable. It also handles graceful shutdown of the media streams in case of any unexpected errors.

Create a `StreamConnector` via the `Client` using `client.streamConnector.create()`, which passes the client's configured logger automatically:

```typescript
const connector = client.streamConnector.create(
  remoteUrl,
  callStreamHandler,
  remoteStreamHandler,
  streamType,        // optional, defaults to StreamType.BIDIRECTIONAL
  headers,           // optional
  connectTimeoutMs   // optional, defaults to 10000ms
);
```

The `create()` method accepts the following parameters:

- `remoteUrl` — The remote WebSocket URL where the call audio stream needs to be bridged.
- `callStreamHandler` — An asynchronous `StreamHandler` function that handles incoming messages from the Teler call audio stream.
- `remoteStreamHandler` — An asynchronous `StreamHandler` function that handles incoming messages from the remote audio stream (e.g., your AI agent).
- `streamType` — (Optional) Stream mode (defaults to `StreamType.BIDIRECTIONAL`).
- `headers` — (Optional) HTTP headers (e.g., authentication tokens, API Key) sent when establishing the WebSocket connection to the remote endpoint.
- `connectTimeoutMs` — (Optional) Connection timeout in milliseconds (defaults to 10,000ms). If the remote endpoint doesn't establish a WebSocket connection within this time, the `bridgeStream()` call rejects with an error and both sockets are cleaned up.

### Stream Handlers

A `StreamHandler` asynchronous function receives incoming messages over a WebSocket, processes them, and returns a `[StreamData, StreamOP]` tuple. The `StreamOP` value determines the action that the `StreamConnector` takes next.

- **`callStreamHandler`** — Receives audio data from the caller and forwards it to an AI model.
- **`remoteStreamHandler`** — Receives audio data from the remote endpoint (e.g., AI agent's response) and sends it back to the caller.

`StreamOP` can be one of the following:

- **`StreamOP.RELAY`**  
  Relays the message to the other stream. The first element of the returned tuple must contain the message to relay.

- **`StreamOP.PASS`**  
  Does not relay any message to the other stream. Any message included in the returned tuple is ignored.

- **`StreamOP.STOP`**  
  Stops both streams, ends the call, and exits gracefully. Any message included in the returned tuple is ignored.

### `StreamData`

`StreamData` represents the data returned by a stream handler. It can be any of the following:

- `string`
- `Buffer`
- `Uint8Array`
- `ArrayBuffer`
- `Blob`

### Example

```typescript
import { Client, StreamType, StreamOP } from "@frejun/teler";
import { WebSocketServer, WebSocket } from "ws";

// Initialize the client with your API key
const client = new Client("YOUR_API_KEY");

export const wss = new WebSocketServer({
  noServer: true,
});

const connector = client.streamConnector.create(
  "wss://your-ai-agent.example.com/stream",
  async (message) => {
    // Handle audio/data coming from Teler
    console.log("Received from call:", message);
    return [message, StreamOP.RELAY];
  },
  async (message) => {
    // Handle audio/data coming from your remote AI agent
    console.log("Received from agent:", message);
    return [message, StreamOP.RELAY];
  },
  StreamType.BIDIRECTIONAL,
  {
    Authorization: `Bearer ${process.env.AGENT_API_KEY}`,
  }
);

wss.on("connection", async (callWs: WebSocket) => {
  console.log("Teler connected to WebSocket");
  await connector.bridgeStream(callWs);
});
```


## Logging

By default, `Client` is silent. To enable logging, pass a `Logger` instance:

```typescript
import { Client, type Logger } from "@frejun/teler";
import pino from "pino"; // Bring your own logger (pino, winston, etc.)

const logger = pino();

const client = new Client("YOUR_API_KEY", {
  logger  // Logs from the client and StreamConnector go to your logger
});
```

A logger must implement the `Logger` interface: `{ info(obj, msg?), warn(obj, msg?), error(obj, msg?) }`. Any logger that matches this interface structurally works for example, pino, winston, or a custom implementation. The client and `StreamConnector` use this logger for emitting internal logs (connection events, errors).


## Error Handling

`@frejun/teler` throws typed exceptions that extend the base `TelerException` class, allowing you to handle errors precisely.

### Exception Hierarchy
```
TelerException (base)
├── BadParametersException (400)
├── UnauthorizedException (401)
├── ForbiddenException (403)
├── NotFoundException (404)
├── ConflictException (409)
├── GoneException (410)
├── UnprocessableRequestException (422)
├── RateLimitException (429)
├── InternalServerErrorException (500)
├── NotImplementedException (501)
└── NetworkException
```


### Exception Reference

| Exception | Status | Description |
|-----------|--------|-------------|
| `TelerException` | — | Base exception, all SDK errors extend this |
| `BadParametersException` | `400` | One or more request parameters are invalid |
| `UnprocessableRequestException` | `422` | The request body failed validation |
| `UnauthorizedException` | `401` | Invalid or missing API key |
| `ForbiddenException` | `403` | Authenticated but not allowed to perform action |
| `NotFoundException` | `404` | The requested resource does not exist |
| `ConflictException` | `409` | The requested resource conflicts with the current state |
| `GoneException` | `410` | The requested resource is no longer available |
| `RateLimitException` | `429` | The rate limit has been exceeded |
| `InternalServerErrorException` | `500` | An internal server error occurred |
| `NotImplementedException` | `501` | The requested feature is not implemented |
| `NetworkException` | — | Network-level failure (timeout, DNS failure, connection refused) |

### Properties

All exceptions expose:
- `message` — human-readable error description
- `status` — HTTP status code (undefined for `NetworkException` since no response was received)
- `errorCode` — machine-readable error code from the API response body or network layer (e.g. `call_not_live`, `ECONNREFUSED`)
- `type` — machine-readable error category from the API (e.g. `"invalid_state"`); omitted for 422 validation errors
- `name` — exception class name (e.g. `"BadParametersException"`)
- `details` — the full parsed API response body, typed as `TelerErrorResponseBody` (see shape below); omitted for `NetworkException`

`UnprocessableRequestException` additionally exposes:
- `param` — the dot-joined path to the invalid field, taken verbatim from the API's validation error (e.g. `"body.auth_credential.username"`). Not populated for `BadParametersException` or any other exception today, even though the property exists on the base class.

> **Note:** `details` and `param` reflect the raw API response exactly as received, unlike successful responses, they are **not** converted to camelCase. The API's own error messages may also reference fields by their snake_case wire name (e.g. `"cursor_after and cursor_before are mutually exclusive"`), even when you passed `cursorAfter`/`cursorBefore` in your SDK call.

### API Response Body Shape

The `details` field holds the full API response body, with the following structure:

```typescript
interface TelerErrorResponseBody {
  success?: boolean;
  message?: string;
  code?: string;                // (same as the exception's errorCode)
  type?: string;                // (same as the exception's type)
  errors?: Array<{
    loc?: (string | number)[];  // path to the invalid field (e.g. ["body", "auth_credential", "username"])
    msg?: string;               // validation error message
    type?: string;              // error type (e.g. "string_too_short")
    input?: unknown;            // the invalid input value
    ctx?: unknown;              // error context (e.g. { min_length: 5 })
  }>;
}
```

### Serialized Form

When an exception is serialized (e.g. in logs or an API error response), it is wrapped with this TypeScript shape:

```typescript
interface SerializedTelerException {
  message: string;
  error: {
    name: string;                              // exception class name
    status: number;                            // HTTP status code
    errorCode?: string;                        // machine-readable error code
    type?: string;                             // error category (omitted for 422)
    param?: string;                            // invalid param path, raw wire field names, not camelCased (UnprocessableRequestException only)
    details?: TelerErrorResponseBody;          // full API response body
  };
}
```

**Example 1** — Simple resource not found (404):

```json
{
  "message": "The requested call was not found.",
  "error": {
    "name": "NotFoundException",
    "status": 404,
    "details": {
      "success": false,
      "message": "The requested call was not found."
    }
  }
}
```

**Example 2** — Validation error (422):

```json
{
  "message": "Validation Error",
  "error": {
    "name": "UnprocessableRequestException",
    "status": 422,
    "param": "body.auth_credential.username",
    "details": {
      "success": false,
      "message": "Validation Error",
      "errors": [
        {
          "type": "string_too_short",
          "loc": ["body", "auth_credential", "username"],
          "msg": "String should have at least 5 characters",
          "input": "usr",
          "ctx": { "min_length": 5 }
        }
      ]
    }
  }
}
```

**Example 3** — Call control failed with error code and type (409):

```json
{
  "message": "The call is not in a state that accepts controls.",
  "error": {
    "name": "ConflictException",
    "status": 409,
    "errorCode": "call_not_live",
    "type": "invalid_state",
    "details": {
      "success": false,
      "message": "The call is not in a state that accepts controls.",
      "code": "call_not_live",
      "type": "invalid_state"
    }
  }
}
```
