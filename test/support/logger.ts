import { vi } from 'vitest';


vi.mock('pino', () => {
  const noop = vi.fn();
  const logger = { info: noop, warn: noop, error: noop, debug: noop, trace: noop, fatal: noop };
  return { default: vi.fn(() => logger), __mockLogger: logger };
});