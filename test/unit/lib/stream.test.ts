import { describe, it, expect, vi, beforeEach } from "vitest";
import { StreamOP, StreamType } from "@/types/voice";
import { NotImplementedException, BadParametersException } from "@/exceptions";

const { MockWebSocket } = vi.hoisted(() => {
  class MockWebSocket {
    static OPEN = 1;
    static CONNECTING = 0;
    static instances: any[] = [];

    readyState = MockWebSocket.OPEN;
    url: string;
    options: unknown;
    listeners: Record<string, Array<(event: unknown) => void>> = {};
    private closed = false;

    send = vi.fn();
    close = vi.fn(() => {
      if (this.closed) return;
      this.closed = true;
      this.readyState = 3;
      this.emit("close", { code: 1000, reason: "test-close" });
    });

    constructor(url: string, options?: unknown) {
      this.url = url;
      this.options = options;
      MockWebSocket.instances.push(this);
    }

    addEventListener(event: string, callback: (event: unknown) => void) {
      (this.listeners[event] ??= []).push(callback);
    }

    on(event: string, callback: (data: unknown, isBinary?: boolean) => void) {
      (this.listeners[event] ??= []).push(callback);
      return this;
    }

    once(event: string, callback: (data?: unknown) => void) {
      const wrapper = (data?: unknown) => {
        callback(data);
        this.listeners[event] = this.listeners[event]?.filter(
          (cb) => cb !== wrapper
        );
      };
      (this.listeners[event] ??= []).push(wrapper);
      return this;
    }

    removeListener(event: string, callback: (data?: unknown) => void) {
      this.listeners[event] = this.listeners[event]?.filter(
        (cb) => cb !== callback
      );
      return this;
    }

    terminate = vi.fn(() => {
      if (this.closed) return;
      this.closed = true;
      this.readyState = 3;
      this.emit("close", { code: 1006, reason: "abnormal closure" });
    });

    emit(event: string, ...args: unknown[]) {
      this.listeners[event]?.forEach((cb) => (cb as any)(...args));
    }

    static reset() {
      MockWebSocket.instances = [];
    }
  }

  return { MockWebSocket };
});

vi.mock("ws", () => ({ WebSocket: MockWebSocket }));

const { StreamConnector } = await import("@/lib/stream");

