# README #

# Teler Node SDK

Official Node client for the FreJun Teler API. Provides typed abstractions for initiating calls, managing streams, and handling telephony events — with minimal setup and full TypeScript support.


### What is this repository for? ###

* Quick summary: The official Node library for the Teler Voice API.
* Version: 1.0.0


## Basic Usage

The built-in client interfaces provide methods for creating and managing Teler's REST resources.

### Initiate Call

Initiate call using Teler SDK, passing the required parameters.

```bash 
import { TelerClient} from "teler-sdk-node";
import { flowUrl, statusCallbackUrl } from '../../utils/constants';

const { fromNumber, toNumber, record } = req.body;
const telerClient = new TelerClient(API_KEY);

const call = await telerClient.calls.create({
    from_number: fromNumber,
    to_number: toNumber,
    flow_url: flowUrl,
    status_callback_url: statusCallbackUrl,
    record: record ?? true
});
```

### Media Streaming

The library provides a simple interface for integrating real-time call audio streams from Teler into your application, unlocking advanced capabilities such as Conversational AI, Real-time transcription, and Actionable insights.

#### StreamConnector

This class lets you bridge the call audio stream to your desired websocket endpoint. It handles message relaying between the two streams via pluggable handlers, making it highly customizable. It also handles graceful shutdown of the media streams in case of any unexpected errors.

It takes the following 4 parameters:

- `streamType` - Only `StreamType.BIDIRECTIONAL` is supported for now.
- `remoteUrl` - The remote websocket URL where the call audio stream needs to be bridged.
- `callStreamHandler` - An asynchronous `StreamHandler` function that handles the call audio stream.
- `remoteStreamHandler` - An asynchronous `StreamHandler` function that handles the remote audio stream.

#### StreamHandler

A `StreamHandler` asynchronous function receives the incoming messages on the websocket, processes them, and returns a tuple (e.g., `[string, StreamOp]`) where `StreamOp` is an operation flag that decides the subsequent action the `StreamConnector` will take.

`StreamOp` can be one of:

- `StreamOp.RELAY` - Relays the message to the other stream. The message needs to be supplied as a string as the first item in the returned tuple.
- `StreamOp.PASS` - Does not relay any message to the other stream. Any message in the returned tuple will be ignored.
- `StreamOp.STOP` - Stops both streams, ends the call and exits gracefully. Any message in the returned tuple will be ignored.