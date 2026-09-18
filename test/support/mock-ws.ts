import { vi } from "vitest";

export class MockWebSocket {
  static OPEN = 1;
  static CONNECTING = 0;
  static instances: MockWebSocket[] = [];

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

  emit(event: string, payload?: unknown) {
    this.listeners[event]?.forEach((cb) => cb(payload));
  }

  static reset() {
    MockWebSocket.instances = [];
  }
}
