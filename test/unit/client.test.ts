import { describe, it, expect, vi } from 'vitest';
import { Client } from '@/client';
import { BadParametersException } from '@/exceptions';

describe('Client (unit)', () => {
  it('initializes successfully with a valid API key', () => {
    const client = new Client('valid_key_123');
    expect(client).toBeDefined();
    expect(client.secrets).toBeDefined();
    expect(client.virtualNumbers).toBeDefined();
    expect(client.sip).toBeDefined();
    expect(client.events).toBeDefined();
    expect(client.recordings).toBeDefined();
    expect(client.voice).toBeDefined();
  });

  it('throws BadParametersException when initialized without an API key', () => {
    expect(() => new Client('')).toThrow(BadParametersException);
    expect(() => new Client('')).toThrow(
      'Missing Teler API Key.',
    );
  });

  it('accepts a custom baseURL option', () => {
    expect(() => new Client('valid_key_123', { baseURL: 'https://sandbox.frejun.ai/api/v1' })).not.toThrow();
  });

  it('defaults to a silent logger when none is provided', () => {
    const client = new Client('valid_key_123');
    expect(client.logger).toBeDefined();
    expect(client.logger.info).toBeDefined();
    expect(client.logger.warn).toBeDefined();
    expect(client.logger.error).toBeDefined();
  });

  it('accepts a custom logger option', () => {
    const customLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    const client = new Client('valid_key_123', { logger: customLogger });
    expect(client.logger).toBe(customLogger);
  });
});
