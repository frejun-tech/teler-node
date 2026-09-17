# Changelog

All notable changes to the Teler Node SDK are documented in this file.

## [2.0.0] - 2026-09-16

### Architecture

Complete rewrite from single-resource to modular platform SDK.

#### New Resource Managers

- **`client.voice`** — Voice apps, call initiation, call control, and operations.
  - `apps` — Create and manage voice apps.
  - `calls` — Initiate outbound calls, access call logs.
  - `mutations` — Real-time call control (mute/unmute, DTMF sending, hangup).
  - `operations` — Transfer an in-progress call to a new destination.

- **`client.sip`** — SIP trunking and IP-based access control.
  - `trunks` — Configure SIP trunks with auth, encryption, and inbound route.
  - `calls` — Access SIP call logs and detailed call information.
  - `ipAcls` — Control which source IPs can originate calls via SIP trunks.

- **`client.virtualNumbers`** — Virtual number management.
  - Manage virtual numbers with routing configuration.

- **`client.events`** — Call event history and webhook logs.
  - Access detailed call events and incoming webhook audit logs.

- **`client.recordings`** — Call recording.
  - Retrieve and download call recordings as audio streams.

- **`client.secrets`** — Webhook authentication key management.
  - Create, rotate, and revoke webhook signing secrets.

- **`client.streamConnector`** — Bidirectional audio streaming (NEW).
  - `bridgeStream(callWs)` — Bridge call WebSocket to remote AI/transcription endpoint.
  - Configurable handler callbacks, custom headers, timeout (10s default), optional logger.
  - Automatic heartbeat (ping/pong) on both call and remote connections to detect stale links.

### Exception System (Complete Rewrite)

**1.0.10:** 4 exception types (TelerException, BadParametersException, UnauthorizedException, ForbiddenException, NotImplementedException).

**2.0.0:** 11 comprehensive exception types mapping HTTP status codes:
- `BadParametersException` (400)
- `UnauthorizedException` (401)
- `ForbiddenException` (403)
- `NotFoundException` (404) — NEW
- `ConflictException` (409) — NEW
- `GoneException` (410) — NEW
- `UnprocessableRequestException` (422) — NEW
- `RateLimitException` (429) — NEW
- `InternalServerErrorException` (500) — NEW
- `NotImplementedException` (501)
- `NetworkException` — NEW (network-level failures without HTTP response)

All exceptions now support `TelerExceptionOptions` with message, details, status, errorCode, type, and param fields.

### Call Flow Actions

**1.0.10:** 3 actions (stream, play, hangup).

**2.0.0:** 4 actions with enhanced parameters:
- `stream(wsUrl, options)` — Bidirectional audio streaming with sampleRate, chunkSize, record.
- `play(mediaUrl, flowUrl?)` — NEW: `nextFlowUrl` parameter for chaining flows.
- `hangup()` — End call immediately.
- `dial(to, options)` — NEW: Complex dial action with timeout, record modes, custom SIP headers, ringback mode, nested actions (dialMusic, confirmSound, onNoAnswer, onBusy, onFailure).

### HTTP & Retry Mechanism (NEW)

- **HttpResourceManager** — Unified HTTP abstraction for all REST operations (was implicit in Client).
- **Retry with exponential backoff + full jitter** — Prevents thundering herd under load.
  - GET/DELETE retry by default (3 attempts, base 100ms).
  - POST retries configurable (base 500ms).
  - PATCH retries configurable (base 500ms).
  - Max retry delay cap configurable per request.
- **Retry-After header support** — Respects RFC 7231 for 429 Rate Limit responses; falls back to jittered exponential backoff.
- **Retry-safe request reuse** — Same Idempotency-Key header on all retry attempts.
- **Network error classification** — Distinguishes network failures (NetworkException) from server errors.

### Type System Reorganization

**1.0.10:** Single `types.ts` file.

**2.0.0:** Modular type organization:
- `types/voice.ts` — Call, App, Mutation, Operation types.
- `types/sip.ts` — Trunk, IP ACL, SIP Call types.
- `types/events.ts` — Event and webhook types.
- `types/secrets.ts` — Secret types.
- `types/common.ts` — Shared enums (StreamType, StreamOP, RecordingType, RingbackMode, DialNestedAction).
- `types/core.ts` — HTTP method and response envelope types.

### Key Infrastructure

- **Case Conversion (Bidirectional)** — Recursive camelCase ↔ snake_case conversion with prototype pollution prevention.
  - Shared opaque fields list (`properties`, `customHeaders`, `payload`) to preserve user- or server-defined key names.
- **Idempotency** — Automatic Idempotency-Key header generation and injection for POST, when not passed (NEW).
- **Logger** — Optional singleton pattern; pass custom logger to Client or streamConnector for all diagnostics.

### Public Exports

SDK exports only the public API surface; internal implementation details are not exposed:

- `Client` — Sole entry point for API access.
- All typed request/response models and enums (`types/voice`, `types/sip`, `types/events`, `types/secrets`, `types/common`, `types/core`).
- `CallFlow` — Static helper class for building call-flow action JSON.
- `StreamConnector` — Can be used standalone (no Client required) for WebSocket audio bridging; also available via `client.streamConnector.create()`.
- Exception classes — Typed errors for `instanceof` checks and error handling.
- `Logger` type and `TelerErrorResponseBody` type — For custom logger implementations and API error inspection.

Internal modules (config defaults, case-conversion utilities, idempotency-key generation, raw HTTP client) are not exported and should not be imported directly.

### Breaking Changes

- **Call resource manager removed** — `client.calls.create(payload)` no longer exists. Initiate calls using `client.voice.calls.create(payload)` instead.
- **StreamConnector constructor signature** — `streamType` now 4th parameter (defaults to BIDIRECTIONAL).
- **Removed pino dependency** — SDK no longer includes pino. Pass optional logger to Client for diagnostics.

### Changed

- **Default API version** — `2026-06-01`.
- **Strict camelCase enforcement** — All TypeScript code, JSDoc, and exports follow strict camelCase.
- **Client constructor** — Now accepts `ClientOptions` (baseURL, logger, baseTimeout, recordingTimeout).

### Added

- Full API coverage for voice apps, SIP trunks, virtual numbers, events, recordings, and secrets.
- Dial action with nested callbacks (onNoAnswer, onBusy, onFailure, dialMusic, confirmSound).
- Flow URL chaining in play action.
- Retry timeout and delay configuration per request.
- Comprehensive error response parsing (status, errorCode, type, param, errors array).

### Fixed

- WebSocket connection lifecycle: `bridgeStream` waits for connection open event with default 10s timeout before returning.
- Stream socket cleanup on disconnect/error to prevent resource leaks.

---

## [1.0.10]

For prior versions, see https://www.npmjs.com/package/@frejun/teler
