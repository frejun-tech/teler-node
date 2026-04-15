# Teler Node SDK

This Node library offers a lightweight and developer-friendly abstraction over the FreJun Teler API.

## What is Teler?

Teler is a programmable voice API by FreJun. It handles carriers, phone numbers, and real-time audio streaming so you can connect AI models directly to phone calls. → [frejun.ai](https://frejun.ai)

## Requirements
- Node.js 14.x or later
- npm or yarn

## Features
- **Initiate Calls**: Easily start outbound calls using the Teler REST API.
- **Call Flows**: Control what happens on the call using flows like Streaming, Playing Audio, and Hanging up.
- **Real-time Media Streaming**: Stream call audio via WebSockets for Conversational AI, transcription, and insights.

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
const call = await client.calls.create({
    from_number: "+918065xxxx",
    to_number: "+919967xxxx",
    flow_url: "https://your-domain.com/flow",
    status_callback_url: "https://your-domain.com/receiver",
    record: true
});
```

## Call Flows

When a call connects, Teler will fetch instructions from your `flow_url`. You can control the call using different actions:

### Stream

Initiates bidirectional WebSocket streaming of the call's audio.

```json
{
    "action": "stream",
    "url": "wss://your-domain.com/stream"
}
```

### Play

Plays an audio file to the caller.

```json
{
    "action": "play",
    "url": "https://example.com/audio.mp3"
}
```

### Hangup

Ends the call immediately.

```json
{
    "action": "hangup"
}
```

## Media Streaming

The library provides a powerful interface for integrating real-time call audio streams from Teler to your application via WebSockets.

### StreamConnector

The `StreamConnector` lets you bridge the Teler call audio stream to your desired remote websocket endpoint (e.g., an AI agent). It handles message relaying between the two streams via pluggable handlers, making it highly customizable. It also handles graceful shutdown of the media streams in case of any unexpected errors.

It takes the following parameters:

- `streamType` - Only `StreamType.BIDIRECTIONAL` is supported for now.
- `remoteUrl` - The remote websocket URL where the call audio stream needs to be bridged.
- `callStreamHandler` - An asynchronous `StreamHandler` function that handles incoming messages from the Teler call audio stream.
- `remoteStreamHandler` - An asynchronous `StreamHandler` function that handles incoming messages from the remote audio stream (e.g., your AI agent).

### Stream Handlers

A `StreamHandler` asynchronous function receives the incoming messages on a WebSocket, processes them, and returns a tuple (e.g., `[string, StreamOp]`) where `StreamOp` is an operation flag that decides the subsequent action the `StreamConnector` will take.

- **`callStreamHandler`**: Receives audio data from the caller and forwards it to an AI model.
- **`remoteStreamHandler`**: Receives audio data from the remote endpoint (e.g., AI agent's response) and sent back to the caller.

`StreamOp` can be one of:

- `StreamOp.RELAY` - Relays the message to the other stream. The message needs to be supplied as a string as the first item in the returned tuple.
- `StreamOp.PASS` - Does not relay any message to the other stream. Any message in the returned tuple will be ignored.
- `StreamOp.STOP` - Stops both streams, ends the call and exits gracefully. Any message in the returned tuple will be ignored.

## Error Handling

`teler` throws typed exceptions that extend the base `TelerException` class, allowing you to handle errors precisely.

### Exception Hierarchy
```
TelerException (base)
├── BadParametersException   (400)
├── UnauthorizedException    (401)
├── ForbiddenException       (403)
└── NotImplementedException  (501)
```

### Exception Reference

| Exception | Code | Description |
|-----------|------|-------------|
| `TelerException` | `500` | Base exception, all SDK errors extend this |
| `BadParametersException` | `400` | One or more request parameters are invalid |
| `UnauthorizedException` | `401` | Invalid or missing API key |
| `ForbiddenException` | `403` | Authenticated but not allowed to perform action |
| `NotImplementedException` | `501` | Feature not yet implemented |

### Properties

All exceptions expose:
- `message` — human-readable error description
- `code` — HTTP-style status code
- `name` — exception class name (e.g. `"BadParametersException"`)

`BadParametersException` additionally exposes:
- `param` — the name of the invalid parameter