describe("StreamConnector", () => {
  beforeEach(() => {
    MockWebSocket.reset();
  });

  describe("constructor validation", () => {
    it("throws NotImplementedException for unidirectional streams", () => {
      expect(
        () =>
          new StreamConnector(
            "wss://example.com",
            vi.fn(),
            vi.fn(),
            StreamType.UNIDIRECTIONAL
          )
      ).toThrow(NotImplementedException);
    });

    it("throws BadParametersException for an empty remoteUrl", () => {
      expect(
        () =>
          new StreamConnector("", vi.fn(), vi.fn(), StreamType.BIDIRECTIONAL)
      ).toThrow(BadParametersException);
    });

    it("throws BadParametersException for a whitespace-only remoteUrl", () => {
      expect(
        () =>
          new StreamConnector("   ", vi.fn(), vi.fn(), StreamType.BIDIRECTIONAL)
      ).toThrow(BadParametersException);
    });

    it("throws BadParametersException for an invalid URL", () => {
      expect(
        () =>
          new StreamConnector(
            "not-a-url",
            vi.fn(),
            vi.fn(),
            StreamType.BIDIRECTIONAL
          )
      ).toThrow(BadParametersException);
    });

    it("accepts a valid bidirectional config", () => {
      expect(
        () =>
          new StreamConnector(
            "wss://example.com",
            vi.fn(),
            vi.fn(),
            StreamType.BIDIRECTIONAL
          )
      ).not.toThrow();
    });
  });

  describe("bridgeStream", () => {
    async function bridgeAndOpen(
      connector: any,
      callWs: InstanceType<typeof MockWebSocket>
    ) {
      const bridgePromise = connector.bridgeStream(callWs as any);
      const remoteWs =
        MockWebSocket.instances[MockWebSocket.instances.length - 1];
      remoteWs.emit("open");
      await bridgePromise;
      return remoteWs as unknown as InstanceType<typeof MockWebSocket>;
    }

    it("relays a message from callWs to remoteWs when remoteWs is open", async () => {
      const callStreamHandler = vi
        .fn()
        .mockResolvedValue(["hello", StreamOP.RELAY]);
      const remoteStreamHandler = vi.fn();
      const connector = new StreamConnector(
        "wss://example.com",
        callStreamHandler,
        remoteStreamHandler,
        StreamType.BIDIRECTIONAL
      );

      const callWs = new MockWebSocket("ws://call");
      const remoteWs = await bridgeAndOpen(connector, callWs);

      callWs.emit("message", "incoming-audio", false);
      await vi.waitFor(() =>
        expect(callStreamHandler).toHaveBeenCalledWith("incoming-audio")
      );
      await vi.waitFor(() =>
        expect(remoteWs.send).toHaveBeenCalledWith("hello")
      );
    });

    it("buffers a message when remoteWs is not open, then flushes on open", async () => {
      const callStreamHandler = vi
        .fn()
        .mockResolvedValue(["queued-msg", StreamOP.RELAY]);
      const connector = new StreamConnector(
        "wss://example.com",
        callStreamHandler,
        vi.fn(),
        StreamType.BIDIRECTIONAL
      );

      const callWs = new MockWebSocket("ws://call");
      const bridgePromise = connector.bridgeStream(callWs as any);
      const remoteWs = MockWebSocket.instances[
        MockWebSocket.instances.length - 1
      ] as unknown as InstanceType<typeof MockWebSocket>;
      remoteWs.readyState = MockWebSocket.CONNECTING;

      callWs.emit("message", "incoming-audio", false);
      await vi.waitFor(() => expect(callStreamHandler).toHaveBeenCalled());

      expect(remoteWs.send).not.toHaveBeenCalled();

      remoteWs.readyState = MockWebSocket.OPEN;
      remoteWs.emit("open");
      await bridgePromise;

      expect(remoteWs.send).toHaveBeenCalledWith("queued-msg");
    });

    it("closes both sockets when call handler returns STOP", async () => {
      const callStreamHandler = vi.fn().mockResolvedValue(["", StreamOP.STOP]);
      const connector = new StreamConnector(
        "wss://example.com",
        callStreamHandler,
        vi.fn(),
        StreamType.BIDIRECTIONAL
      );

      const callWs = new MockWebSocket("ws://call");
      const remoteWs = await bridgeAndOpen(connector, callWs);

      callWs.emit("message", { data: "stop-signal" });
      await vi.waitFor(() => expect(remoteWs.close).toHaveBeenCalled());

      expect(callWs.close).toHaveBeenCalled();
    });

    it("relays a message from remoteWs to callWs", async () => {
      const remoteStreamHandler = vi
        .fn()
        .mockResolvedValue(["ai-response", StreamOP.RELAY]);
      const connector = new StreamConnector(
        "wss://example.com",
        vi.fn(),
        remoteStreamHandler,
        StreamType.BIDIRECTIONAL
      );

      const callWs = new MockWebSocket("ws://call");
      const remoteWs = await bridgeAndOpen(connector, callWs);

      remoteWs.emit("message", "model-audio-chunk", false);
      await vi.waitFor(() =>
        expect(remoteStreamHandler).toHaveBeenCalledWith("model-audio-chunk")
      );

      expect(callWs.send).toHaveBeenCalledWith("ai-response");
    });

    it("closes callWs when remoteWs closes", async () => {
      const connector = new StreamConnector(
        "wss://example.com",
        vi.fn(),
        vi.fn(),
        StreamType.BIDIRECTIONAL
      );
      const callWs = new MockWebSocket("ws://call");
      const remoteWs = await bridgeAndOpen(connector, callWs);

      remoteWs.emit("close", { code: 1000, reason: "done" });

      expect(callWs.close).toHaveBeenCalled();
    });

    it("closes remoteWs when callWs closes", async () => {
      const connector = new StreamConnector(
        "wss://example.com",
        vi.fn(),
        vi.fn(),
        StreamType.BIDIRECTIONAL
      );
      const callWs = new MockWebSocket("ws://call");
      const remoteWs = await bridgeAndOpen(connector, callWs);

      callWs.emit("close", { code: 1000, reason: "done" });

      expect(remoteWs.close).toHaveBeenCalled();
    });

    it("drops messages when the buffer queue is full", async () => {
      const callStreamHandler = vi
        .fn()
        .mockResolvedValue(["overflow-msg", StreamOP.RELAY]);
      const connector = new StreamConnector(
        "wss://example.com",
        callStreamHandler,
        vi.fn(),
        StreamType.BIDIRECTIONAL
      );

      const callWs = new MockWebSocket("ws://call");
      const bridgePromise = connector.bridgeStream(callWs as any);
      const remoteWs = MockWebSocket.instances[
        MockWebSocket.instances.length - 1
      ] as unknown as InstanceType<typeof MockWebSocket>;
      remoteWs.readyState = MockWebSocket.CONNECTING;

      for (let i = 0; i < 51; i++) {
        callWs.emit("message", `msg-${i}`, false);
        await vi.waitFor(() =>
          expect(callStreamHandler).toHaveBeenCalledTimes(i + 1)
        );
      }

      expect(remoteWs.send).not.toHaveBeenCalled();
      remoteWs.emit("open");
      await bridgePromise;
    });

    it("handles non-string binary data from remoteWs (array of buffers)", async () => {
      const remoteStreamHandler = vi
        .fn()
        .mockResolvedValue(["reply", StreamOP.RELAY]);
      const connector = new StreamConnector(
        "wss://example.com",
        vi.fn(),
        remoteStreamHandler,
        StreamType.BIDIRECTIONAL
      );

      const callWs = new MockWebSocket("ws://call");
      const bridgePromise = connector.bridgeStream(callWs as any);
      const remoteWs =
        MockWebSocket.instances[MockWebSocket.instances.length - 1];
      remoteWs.emit("open");
      await bridgePromise;

      const chunks = [Buffer.from("a"), Buffer.from("b")];
      remoteWs.emit("message", Buffer.concat(chunks), true);

      await vi.waitFor(() =>
        expect(remoteStreamHandler).toHaveBeenCalledWith(Buffer.concat(chunks))
      );
    });

    it("closes callWs when remoteWs errors", async () => {
      const connector = new StreamConnector(
        "wss://example.com",
        vi.fn(),
        vi.fn(),
        StreamType.BIDIRECTIONAL
      );
      const callWs = new MockWebSocket("ws://call");
      const remoteWs = await bridgeAndOpen(connector, callWs);

      remoteWs.emit("error", new Error("connection reset"));

      expect(callWs.close).toHaveBeenCalled();
    });

    it("closes remoteWs when callWs errors", async () => {
      const connector = new StreamConnector(
        "wss://example.com",
        vi.fn(),
        vi.fn(),
        StreamType.BIDIRECTIONAL
      );
      const callWs = new MockWebSocket("ws://call");
      const remoteWs = await bridgeAndOpen(connector, callWs);

      callWs.emit("error", new Error("connection reset"));

      expect(remoteWs.close).toHaveBeenCalled();
    });

    it("handles an invalid response from the call stream handler without throwing", async () => {
      const callStreamHandler = vi
        .fn()
        .mockRejectedValue(new Error("handler exploded"));
      const connector = new StreamConnector(
        "wss://example.com",
        callStreamHandler,
        vi.fn(),
        StreamType.BIDIRECTIONAL
      );
      const callWs = new MockWebSocket("ws://call");
      const bridgePromise = connector.bridgeStream(callWs as any);
      const remoteWs =
        MockWebSocket.instances[MockWebSocket.instances.length - 1];
      remoteWs.emit("open");
      await bridgePromise;

      expect(() => callWs.emit("message", "bad-input", false)).not.toThrow();
      await vi.waitFor(() => expect(callStreamHandler).toHaveBeenCalled());
    });

    it("handles an invalid response from the remote stream handler without throwing", async () => {
      const remoteStreamHandler = vi
        .fn()
        .mockRejectedValue(new Error("handler exploded"));
      const connector = new StreamConnector(
        "wss://example.com",
        vi.fn(),
        remoteStreamHandler,
        StreamType.BIDIRECTIONAL
      );
      const callWs = new MockWebSocket("ws://call");
      const bridgePromise = connector.bridgeStream(callWs as any);
      const remoteWs =
        MockWebSocket.instances[MockWebSocket.instances.length - 1];
      remoteWs.emit("open");
      await bridgePromise;

      expect(() => remoteWs.emit("message", "bad-input", false)).not.toThrow();
      await vi.waitFor(() => expect(remoteStreamHandler).toHaveBeenCalled());
    });

    it("closes both sockets when remote handler returns STOP", async () => {
      const remoteStreamHandler = vi
        .fn()
        .mockResolvedValue(["", StreamOP.STOP]);
      const connector = new StreamConnector(
        "wss://example.com",
        vi.fn(),
        remoteStreamHandler,
        StreamType.BIDIRECTIONAL
      );

      const callWs = new MockWebSocket("ws://call");
      const remoteWs = await bridgeAndOpen(connector, callWs);

      remoteWs.emit("message", { data: "stop-signal-from-remote" });
      await vi.waitFor(() => expect(callWs.close).toHaveBeenCalled());

      expect(remoteWs.close).toHaveBeenCalled();
    });

    it("converts non-string call data to a string via toString", async () => {
      const callStreamHandler = vi
        .fn()
        .mockResolvedValue(["reply", StreamOP.RELAY]);
      const connector = new StreamConnector(
        "wss://example.com",
        callStreamHandler,
        vi.fn(),
        StreamType.BIDIRECTIONAL
      );

      const callWs = new MockWebSocket("ws://call");
      await bridgeAndOpen(connector, callWs);

      const bufferPayload = Buffer.from("binary-audio-chunk", "utf-8");
      callWs.emit("message", bufferPayload, true);

      await vi.waitFor(() =>
        expect(callStreamHandler).toHaveBeenCalledWith(bufferPayload)
      );
    });

    it("does not queue a buffered message when the handler returns non-string data", async () => {
      const callStreamHandler = vi
        .fn()
        .mockResolvedValue([Buffer.from("binary"), StreamOP.RELAY]);
      const connector = new StreamConnector(
        "wss://example.com",
        callStreamHandler,
        vi.fn(),
        StreamType.BIDIRECTIONAL
      );

      const callWs = new MockWebSocket("ws://call");
      const bridgePromise = connector.bridgeStream(callWs as any);
      const remoteWs = MockWebSocket.instances[
        MockWebSocket.instances.length - 1
      ] as unknown as InstanceType<typeof MockWebSocket>;
      remoteWs.readyState = MockWebSocket.CONNECTING;

      callWs.emit("message", "trigger", false);
      await vi.waitFor(() => expect(callStreamHandler).toHaveBeenCalled());
      expect(remoteWs.send).not.toHaveBeenCalled();
      remoteWs.emit("open");
      await bridgePromise;
    });

    it("uses default streamType and headers when not explicitly provided", () => {
      expect(
        () =>
          new (StreamConnector as any)(
            "wss://example.com",
            vi.fn(),
            vi.fn(),
            undefined,
            undefined
          )
      ).not.toThrow();
    });
  });
});
