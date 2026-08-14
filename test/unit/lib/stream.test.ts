import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StreamOP, StreamType } from '@/types/voice';
import { NotImplementedException, BadParametersException } from '@/exceptions';

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
      this.emit('close', { code: 1000, reason: 'test-close' });
    });

    constructor(url: string, options?: unknown) {
      this.url = url;
      this.options = options;
      MockWebSocket.instances.push(this);
    }

    addEventListener(event: string, callback: (event: unknown) => void) {
      (this.listeners[event] ??= []).push(callback);
    }

    emit(event: string, payload?: unknown) {
      this.listeners[event]?.forEach((cb) => cb(payload));
    }

    static reset() {
      MockWebSocket.instances = [];
    }
  }

  return { MockWebSocket };
});

vi.mock('ws', () => ({ WebSocket: MockWebSocket }));

const { StreamConnector } = await import('@/lib/stream');

describe('StreamConnector', () => {
  beforeEach(() => {
    MockWebSocket.reset();
  });

  describe('constructor validation', () => {
    it('throws NotImplementedException for unidirectional streams', () => {
      expect(
        () =>
          new StreamConnector(
            'wss://example.com',
            StreamType.UNIDIRECTIONAL,
            vi.fn(),
            vi.fn()
          )
      ).toThrow(NotImplementedException);
    });

    it('throws BadParametersException for an empty remoteUrl', () => {
      expect(
        () => new StreamConnector('', StreamType.BIDIRECTIONAL, vi.fn(), vi.fn())
      ).toThrow(BadParametersException);
    });

    it('throws BadParametersException for a whitespace-only remoteUrl', () => {
      expect(
        () => new StreamConnector('   ', StreamType.BIDIRECTIONAL, vi.fn(), vi.fn())
      ).toThrow(BadParametersException);
    });

    it('throws BadParametersException for an invalid URL', () => {
      expect(
        () => new StreamConnector('not-a-url', StreamType.BIDIRECTIONAL, vi.fn(), vi.fn())
      ).toThrow(BadParametersException);
    });

    it('accepts a valid bidirectional config', () => {
      expect(
        () =>
          new StreamConnector('wss://example.com', StreamType.BIDIRECTIONAL, vi.fn(), vi.fn())
      ).not.toThrow();
    });
  });

  describe('bridgeStream', () => {
    it('relays a message from callWs to remoteWs when remoteWs is open', async () => {
      const callStreamHandler = vi.fn().mockResolvedValue(['hello', StreamOP.RELAY]);
      const remoteStreamHandler = vi.fn();
      const connector = new StreamConnector(
        'wss://example.com',
        StreamType.BIDIRECTIONAL,
        callStreamHandler,
        remoteStreamHandler
      );

      const callWs = new MockWebSocket('ws://call');
      const remoteWs = (await connector.bridgeStream(callWs as any)) as unknown as InstanceType<typeof MockWebSocket>;
      remoteWs.readyState = MockWebSocket.OPEN;

      callWs.emit('message', { data: 'incoming-audio' });
      await vi.waitFor(() => expect(callStreamHandler).toHaveBeenCalledWith('incoming-audio'));

      expect(remoteWs.send).toHaveBeenCalledWith('hello');
    });

    it('buffers a message when remoteWs is not open, then flushes on open', async () => {
      const callStreamHandler = vi.fn().mockResolvedValue(['queued-msg', StreamOP.RELAY]);
      const connector = new StreamConnector(
        'wss://example.com',
        StreamType.BIDIRECTIONAL,
        callStreamHandler,
        vi.fn()
      );

      const callWs = new MockWebSocket('ws://call');
      const remoteWs = (await connector.bridgeStream(callWs as any)) as unknown as InstanceType<typeof MockWebSocket>;
      remoteWs.readyState = MockWebSocket.CONNECTING;

      callWs.emit('message', { data: 'incoming-audio' });
      await vi.waitFor(() => expect(callStreamHandler).toHaveBeenCalled());

      expect(remoteWs.send).not.toHaveBeenCalled();

      remoteWs.readyState = MockWebSocket.OPEN;
      remoteWs.emit('open');

      expect(remoteWs.send).toHaveBeenCalledWith('queued-msg');
    });

    it('closes both sockets when call handler returns STOP', async () => {
      const callStreamHandler = vi.fn().mockResolvedValue(['', StreamOP.STOP]);
      const connector = new StreamConnector(
        'wss://example.com',
        StreamType.BIDIRECTIONAL,
        callStreamHandler,
        vi.fn()
      );

      const callWs = new MockWebSocket('ws://call');
      const remoteWs = (await connector.bridgeStream(callWs as any)) as unknown as InstanceType<typeof MockWebSocket>;

      callWs.emit('message', { data: 'stop-signal' });
      await vi.waitFor(() => expect(remoteWs.close).toHaveBeenCalled());

      expect(callWs.close).toHaveBeenCalled();
    });

    it('relays a message from remoteWs to callWs', async () => {
      const remoteStreamHandler = vi.fn().mockResolvedValue(['ai-response', StreamOP.RELAY]);
      const connector = new StreamConnector(
        'wss://example.com',
        StreamType.BIDIRECTIONAL,
        vi.fn(),
        remoteStreamHandler
      );

      const callWs = new MockWebSocket('ws://call');
      const remoteWs = (await connector.bridgeStream(callWs as any)) as unknown as InstanceType<typeof MockWebSocket>;

      remoteWs.emit('message', { data: 'model-audio-chunk' });
      await vi.waitFor(() => expect(remoteStreamHandler).toHaveBeenCalledWith('model-audio-chunk'));

      expect(callWs.send).toHaveBeenCalledWith('ai-response');
    });

    it('closes callWs when remoteWs closes', async () => {
      const connector = new StreamConnector(
        'wss://example.com',
        StreamType.BIDIRECTIONAL,
        vi.fn(),
        vi.fn()
      );
      const callWs = new MockWebSocket('ws://call');
      const remoteWs = (await connector.bridgeStream(callWs as any)) as unknown as InstanceType<typeof MockWebSocket>;

      remoteWs.emit('close', { code: 1000, reason: 'done' });

      expect(callWs.close).toHaveBeenCalled();
    });

    it('closes remoteWs when callWs closes', async () => {
      const connector = new StreamConnector(
        'wss://example.com',
        StreamType.BIDIRECTIONAL,
        vi.fn(),
        vi.fn()
      );
      const callWs = new MockWebSocket('ws://call');
      const remoteWs = (await connector.bridgeStream(callWs as any)) as unknown as InstanceType<typeof MockWebSocket>;

      callWs.emit('close', { code: 1000, reason: 'done' });

      expect(remoteWs.close).toHaveBeenCalled();
    });

    it('drops messages when the buffer queue is full', async () => {
      const callStreamHandler = vi.fn().mockResolvedValue(['overflow-msg', StreamOP.RELAY]);
      const connector = new StreamConnector(
        'wss://example.com',
        StreamType.BIDIRECTIONAL,
        callStreamHandler,
        vi.fn()
      );

      const callWs = new MockWebSocket('ws://call');
      const remoteWs = (await connector.bridgeStream(callWs as any)) as unknown as InstanceType<typeof MockWebSocket>;
      remoteWs.readyState = MockWebSocket.CONNECTING;

      for (let i = 0; i < 101; i++) {
        callWs.emit('message', { data: `msg-${i}` });
        await vi.waitFor(() => expect(callStreamHandler).toHaveBeenCalledTimes(i + 1));
      }

      expect(remoteWs.send).not.toHaveBeenCalled();
    });

    it('handles non-string binary data from remoteWs (array of buffers)', async () => {
      const remoteStreamHandler = vi.fn().mockResolvedValue(['reply', StreamOP.RELAY]);
      const connector = new StreamConnector(
        'wss://example.com',
        StreamType.BIDIRECTIONAL,
        vi.fn(),
        remoteStreamHandler
      );

      const callWs = new MockWebSocket('ws://call');
      await connector.bridgeStream(callWs as any);
      const remoteWs = MockWebSocket.instances[MockWebSocket.instances.length - 1];

      const chunks = [Buffer.from('a'), Buffer.from('b')];
      remoteWs.emit('message', { data: chunks });

      await vi.waitFor(() =>
        expect(remoteStreamHandler).toHaveBeenCalledWith(Buffer.concat(chunks))
      );
    });

    it('closes callWs when remoteWs errors', async () => {
      const connector = new StreamConnector(
        'wss://example.com',
        StreamType.BIDIRECTIONAL,
        vi.fn(),
        vi.fn()
      );
      const callWs = new MockWebSocket('ws://call');
      const remoteWs = (await connector.bridgeStream(callWs as any)) as unknown as InstanceType<typeof MockWebSocket>;

      remoteWs.emit('error', new Error('connection reset'));

      expect(callWs.close).toHaveBeenCalled();
    });

    it('closes remoteWs when callWs errors', async () => {
      const connector = new StreamConnector(
        'wss://example.com',
        StreamType.BIDIRECTIONAL,
        vi.fn(),
        vi.fn()
      );
      const callWs = new MockWebSocket('ws://call');
      const remoteWs = (await connector.bridgeStream(callWs as any)) as unknown as InstanceType<typeof MockWebSocket>;

      callWs.emit('error', new Error('connection reset'));

      expect(remoteWs.close).toHaveBeenCalled();
    });

    it('handles an invalid response from the call stream handler without throwing', async () => {
      const callStreamHandler = vi.fn().mockRejectedValue(new Error('handler exploded'));
      const connector = new StreamConnector(
        'wss://example.com',
        StreamType.BIDIRECTIONAL,
        callStreamHandler,
        vi.fn()
      );
      const callWs = new MockWebSocket('ws://call');
      await connector.bridgeStream(callWs as any);

      expect(() => callWs.emit('message', { data: 'bad-input' })).not.toThrow();
      await vi.waitFor(() => expect(callStreamHandler).toHaveBeenCalled());
    });

    it('handles an invalid response from the remote stream handler without throwing', async () => {
      const remoteStreamHandler = vi.fn().mockRejectedValue(new Error('handler exploded'));
      const connector = new StreamConnector(
        'wss://example.com',
        StreamType.BIDIRECTIONAL,
        vi.fn(),
        remoteStreamHandler
      );
      const callWs = new MockWebSocket('ws://call');
      await connector.bridgeStream(callWs as any);
      const remoteWs = MockWebSocket.instances[MockWebSocket.instances.length - 1];

      expect(() => remoteWs.emit('message', { data: 'bad-input' })).not.toThrow();
      await vi.waitFor(() => expect(remoteStreamHandler).toHaveBeenCalled());
    });

    it('closes both sockets when remote handler returns STOP', async () => {
      const remoteStreamHandler = vi.fn().mockResolvedValue(['', StreamOP.STOP]);
      const connector = new StreamConnector(
        'wss://example.com',
        StreamType.BIDIRECTIONAL,
        vi.fn(),
        remoteStreamHandler
      );

      const callWs = new MockWebSocket('ws://call');
      const remoteWs = (await connector.bridgeStream(callWs as any)) as unknown as InstanceType<typeof MockWebSocket>;

      remoteWs.emit('message', { data: 'stop-signal-from-remote' });
      await vi.waitFor(() => expect(callWs.close).toHaveBeenCalled());

      expect(remoteWs.close).toHaveBeenCalled();
    });

    it('converts non-string call data to a string via toString', async () => {
    const callStreamHandler = vi.fn().mockResolvedValue(['reply', StreamOP.RELAY]);
    const connector = new StreamConnector(
      'wss://example.com',
      StreamType.BIDIRECTIONAL,
      callStreamHandler,
      vi.fn()
    );
  
    const callWs = new MockWebSocket('ws://call');
    await connector.bridgeStream(callWs as any);
  
    const bufferPayload = Buffer.from('binary-audio-chunk', 'utf-8');
    callWs.emit('message', { data: bufferPayload });
  
    await vi.waitFor(() =>
      expect(callStreamHandler).toHaveBeenCalledWith(bufferPayload.toString('utf-8'))
    );
  });
  
  it('does not queue a buffered message when the handler returns non-string data', async () => {
    const callStreamHandler = vi.fn().mockResolvedValue([Buffer.from('binary'), StreamOP.RELAY]);
    const connector = new StreamConnector(
      'wss://example.com',
      StreamType.BIDIRECTIONAL,
      callStreamHandler,
      vi.fn()
    );
  
    const callWs = new MockWebSocket('ws://call');
    const remoteWs = (await connector.bridgeStream(callWs as any)) as unknown as InstanceType<typeof MockWebSocket>;
    remoteWs.readyState = MockWebSocket.CONNECTING;
  
    callWs.emit('message', { data: 'trigger' });
    await vi.waitFor(() => expect(callStreamHandler).toHaveBeenCalled());
    expect(remoteWs.send).not.toHaveBeenCalled();
  });
  
  it('uses default streamType and headers when not explicitly provided', () => {
    expect(
      () =>
        new (StreamConnector as any)(
          'wss://example.com',
          undefined,
          vi.fn(),
          vi.fn(),
          undefined
        )
    ).not.toThrow();
  });
});
});