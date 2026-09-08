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

const flow = CallFlow.play("https://example.com/audio.mp3");
```

Equivalent JSON:
```json
{
    "action": "play",
    "media_url": "https://example.com/audio.mp3"
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

### Dial

Originates an outbound leg and bridges it once the target answers.

```typescript
import { CallFlow } from "@frejun/teler";

const flow = CallFlow.dial("+919967xxxx", {
  timeout: 30,
  record: true
});
```


## Media Streaming

The library provides a powerful interface for integrating real-time call audio streams from Teler to your application via WebSockets.

### StreamConnector

The `StreamConnector` lets you bridge the Teler call audio stream to your desired remote WebSocket endpoint (e.g., an AI agent). It handles message relaying between the two streams via pluggable handlers, making it highly customizable. It also handles graceful shutdown of the media streams in case of any unexpected errors.

`StreamConnector` accepts the following parameters in order:

- `remoteUrl` — The remote WebSocket URL where the call audio stream needs to be bridged.
- `streamType` — Stream mode (defaults to `StreamType.BIDIRECTIONAL`).
- `callStreamHandler` — An asynchronous `StreamHandler` function that handles incoming messages from the Teler call audio stream.
- `remoteStreamHandler` — An asynchronous `StreamHandler` function that handles incoming messages from the remote audio stream (e.g., your AI agent).
- `headers` — Optional HTTP headers (e.g., authentication tokens, API Key) sent when establishing the WebSocket connection to the remote endpoint.

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
import { StreamConnector, StreamType, StreamOP } from "@frejun/teler";
import { WebSocketServer, WebSocket } from "ws";

export const wss = new WebSocketServer({
  noServer: true,
});

const connector = new StreamConnector(
  "wss://your-ai-agent.example.com/stream",
  StreamType.BIDIRECTIONAL,
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
  {
    Authorization: `Bearer ${process.env.AGENT_API_KEY}`,
  }
);

wss.on("connection", async (callWs: WebSocket) => {
  console.log("Teler connected to WebSocket");
  await connector.bridgeStream(callWs);
});
```


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
├── UnprocessableRequestException (422)
├── RateLimitException (429)
├── InternalServerErrorException (500)
├── NotImplementedException (501)
└── NetworkException
```


### Exception Reference

| Exception | Code | Description |
|-----------|------|-------------|
| `TelerException` | `500` | Base exception, all SDK errors extend this |
| `BadParametersException` | `400` | One or more request parameters are invalid |
| `UnprocessableRequestException` | `422` | The request body failed validation |
| `UnauthorizedException` | `401` | Invalid or missing API key |
| `ForbiddenException` | `403` | Authenticated but not allowed to perform action |
| `NotFoundException` | `404` | The requested resource does not exist |
| `ConflictException` | `409` | The requested resource conflicts with the current state |
| `RateLimitException` | `429` | The rate limit has been exceeded |
| `InternalServerErrorException` | `500` | An internal server error occurred |
| `NotImplementedException` | `501` | The requested feature is not implemented |
| `NetworkException` | — | Network-level failure (timeout, DNS failure, connection refused) |

### Properties

All exceptions expose:
- `message` — human-readable error description
- `code` — HTTP-style status code or error code
- `name` — exception class name (e.g. `"BadParametersException"`)
- `details` — optional additional context about the error (e.g. raw response body)

`BadParametersException` additionally exposes:
- `param` — the name of the invalid parameter

### Serialized Form

When an exception is serialized (e.g. in logs or an API error response), it is wrapped into the following shape:

```json
{
  "message": "Invalid API Key.",
  "error": {
    "name": "ForbiddenException",
    "code": 403,
    "details": "Request failed with status code 403"
  }
}
```
